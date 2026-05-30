const {onRequest} = require("firebase-functions/v2/https");
const {onDocumentCreated, onDocumentUpdated} = require("firebase-functions/v2/firestore");
const crypto = require("crypto");
const sgMail = require("@sendgrid/mail");
const admin = require("firebase-admin");
if (!admin.apps.length) admin.initializeApp();

// Sonnet 4.6 pricing per million tokens
const PRICE_INPUT  = 3.00;
const PRICE_OUTPUT = 15.00;

const JOURNEY_COMPANION_VOICE_PROMPT = `You are the ToolSpark Journey Companion, now running as a live voice conversation.

You are a warm, direct clarity coach and accountability partner who guides members through Course 1. Your job is to help them get crystal clear on who they help, who they serve, and what tool to build, then hand them off to the Build Agent ready to go.

You are NOT a general chat assistant.
You are NOT a therapist.
You are NOT a coding helper.
You are NOT the Build Agent.
You have ONE job: guide them through the three clarity tools, process their results until they truly own them, and hand them off to the Build Agent with a committed tool choice.

VOICE BEHAVIOR
- Speak naturally, warmly, and briefly.
- Ask one question at a time.
- Do not give long speeches.
- Keep each spoken response focused on a single next step.
- If they drift, redirect them kindly but immediately.

SESSION OPENING
- Open first. Do not wait for the user to speak before greeting them.
- Start by naming the mission of the conversation in one sentence.
- Then acknowledge what you already know from their progress data.
- Then ask one grounded first question.
- Never ask them to recap information that is already in the provided context.

COURSE 1 FLOW
- If Find Your Spark is not complete, send them to spark.html.
- If Spark is complete but Course 1 is not finished, keep them moving through clarity work one step at a time.
- If Course 1 is complete, hand them off to build-agent.html.

CONVERSATION RULES
- One question at a time.
- Every response ends with one specific action.
- Never leave them with nowhere to go.
- Never help with code or technical problems.
- Never discuss pricing or business strategy.
- Never let them stay stuck on one phase for more than three exchanges.
- Celebrate progress genuinely, then move them forward.

TONE
Warm but firm. Like a trusted friend who believes in them completely and has zero patience for self-sabotage.`;

function buildJourneyVoiceInstructions({firstName, contextBlock}) {
  const intro = firstName ? `The member's first name is ${firstName}. Use it occasionally, not every turn.` : "";
  return [JOURNEY_COMPANION_VOICE_PROMPT, intro, contextBlock || ""]
    .filter(Boolean)
    .join("\n\n");
}

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

