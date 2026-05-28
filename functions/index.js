const {onRequest} = require("firebase-functions/v2/https");
const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const sgMail = require("@sendgrid/mail");

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

exports.onWaitlistSignup = onDocumentCreated({
  document: "waitlist/{email}",
  secrets: ["SENDGRID_API_KEY"],
}, async (event) => {
  const data = event.data.data();
  const { name, email } = data;
  if (!email) return;

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const firstName = name || "there";

  await sgMail.send({
    to: email,
    from: { name: "ToolSpark", email: "hello@toolspark.com" },
    subject: "You're on the ToolSpark waitlist ✦",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F4F1EC;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F1EC;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:#0F0E0C;border-radius:12px 12px 0 0;padding:36px 40px;text-align:center;">
          <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.15em;color:#C9A84C;text-transform:uppercase;">TOOLSPARK</p>
          <p style="margin:0;font-size:26px;font-weight:400;color:#F0EDE6;line-height:1.3;">You're on the list.</p>
          <p style="margin:8px 0 0;font-size:13px;color:#7A7870;">Early access confirmed ✦</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;padding:36px 40px 24px;">
          <p style="margin:0 0 16px;font-size:16px;color:#1A1714;">Hey ${firstName},</p>
          <p style="margin:0 0 16px;font-size:15px;color:#4A4640;line-height:1.7;">You just claimed your spot on the ToolSpark waitlist — and we're genuinely excited to have you here.</p>
          <p style="margin:0 0 16px;font-size:15px;color:#4A4640;line-height:1.7;">ToolSpark is a platform for coaches, creators, and consultants who are ready to stop dabbling with AI and actually <strong>build something</strong> — a real tool, for real clients, that runs on autopilot.</p>
          <p style="margin:0 0 24px;font-size:15px;color:#4A4640;line-height:1.7;">When doors open, you'll be the first to know.</p>
          <hr style="border:none;border-top:1px solid #E2DDD5;margin:0 0 24px;">
          <p style="margin:0 0 8px;font-size:15px;color:#4A4640;line-height:1.7;">Your idea is worth building. We'll see you inside.</p>
          <p style="margin:0;font-size:15px;color:#1A1714;">— The ToolSpark Team</p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#0F0E0C;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;">
          <p style="margin:0 0 6px;font-size:12px;color:#5C5A55;">Powered by <span style="color:#C9A84C;">ToolSpark</span></p>
          <p style="margin:0;font-size:11px;color:#3C3A35;line-height:1.6;">You're receiving this because you joined the ToolSpark waitlist.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
  });
});
