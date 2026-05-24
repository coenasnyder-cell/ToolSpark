const {onRequest} = require("firebase-functions/v2/https");

// Sonnet 4.6 pricing per million tokens
const PRICE_INPUT  = 3.00;
const PRICE_OUTPUT = 15.00;

exports.tts = onRequest({
  cors: true,
  invoker: "public",
  secrets: ["OPENAI_KEY"]
}, async (req, res) => {
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }

  const text = (req.body.text || "").trim();
  if (!text) { res.status(400).json({ error: "No text provided" }); return; }

  try {
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_KEY}`
      },
      body: JSON.stringify({ model: "tts-1-hd", voice: "nova", input: text })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      res.status(response.status).json({ error: err.error?.message || "TTS failed" });
      return;
    }

    const audio = await response.arrayBuffer();
    res.set("Content-Type", "audio/mpeg");
    res.set("Cache-Control", "private, max-age=86400");
    res.status(200).send(Buffer.from(audio));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

exports.analyze = onRequest({
  cors: true,
  invoker: "public",
  secrets: ["ANTHROPIC_KEY"]
}, async (req, res) => {
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  try {
    // Extract tracking metadata — not forwarded to Anthropic
    const { _meta, ...anthropicBody } = req.body;
    const tool      = _meta?.tool      || "unknown";
    const sessionId = _meta?.sessionId || "unknown";
    const userId    = _meta?.userId    || null;

    // Attach Anthropic's official user tracking field
    if (sessionId !== "unknown") {
      anthropicBody.metadata = { user_id: sessionId };
    }

    console.log(JSON.stringify({
      event: "api_call",
      tool,
      sessionId,
      userId,
      model: anthropicBody.model || "unknown",
      timestamp: new Date().toISOString()
    }));

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(anthropicBody),
    });

    const data = await response.json();

    // Log token usage and estimated cost
    if (data.usage) {
      const inputTokens  = data.usage.input_tokens  || 0;
      const outputTokens = data.usage.output_tokens || 0;
      const costUsd = (inputTokens / 1_000_000 * PRICE_INPUT) +
                      (outputTokens / 1_000_000 * PRICE_OUTPUT);

      console.log(JSON.stringify({
        event: "api_usage",
        tool,
        sessionId,
        userId,
        inputTokens,
        outputTokens,
        costUsd: parseFloat(costUsd.toFixed(6)),
        timestamp: new Date().toISOString()
      }));
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({error: err.message});
  }
});