// ── GRADUATION TRIGGER ──────────────────────────────────────────────────────
exports.journeyVoiceToken = onRequest({
  cors: true,
  invoker: "public",
  secrets: ["OPENAI_KEY"]
}, async (req, res) => {
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const contextBlock = typeof req.body?.contextBlock === "string" ?
      req.body.contextBlock.slice(0, 6000) : "";
    const firstName = typeof req.body?.firstName === "string" ?
      req.body.firstName.slice(0, 80) : "";
    const safetyId = crypto.createHash("sha256").update(decoded.uid).digest("hex");

    const response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_KEY}`,
        "OpenAI-Safety-Identifier": safetyId,
      },
      body: JSON.stringify({
        expires_after: {
          anchor: "created_at",
          seconds: 300,
        },
        session: {
          type: "realtime",
          model: "gpt-realtime",
          instructions: buildJourneyVoiceInstructions({firstName, contextBlock}),
          output_modalities: ["audio"],
          tool_choice: "none",
          max_output_tokens: 700,
          audio: {
            input: {
              turn_detection: {
                type: "server_vad",
                create_response: true,
                interrupt_response: true,
              },
              transcription: {
                model: "gpt-4o-mini-transcribe",
                language: "en",
              },
            },
            output: {
              voice: "marin",
            },
          },
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error(JSON.stringify({
        event: "journey_voice_token_failed",
        uid: decoded.uid,
        status: response.status,
        error: data,
      }));
      res.status(response.status).json({
        error: data.error?.message || "Failed to create voice session",
      });
      return;
    }

    const clientSecretValue = data.client_secret?.value || data.value || null;
    const clientSecretExpiresAt = data.client_secret?.expires_at || data.expires_at || null;

    console.log(JSON.stringify({
      event: "journey_voice_token_created",
      uid: decoded.uid,
      expiresAt: clientSecretExpiresAt,
    }));

    res.status(200).json({
      client_secret: clientSecretValue ? {
        value: clientSecretValue,
        expires_at: clientSecretExpiresAt,
      } : null,
      value: clientSecretValue,
      expires_at: clientSecretExpiresAt,
      session: data.session,
    });
  } catch (err) {
    console.error(JSON.stringify({
      event: "journey_voice_token_error",
      message: err.message,
    }));
    res.status(500).json({ error: err.message });
  }
});

exports.onGraduation = onDocumentUpdated({
  document: "users/{uid}",
  secrets: ["SENDGRID_API_KEY"],
}, async (event) => {
  const before = event.data.before.data();
  const after  = event.data.after.data();
  const uid    = event.params.uid;

  if (before.certified === true) return; // already processed

  const conditionsMet =
    after.course1Complete  === true &&
    after.course2Complete  === true &&
    after.toolBuilt        === true &&
    after.toolSubmitted    === true &&
    (after.feedbackCount   || 0) >= 3 &&
    after.profileComplete  === true;

  if (!conditionsMet) return;

  console.log(JSON.stringify({ event: "graduation_triggered", uid }));

  const now      = admin.firestore.FieldValue.serverTimestamp();
  const name     = after.displayName || after.firstName || "A member";
  const toolName = after.toolName    || "their tool";
  const email    = after.email;

  // 1. Update profile
  await admin.firestore().collection("users").doc(uid).update({
    certified:           true,
    certifiedDate:       now,
    marketplaceUnlocked: true,
    badgeUnlocked:       true,
  });

  // 2. Community post
  await admin.firestore().collection("communityPosts").add({
    type:      "graduation",
    content:   `🎓 ${name} just earned their ToolSpark Certified Builder badge. ${toolName} is now live on the marketplace. Go check it out →`,
    uid, name, toolName,
    createdAt: now,
    automated: true,
  });

  // 3. Congratulations email
  if (!email) return;
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const firstName = after.firstName || after.displayName || "there";

  try {
    await sgMail.send({
      to:      email,
      from:    { name: "Coena @ ToolSpark", email: "support@toolspark.co" },
      subject: `You did it, ${firstName} 🎓`,
      html: `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0C0B09;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px;">
<table width="520" cellpadding="0" cellspacing="0" style="background:#141210;border:1px solid #2A2720;border-radius:16px;overflow:hidden;">
  <tr><td style="padding:40px 40px 32px;text-align:center;border-bottom:1px solid #2A2720;">
    <div style="font-family:Georgia,serif;font-size:26px;color:#F2EEE6;">Tool<span style="color:#C9A84C;">Spark</span></div>
    <div style="font-size:10px;color:#5A5650;text-transform:uppercase;letter-spacing:0.16em;margin-top:4px;">Builder Platform</div>
  </td></tr>
  <tr><td style="padding:40px;">
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;background:rgba(201,168,76,0.12);border:1px solid rgba(201,168,76,0.3);border-radius:100px;padding:6px 18px;font-size:11px;font-weight:700;color:#C9A84C;text-transform:uppercase;letter-spacing:0.12em;">ToolSpark Certified Builder</div>
    </div>
    <h1 style="font-family:Georgia,serif;font-size:30px;font-weight:400;color:#F2EEE6;text-align:center;margin:0 0 16px;line-height:1.3;">You did it, ${firstName}.</h1>
    <p style="font-size:15px;color:#9A9488;line-height:1.75;text-align:center;margin:0 0 24px;">
      <em style="color:#E8D5A3;">${toolName}</em> is officially certified and live on the marketplace. This is a big deal — you built something real.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 32px;">
      <a href="https://toolspark.co/graduation.html" style="display:inline-block;background:#C9A84C;color:#0C0B09;font-size:15px;font-weight:700;text-decoration:none;border-radius:8px;padding:14px 32px;letter-spacing:0.02em;">View Your Celebration Page →</a>
    </td></tr></table>
    <p style="font-size:13px;color:#5A5650;text-align:center;line-height:1.7;margin:0;">
      You can download your certificate and choose how you'd like to receive it on your celebration page.
    </p>
  </td></tr>
  <tr><td style="padding:20px 40px;border-top:1px solid #2A2720;text-align:center;">
    <p style="font-size:11px;color:#5A5650;margin:0;line-height:1.6;">
      © 2025 ToolSpark · <a href="https://toolspark.co/privacy-policy.html" style="color:#9A9488;text-decoration:none;">Privacy</a>
    </p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`,
    });
    console.log(JSON.stringify({ event: "graduation_email_sent", uid, email }));
  } catch (err) {
    console.error(JSON.stringify({ event: "graduation_email_failed", uid, message: err.message, response: err.response?.body }));
  }
});

// ── DELIVER CERTIFICATE (called from graduation page) ────────────────────────
exports.deliverCertificate = onRequest({
  cors: true,
  invoker: "public",
  secrets: ["SENDGRID_API_KEY"],
}, async (req, res) => {
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) { res.status(401).json({ error: "Unauthorized" }); return; }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    const uid = decoded.uid;

    const userDoc = await admin.firestore().collection("users").doc(uid).get();
    if (!userDoc.exists) { res.status(404).json({ error: "User not found" }); return; }

    const user = userDoc.data();
    if (!user.certified) { res.status(403).json({ error: "Not certified" }); return; }

    const email     = user.email;
    const firstName = user.firstName || user.displayName || "there";
    const toolName  = user.toolName  || "your tool";

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    await sgMail.send({
      to:      email,
      from:    { name: "Coena @ ToolSpark", email: "support@toolspark.co" },
      subject: `Your ToolSpark Certificate, ${firstName}`,
      html: `
<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0C0B09;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px;">
<table width="520" cellpadding="0" cellspacing="0" style="background:#141210;border:1px solid #2A2720;border-radius:16px;overflow:hidden;">
  <tr><td style="padding:40px 40px 32px;text-align:center;border-bottom:1px solid #2A2720;">
    <div style="font-family:Georgia,serif;font-size:26px;color:#F2EEE6;">Tool<span style="color:#C9A84C;">Spark</span></div>
  </td></tr>
  <tr><td style="padding:40px;text-align:center;">
    <p style="font-size:15px;color:#9A9488;line-height:1.75;margin:0 0 28px;">Here is your ToolSpark Certified Builder certificate, ${firstName}. You earned it.</p>
    <a href="https://toolspark.co/certificate.html" style="display:inline-block;background:#C9A84C;color:#0C0B09;font-size:15px;font-weight:700;text-decoration:none;border-radius:8px;padding:14px 32px;">View & Download Certificate →</a>
    <p style="font-size:12px;color:#5A5650;margin:28px 0 0;line-height:1.6;">Open the link above to view and download your printable PDF certificate for <em style="color:#9A9488;">${toolName}</em>.</p>
  </td></tr>
  <tr><td style="padding:20px 40px;border-top:1px solid #2A2720;text-align:center;">
    <p style="font-size:11px;color:#5A5650;margin:0;">© 2025 ToolSpark</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`,
    });

    await admin.firestore().collection("users").doc(uid).update({ certificateEmailSent: true });
    console.log(JSON.stringify({ event: "certificate_email_sent", uid, email }));
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(JSON.stringify({ event: "deliver_certificate_failed", message: err.message }));
    res.status(500).json({ error: err.message });
  }
});

exports.deleteAccount = onRequest({
  cors: true,
  invoker: "public",
}, async (req, res) => {
  if (req.method === "OPTIONS") { res.status(204).send(""); return; }

  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) { res.status(401).json({ error: "Unauthorized" }); return; }

  let uid, email;
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    uid = decoded.uid;
    email = decoded.email || "";
  } catch {
    res.status(401).json({ error: "Invalid token" }); return;
  }

  const db = admin.firestore();

  async function deleteBatch(query) {
    const snap = await query.get();
    if (snap.empty) return;
    const batch = db.batch();
    snap.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  }

  try {
    await db.collection("users").doc(uid).delete();
    await deleteBatch(db.collection("spark_profiles").where("email", "==", email));
    await deleteBatch(db.collection("spark_results").where("userId", "==", uid));
    await deleteBatch(db.collection("clarity_sessions").where("userId", "==", uid));
    await deleteBatch(db.collection("notifications").where("userId", "==", uid));
    await deleteBatch(db.collection("threads").where("authorId", "==", uid));
    await deleteBatch(db.collection("agent_sessions").where("userId", "==", uid));
    await deleteBatch(db.collection("audience_tool").where("userId", "==", uid));
    await deleteBatch(db.collection("audits").where("userId", "==", uid));

    // userProgress docs are keyed uid_courseId — range query on doc ID
    const progressSnap = await db.collection("userProgress")
      .where(admin.firestore.FieldPath.documentId(), ">=", uid + "_")
      .where(admin.firestore.FieldPath.documentId(), "<=", uid + "_")
      .get();
    if (!progressSnap.empty) {
      const batch = db.batch();
      progressSnap.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();
    }

    await admin.auth().deleteUser(uid);

    console.log(JSON.stringify({ event: "account_deleted", uid }));
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(JSON.stringify({ event: "delete_account_failed", uid, message: err.message }));
    res.status(500).json({ error: err.message });
  }
});

exports.onNewMemberSignup = onDocumentCreated({
  document: "users/{uid}",
  secrets: ["SENDGRID_API_KEY"],
}, async (event) => {
  const data = event.data.data();
  const email = data.userEmail || data.clientEmail || '';
  const displayName = data.displayName || '';
  const firstName = displayName.split(' ')[0] || 'there';

  console.log(JSON.stringify({ event: "new_member_signup_triggered", email }));

  if (!email) {
    console.error("onNewMemberSignup: no email in user document");
    return;
  }

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  try {
    await sgMail.send({
      to: email,
      from: { name: "Coena @ ToolSpark", email: "support@toolspark.co" },
      templateId: "d-7f60caa60ebc4bbbb04978be5d4960b0",
      dynamicTemplateData: { firstName },
    });
    console.log(JSON.stringify({ event: "new_member_welcome_email_sent", email }));
  } catch (err) {
    console.error(JSON.stringify({
      event: "new_member_welcome_email_failed",
      email,
      status: err.code,
      message: err.message,
      response: err.response?.body,
    }));
    throw err;
  }
});

exports.onWaitlistSignup = onDocumentCreated({
  document: "waitlist/{email}",
  secrets: ["SENDGRID_API_KEY"],
}, async (event) => {
  const data = event.data.data();
  const { name, email } = data;

  console.log(JSON.stringify({ event: "waitlist_signup_triggered", email, name }));

  if (!email) {
    console.error("onWaitlistSignup: no email in document data");
    return;
  }

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const firstName = name || "there";

  try {
    await sgMail.send({
      to: email,
      from: { name: "Coena @ ToolSpark", email: "support@toolspark.co" },
      templateId: "d-0bdf7ef6978d498385eb8c0ac3745c5c",
      dynamicTemplateData: { firstName },
    });
    console.log(JSON.stringify({ event: "waitlist_email_sent", email }));
  } catch (err) {
    console.error(JSON.stringify({
      event: "waitlist_email_failed",
      email,
      status: err.code,
      message: err.message,
      response: err.response?.body,
    }));
    throw err;
  }
});
