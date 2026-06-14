const {onRequest} = require("firebase-functions/v2/https");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const crypto = require("crypto");
const fetch = require("node-fetch");

const CRM_WORKSPACE_ID = "toolspark-internal";
const CRM_OWNER_TYPE = "internal";
const CRM_CONTACTS = "crm_contacts";
const CRM_PIPES = "crm_pipelines";
const CRM_STAGES = "crm_stages";
const CRM_EVENTS = "crm_contact_events";
const CRM_NOTES = "crm_notes";
const CRM_TAGS = "crm_tags";
const CRM_SEQUENCES = "crm_sequences";
const CRM_STEPS = "crm_sequence_steps";
const CRM_ENROLLMENTS = "crm_sequence_enrollments";
const CRM_CAMPAIGN_EVENTS = "crm_campaign_events";
const CRM_RULES = "crm_automation_rules";
const CRM_WORKSPACES = "crm_workspaces";

const DEFAULT_STAGES = [
  {id: "stage_new", name: "New", color: "#C9A84C", order: 1},
  {id: "stage_contacted", name: "Contacted", color: "#936B42", order: 2},
  {id: "stage_qualified", name: "Qualified", color: "#2A7A55", order: 3},
  {id: "stage_proposal", name: "Proposal", color: "#3E6B9C", order: 4},
  {id: "stage_won", name: "Won", color: "#2D8A65", order: 5},
  {id: "stage_lost", name: "Lost", color: "#A05A4A", order: 6},
];

const DEFAULT_TAGS = [
  {id: "tag_toolfinder", name: "Tool Finder", slug: "toolfinder", color: "#C9A84C"},
  {id: "tag_waitlist", name: "Waitlist", slug: "waitlist", color: "#7D5BA6"},
  {id: "tag_signup", name: "Signup", slug: "signup", color: "#3E6B9C"},
  {id: "tag_qualified", name: "Qualified", slug: "qualified", color: "#2A7A55"},
];

const DEFAULT_SEQUENCES = [
  {
    id: "sequence_tfinder_nurture",
    name: "Tool Finder Nurture",
    description: "Warm follow-up for Tool Finder leads who are exploring what to build next.",
    groupKey: "sales",
    active: true,
    allowUnknownConsent: true,
    steps: [
      {
        stepOrder: 1,
        delayHours: 0,
        subject: "Your Tool Finder result is only the beginning",
        previewText: "A simple next step so this does not stay an interesting idea.",
        bodyHtml: `
          <p style="font-size:16px;color:#1A1714;line-height:1.75;margin:0 0 16px;">
            Your Tool Finder result gave you a direction. The real win is turning that direction into something people can actually use.
          </p>
          <p style="font-size:16px;color:#1A1714;line-height:1.75;margin:0 0 16px;">
            Start with the smallest version of the tool that creates one concrete outcome for one kind of person. Clarity beats complexity every time.
          </p>`,
        ctaLabel: "Open ToolSpark",
        ctaUrl: "https://toolspark.co/signup.html",
      },
      {
        stepOrder: 2,
        delayHours: 48,
        subject: "The fastest way to make your idea feel real",
        previewText: "Use one tiny promise, one audience, one first result.",
        bodyHtml: `
          <p style="font-size:16px;color:#1A1714;line-height:1.75;margin:0 0 16px;">
            Most good ideas stall because they try to solve too much at once.
          </p>
          <p style="font-size:16px;color:#1A1714;line-height:1.75;margin:0 0 16px;">
            Pick one audience, one promise, and one simple first version. That is usually enough to move from “thinking about it” to “showing it to someone.”
          </p>`,
        ctaLabel: "See the roadmap",
        ctaUrl: "https://toolspark.co/roadmap.html",
      },
      {
        stepOrder: 3,
        delayHours: 96,
        subject: "If you want momentum, make the next step tiny",
        previewText: "A small clear move beats a perfect plan every time.",
        bodyHtml: `
          <p style="font-size:16px;color:#1A1714;line-height:1.75;margin:0 0 16px;">
            Here is the move that creates traction fastest: define the exact result your tool gives, then show it to one real person who needs it.
          </p>
          <p style="font-size:16px;color:#1A1714;line-height:1.75;margin:0 0 16px;">
            If you want help turning that into a buildable idea, ToolSpark is designed to get you there without the usual noise.
          </p>`,
        ctaLabel: "Start building",
        ctaUrl: "https://toolspark.co/signup.html",
      },
    ],
  },
  {
    id: "sequence_qualified_followup",
    name: "Qualified Follow-Up",
    description: "Short sequence for leads who have already shown stronger intent.",
    groupKey: "sales",
    active: true,
    allowUnknownConsent: false,
    steps: [
      {
        stepOrder: 1,
        delayHours: 0,
        subject: "You look like a strong fit for ToolSpark",
        previewText: "Here is the cleanest next step if you want help building faster.",
        bodyHtml: `
          <p style="font-size:16px;color:#1A1714;line-height:1.75;margin:0 0 16px;">
            Based on how you came in and what you have engaged with, you look like a strong fit for what ToolSpark is building.
          </p>
          <p style="font-size:16px;color:#1A1714;line-height:1.75;margin:0 0 16px;">
            If you want the shortest path forward, the next move is to step into the platform and turn your idea into a concrete tool plan.
          </p>`,
        ctaLabel: "Explore ToolSpark",
        ctaUrl: "https://toolspark.co/signup.html",
      },
      {
        stepOrder: 2,
        delayHours: 72,
        subject: "Still thinking it over?",
        previewText: "Here is the simple version of what ToolSpark helps you do.",
        bodyHtml: `
          <p style="font-size:16px;color:#1A1714;line-height:1.75;margin:0 0 16px;">
            ToolSpark helps people get clear on what to build, shape it into something useful, and move faster without getting lost in tool chaos.
          </p>
          <p style="font-size:16px;color:#1A1714;line-height:1.75;margin:0 0 16px;">
            If timing is the only thing in the way, keep this email and come back when you are ready to turn the idea into motion.
          </p>`,
        ctaLabel: "See what’s inside",
        ctaUrl: "https://toolspark.co/services.html",
      },
    ],
  },
];

const DEFAULT_RULES = [
  {
    id: "rule_source_tfinder_tag",
    name: "Tag Tool Finder leads",
    description: "Add the Tool Finder tag whenever a Tool Finder lead is created.",
    active: true,
    order: 1,
    triggerType: "source_created",
    matchValue: "toolfinder",
    actionType: "add_tag",
    actionValue: "tag_toolfinder",
  },
  {
    id: "rule_source_waitlist_tag",
    name: "Tag waitlist leads",
    description: "Add the waitlist tag whenever a waitlist lead is created.",
    active: true,
    order: 2,
    triggerType: "source_created",
    matchValue: "waitlist",
    actionType: "add_tag",
    actionValue: "tag_waitlist",
  },
  {
    id: "rule_source_signup_tag",
    name: "Tag signup leads",
    description: "Add the signup tag whenever a signup lead is created.",
    active: true,
    order: 3,
    triggerType: "source_created",
    matchValue: "signup",
    actionType: "add_tag",
    actionValue: "tag_signup",
  },
  {
    id: "rule_tag_tfinder_sequence",
    name: "Enroll Tool Finder nurture",
    description: "Put Tool Finder leads into the nurture sequence automatically.",
    active: true,
    order: 4,
    triggerType: "tag_added",
    matchValue: "tag_toolfinder",
    actionType: "enroll_sequence",
    actionValue: "sequence_tfinder_nurture",
  },
  {
    id: "rule_stage_qualified_tag",
    name: "Tag qualified leads",
    description: "Add the qualified tag once a lead is moved to Qualified.",
    active: true,
    order: 5,
    triggerType: "stage_changed",
    matchValue: "stage_qualified",
    actionType: "add_tag",
    actionValue: "tag_qualified",
  },
  {
    id: "rule_stage_qualified_sequence",
    name: "Enroll qualified follow-up",
    description: "Start the qualified follow-up sequence for qualified leads.",
    active: true,
    order: 6,
    triggerType: "stage_changed",
    matchValue: "stage_qualified",
    actionType: "enroll_sequence",
    actionValue: "sequence_qualified_followup",
  },
  {
    id: "rule_stage_won_stop_sales",
    name: "Stop sales nurture on win",
    description: "Stop active sales sequences when a lead moves to Won.",
    active: true,
    order: 7,
    triggerType: "stage_changed",
    matchValue: "stage_won",
    actionType: "stop_sequence_group",
    actionValue: "sales",
  },
];

function fieldValue() {
  return admin.firestore.FieldValue;
}

function nowTs() {
  return fieldValue().serverTimestamp();
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function hashValue(value) {
  return crypto.createHash("sha1").update(value).digest("hex").slice(0, 16);
}

function contactIdFor(emailLower, workspaceId = CRM_WORKSPACE_ID) {
  return `${workspaceId}__${hashValue(emailLower)}`;
}

function enrollmentIdFor(contactId, sequenceId) {
  return `${contactId}__${sequenceId}`;
}

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === "function") return value.toDate();
  if (typeof value === "string" || typeof value === "number") return new Date(value);
  return null;
}

function serialize(value) {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(serialize);
  if (typeof value === "object") {
    if (typeof value.toDate === "function") {
      const asDate = value.toDate();
      return Number.isNaN(asDate.getTime()) ? null : asDate.toISOString();
    }
    const out = {};
    Object.keys(value).forEach((key) => {
      out[key] = serialize(value[key]);
    });
    return out;
  }
  return value;
}

async function requireAuth(req, res) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    res.status(401).json({error: "Authentication required"});
    return null;
  }
  try {
    return await admin.auth().verifyIdToken(header.slice(7));
  } catch (err) {
    res.status(401).json({error: "Invalid token"});
    return null;
  }
}

async function requireAdmin(req, res) {
  const decoded = await requireAuth(req, res);
  if (!decoded) return null;
  const userDoc = await admin.firestore().collection("users").doc(decoded.uid).get();
  if (!userDoc.exists || userDoc.data().userRole !== "admin") {
    res.status(403).json({error: "Admin access required"});
    return null;
  }
  return decoded;
}

function buildEmailHtml({firstName, previewText, bodyHtml, ctaLabel, ctaUrl, unsubscribeUrl}) {
  const cta = ctaLabel && ctaUrl ? `
    <div style="margin:28px 0 0;">
      <a href="${ctaUrl}" style="display:inline-block;background:#C9A84C;color:#0C0B09;text-decoration:none;padding:12px 18px;border-radius:999px;font-size:14px;font-weight:700;">
        ${ctaLabel}
      </a>
    </div>` : "";

  const preview = previewText ? `
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      ${previewText}
    </div>` : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#F4F2EE;font-family:Georgia,serif;color:#1A1714;">
  ${preview}
  <div style="max-width:620px;margin:0 auto;padding:40px 18px;">
    <div style="background:#ffffff;border:1px solid #E4E0D8;border-radius:24px;overflow:hidden;box-shadow:0 10px 30px rgba(12,11,9,0.08);">
      <div style="padding:22px 28px;border-bottom:1px solid #EFE9DC;background:linear-gradient(135deg,#0C0B09 0%,#181511 100%);">
        <span style="font-size:24px;color:#F7F3E9;">Tool<span style="color:#C9A84C;">Spark</span></span>
      </div>
      <div style="padding:30px 28px 22px;">
        <p style="font-size:17px;line-height:1.7;margin:0 0 18px;">Hey ${firstName || "there"},</p>
        ${bodyHtml || ""}
        ${cta}
      </div>
      <div style="padding:18px 28px 24px;border-top:1px solid #EFE9DC;background:#FBF8F1;">
        <p style="font-size:12px;line-height:1.7;color:#857E75;margin:0 0 8px;">
          You are receiving this because you engaged with ToolSpark. If these marketing emails are not useful, you can unsubscribe anytime.
        </p>
        <p style="font-size:12px;line-height:1.7;color:#857E75;margin:0;">
          <a href="${unsubscribeUrl}" style="color:#857E75;">Unsubscribe</a> ·
          <a href="https://toolspark.co" style="color:#857E75;">toolspark.co</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

async function sendSequenceEmail({to, subject, html}) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Coena at ToolSpark <hello@toolspark.co>",
      reply_to: "coenasnyder@gmail.com",
      to,
      subject,
      html,
    }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(JSON.stringify(result));
  }
  return result;
}

async function logContactEvent(db, contactId, eventType, payload = {}) {
  await db.collection(CRM_EVENTS).add({
    workspaceId: CRM_WORKSPACE_ID,
    contactId,
    eventType,
    summary: payload.summary || "",
    meta: payload.meta || {},
    createdAt: nowTs(),
  });
}

async function ensureCrmDefaults(db) {
  const workspaceRef = db.collection(CRM_WORKSPACES).doc(CRM_WORKSPACE_ID);
  const pipelineRef = db.collection(CRM_PIPES).doc("pipeline_default");
  const workspaceSnap = await workspaceRef.get();
  if (!workspaceSnap.exists) {
    await workspaceRef.set({
      name: "ToolSpark Internal CRM",
      ownerType: CRM_OWNER_TYPE,
      createdAt: nowTs(),
      updatedAt: nowTs(),
    }, {merge: true});
  }

  await pipelineRef.set({
    workspaceId: CRM_WORKSPACE_ID,
    name: "Default Pipeline",
    stageIds: DEFAULT_STAGES.map((stage) => stage.id),
    createdAt: nowTs(),
    updatedAt: nowTs(),
  }, {merge: true});

  const batch = db.batch();
  DEFAULT_STAGES.forEach((stage) => {
    batch.set(db.collection(CRM_STAGES).doc(stage.id), {
      workspaceId: CRM_WORKSPACE_ID,
      pipelineId: "pipeline_default",
      name: stage.name,
      color: stage.color,
      order: stage.order,
      active: true,
      updatedAt: nowTs(),
      createdAt: nowTs(),
    }, {merge: true});
  });
  DEFAULT_TAGS.forEach((tag) => {
    batch.set(db.collection(CRM_TAGS).doc(tag.id), {
      workspaceId: CRM_WORKSPACE_ID,
      name: tag.name,
      slug: tag.slug,
      color: tag.color,
      active: true,
      updatedAt: nowTs(),
      createdAt: nowTs(),
    }, {merge: true});
  });
  DEFAULT_SEQUENCES.forEach((sequence) => {
    batch.set(db.collection(CRM_SEQUENCES).doc(sequence.id), {
      workspaceId: CRM_WORKSPACE_ID,
      name: sequence.name,
      description: sequence.description,
      groupKey: sequence.groupKey,
      active: sequence.active,
      allowUnknownConsent: sequence.allowUnknownConsent,
      createdAt: nowTs(),
      updatedAt: nowTs(),
    }, {merge: true});
    sequence.steps.forEach((step) => {
      batch.set(db.collection(CRM_STEPS).doc(`${sequence.id}__${step.stepOrder}`), {
        workspaceId: CRM_WORKSPACE_ID,
        sequenceId: sequence.id,
        stepOrder: step.stepOrder,
        delayHours: step.delayHours,
        subject: step.subject,
        previewText: step.previewText,
        bodyHtml: step.bodyHtml,
        ctaLabel: step.ctaLabel,
        ctaUrl: step.ctaUrl,
        createdAt: nowTs(),
        updatedAt: nowTs(),
      }, {merge: true});
    });
  });
  DEFAULT_RULES.forEach((rule) => {
    batch.set(db.collection(CRM_RULES).doc(rule.id), {
      workspaceId: CRM_WORKSPACE_ID,
      name: rule.name,
      description: rule.description,
      triggerType: rule.triggerType,
      matchValue: rule.matchValue,
      actionType: rule.actionType,
      actionValue: rule.actionValue,
      order: rule.order,
      active: rule.active,
      createdAt: nowTs(),
      updatedAt: nowTs(),
    }, {merge: true});
  });
  await batch.commit();
}

async function getReferenceData(db) {
  const [stagesSnap, tagsSnap, sequencesSnap, rulesSnap] = await Promise.all([
    db.collection(CRM_STAGES).get(),
    db.collection(CRM_TAGS).get(),
    db.collection(CRM_SEQUENCES).get(),
    db.collection(CRM_RULES).get(),
  ]);
  const stages = stagesSnap.docs.map((doc) => ({id: doc.id, ...doc.data()})).sort((a, b) => (a.order || 0) - (b.order || 0));
  const tags = tagsSnap.docs.map((doc) => ({id: doc.id, ...doc.data()})).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  const sequences = sequencesSnap.docs.map((doc) => ({id: doc.id, ...doc.data()})).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  const rules = rulesSnap.docs.map((doc) => ({id: doc.id, ...doc.data()})).sort((a, b) => (a.order || 0) - (b.order || 0));
  return {stages, tags, sequences, rules};
}

function computeConsent(contact, sequence) {
  if (contact.unsubscribedAt) return {ok: false, reason: "unsubscribed"};
  if (!contact.emailLower) return {ok: false, reason: "missing_email"};
  if (contact.marketingConsent === "transactional_only") return {ok: false, reason: "transactional_only"};
  if (contact.marketingConsent === "marketing_opt_in") return {ok: true};
  if (contact.marketingConsent === "marketing_unknown") {
    return sequence.allowUnknownConsent ? {ok: true} : {ok: false, reason: "consent_unknown"};
  }
  return {ok: false, reason: "consent_unknown"};
}

async function getSequenceSteps(db, sequenceId) {
  const snap = await db.collection(CRM_STEPS).where("sequenceId", "==", sequenceId).get();
  return snap.docs
    .map((doc) => ({id: doc.id, ...doc.data()}))
    .sort((a, b) => (a.stepOrder || 0) - (b.stepOrder || 0));
}

function nextSendAtFromHours(delayHours) {
  const base = new Date();
  return admin.firestore.Timestamp.fromDate(new Date(base.getTime() + (delayHours || 0) * 60 * 60 * 1000));
}

async function stopSequenceGroupForContact(db, contactId, groupKey, reason) {
  const snap = await db.collection(CRM_ENROLLMENTS).where("contactId", "==", contactId).get();
  const batch = db.batch();
  let count = 0;
  snap.docs.forEach((doc) => {
    const data = doc.data();
    const matchesGroup = !groupKey || data.groupKey === groupKey;
    if (matchesGroup && (data.status === "active" || data.status === "ready")) {
      batch.update(doc.ref, {
        status: "stopped",
        stopReason: reason,
        stoppedAt: nowTs(),
        updatedAt: nowTs(),
      });
      count += 1;
    }
  });
  if (count) {
    await batch.commit();
    await logContactEvent(db, contactId, "sequence_stopped", {
      summary: `Stopped ${count} sales sequence${count === 1 ? "" : "s"}`,
      meta: {groupKey, reason, count},
    });
  }
}

async function enrollContactInSequence(db, contact, sequenceId, meta = {}) {
  const sequenceRef = db.collection(CRM_SEQUENCES).doc(sequenceId);
  const sequenceSnap = await sequenceRef.get();
  if (!sequenceSnap.exists) return false;
  const sequence = {id: sequenceSnap.id, ...sequenceSnap.data()};
  if (!sequence.active) return false;

  const consent = computeConsent(contact, sequence);
  if (!consent.ok) {
    await db.collection(CRM_CAMPAIGN_EVENTS).add({
      workspaceId: CRM_WORKSPACE_ID,
      contactId: contact.id,
      sequenceId,
      eventType: "enrollment_skipped",
      reason: consent.reason,
      createdAt: nowTs(),
    });
    await logContactEvent(db, contact.id, "sequence_skip", {
      summary: `Skipped ${sequence.name}`,
      meta: {reason: consent.reason, sequenceId},
    });
    return false;
  }

  const steps = await getSequenceSteps(db, sequenceId);
  if (!steps.length) return false;

  const enrollmentId = enrollmentIdFor(contact.id, sequenceId);
  const enrollmentRef = db.collection(CRM_ENROLLMENTS).doc(enrollmentId);
  const enrollmentSnap = await enrollmentRef.get();
  if (enrollmentSnap.exists) {
    return false;
  }

  const firstStep = steps[0];
  await enrollmentRef.set({
    workspaceId: CRM_WORKSPACE_ID,
    contactId: contact.id,
    emailLower: contact.emailLower,
    sequenceId,
    sequenceName: sequence.name,
    groupKey: sequence.groupKey || "",
    status: "active",
    allowUnknownConsent: !!sequence.allowUnknownConsent,
    nextStepOrder: firstStep.stepOrder,
    nextSendAt: nextSendAtFromHours(firstStep.delayHours),
    currentStepOrder: null,
    createdAt: nowTs(),
    updatedAt: nowTs(),
    startedBy: meta.startedBy || "automation",
    startedFrom: meta.startedFrom || "",
  });

  await db.collection(CRM_CAMPAIGN_EVENTS).add({
    workspaceId: CRM_WORKSPACE_ID,
    contactId: contact.id,
    sequenceId,
    eventType: "enrolled",
    createdAt: nowTs(),
    meta,
  });
  await logContactEvent(db, contact.id, "sequence_enrolled", {
    summary: `Entered ${sequence.name}`,
    meta: {sequenceId, source: meta.startedFrom || meta.startedBy || "automation"},
  });
  return true;
}

async function getContactById(db, contactId) {
  const snap = await db.collection(CRM_CONTACTS).doc(contactId).get();
  if (!snap.exists) return null;
  return {id: snap.id, ...snap.data()};
}

async function evaluateAutomationRules(db, contact, triggerType, ctx = {}) {
  const rulesSnap = await db.collection(CRM_RULES).get();
  const rules = rulesSnap.docs
    .map((doc) => ({id: doc.id, ...doc.data()}))
    .filter((rule) => rule.active && rule.triggerType === triggerType)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  for (const rule of rules) {
    let matches = false;
    if (triggerType === "source_created") {
      matches = contact.source === rule.matchValue;
    } else if (triggerType === "tag_added") {
      matches = ctx.tagId === rule.matchValue;
    } else if (triggerType === "stage_changed") {
      matches = ctx.stageId === rule.matchValue;
    }
    if (!matches) continue;

    if (rule.actionType === "add_tag") {
      await applyTagToContact(db, contact.id, rule.actionValue, {
        reason: rule.name,
        fromRuleId: rule.id,
      });
    } else if (rule.actionType === "enroll_sequence") {
      const freshContact = await getContactById(db, contact.id);
      if (freshContact) {
        await enrollContactInSequence(db, freshContact, rule.actionValue, {
          startedBy: "automation",
          startedFrom: rule.name,
          ruleId: rule.id,
        });
      }
    } else if (rule.actionType === "stop_sequence_group") {
      await stopSequenceGroupForContact(db, contact.id, rule.actionValue, rule.name);
    }
  }
}

async function applyTagToContact(db, contactId, tagId, meta = {}) {
  const contactRef = db.collection(CRM_CONTACTS).doc(contactId);
  const snap = await contactRef.get();
  if (!snap.exists) return false;
  const contact = {id: snap.id, ...snap.data()};
  const tagIds = Array.isArray(contact.tagIds) ? contact.tagIds : [];
  if (tagIds.includes(tagId)) return false;

  await contactRef.update({
    tagIds: fieldValue().arrayUnion(tagId),
    updatedAt: nowTs(),
  });
  await logContactEvent(db, contactId, "tag_added", {
    summary: `Added tag ${tagId}`,
    meta: {tagId, reason: meta.reason || "", fromRuleId: meta.fromRuleId || null},
  });

  const freshContact = await getContactById(db, contactId);
  if (freshContact) {
    await evaluateAutomationRules(db, freshContact, "tag_added", {tagId});
  }
  return true;
}

async function removeTagFromContact(db, contactId, tagId) {
  await db.collection(CRM_CONTACTS).doc(contactId).update({
    tagIds: fieldValue().arrayRemove(tagId),
    updatedAt: nowTs(),
  });
  await logContactEvent(db, contactId, "tag_removed", {
    summary: `Removed tag ${tagId}`,
    meta: {tagId},
  });
}

async function upsertContactFromSource(db, data) {
  await ensureCrmDefaults(db);
  const emailLower = normalizeEmail(data.email);
  if (!emailLower || !emailLower.includes("@")) return null;

  const contactId = contactIdFor(emailLower, CRM_WORKSPACE_ID);
  const contactRef = db.collection(CRM_CONTACTS).doc(contactId);
  const existingSnap = await contactRef.get();
  const existing = existingSnap.exists ? existingSnap.data() : null;
  const firstName = String(data.firstName || existing?.firstName || "").trim();
  const lastName = String(data.lastName || existing?.lastName || "").trim();
  const defaultStage = DEFAULT_STAGES[0].id;

  const payload = {
    workspaceId: CRM_WORKSPACE_ID,
    ownerType: CRM_OWNER_TYPE,
    source: data.source || existing?.source || "manual",
    sourceDetail: data.sourceDetail || existing?.sourceDetail || "",
    email: emailLower,
    emailLower,
    firstName,
    lastName,
    status: existing?.status || "open",
    stageId: existing?.stageId || defaultStage,
    tagIds: existing?.tagIds || [],
    notesCount: existing?.notesCount || 0,
    marketingConsent: data.marketingConsent || existing?.marketingConsent || "marketing_unknown",
    marketingConsentSource: data.marketingConsentSource || existing?.marketingConsentSource || "",
    marketingConsentCapturedAt: existing?.marketingConsentCapturedAt || nowTs(),
    unsubscribedAt: existing?.unsubscribedAt || null,
    linkedUserId: data.linkedUserId || existing?.linkedUserId || null,
    linkedAccountEmail: data.linkedAccountEmail || existing?.linkedAccountEmail || null,
    updatedAt: nowTs(),
  };

  if (!existing) {
    payload.createdAt = nowTs();
  }

  await contactRef.set(payload, {merge: true});
  const freshContact = await getContactById(db, contactId);
  if (!freshContact) return null;

  if (!existing) {
    await logContactEvent(db, contactId, "contact_created", {
      summary: `Lead captured from ${freshContact.source}`,
      meta: {source: freshContact.source, sourceDetail: freshContact.sourceDetail || ""},
    });
  } else {
    await logContactEvent(db, contactId, "contact_updated", {
      summary: `Lead refreshed from ${freshContact.source}`,
      meta: {source: freshContact.source},
    });
  }

  await evaluateAutomationRules(db, freshContact, "source_created", {
    source: freshContact.source,
  });
  return freshContact;
}

async function buildReport(db, contacts) {
  const enrollmentsSnap = await db.collection(CRM_ENROLLMENTS).get();
  const enrollments = enrollmentsSnap.docs.map((doc) => ({id: doc.id, ...doc.data()}));

  const stageCounts = {};
  const sourceCounts = {};
  let wonCount = 0;
  let lostCount = 0;
  contacts.forEach((contact) => {
    stageCounts[contact.stageId] = (stageCounts[contact.stageId] || 0) + 1;
    sourceCounts[contact.source || "unknown"] = (sourceCounts[contact.source || "unknown"] || 0) + 1;
    if (contact.stageId === "stage_won") wonCount += 1;
    if (contact.stageId === "stage_lost") lostCount += 1;
  });

  const sequenceStats = {};
  enrollments.forEach((enrollment) => {
    if (!sequenceStats[enrollment.sequenceId]) {
      sequenceStats[enrollment.sequenceId] = {
        sequenceId: enrollment.sequenceId,
        sequenceName: enrollment.sequenceName || enrollment.sequenceId,
        active: 0,
        completed: 0,
        stopped: 0,
      };
    }
    if (enrollment.status === "active" || enrollment.status === "ready") sequenceStats[enrollment.sequenceId].active += 1;
    if (enrollment.status === "completed") sequenceStats[enrollment.sequenceId].completed += 1;
    if (enrollment.status === "stopped") sequenceStats[enrollment.sequenceId].stopped += 1;
  });

  return {
    totalContacts: contacts.length,
    stageCounts,
    sourceCounts,
    wonCount,
    lostCount,
    inSequenceCount: enrollments.filter((item) => item.status === "active" || item.status === "ready").length,
    sequenceStats: Object.values(sequenceStats).sort((a, b) => a.sequenceName.localeCompare(b.sequenceName)),
  };
}

async function buildSnapshot(db) {
  await ensureCrmDefaults(db);
  const [{stages, tags, sequences, rules}, contactsSnap, enrollmentsSnap] = await Promise.all([
    getReferenceData(db),
    db.collection(CRM_CONTACTS).get(),
    db.collection(CRM_ENROLLMENTS).get(),
  ]);

  const contacts = contactsSnap.docs
    .map((doc) => ({id: doc.id, ...doc.data()}))
    .sort((a, b) => {
      const aDate = toDate(a.updatedAt)?.getTime() || 0;
      const bDate = toDate(b.updatedAt)?.getTime() || 0;
      return bDate - aDate;
    });

  const enrollmentSummary = {};
  enrollmentsSnap.docs.forEach((doc) => {
    const data = doc.data();
    if (data.status !== "active" && data.status !== "ready") return;
    if (!enrollmentSummary[data.contactId]) {
      enrollmentSummary[data.contactId] = [];
    }
    enrollmentSummary[data.contactId].push({
      sequenceId: data.sequenceId,
      sequenceName: data.sequenceName || data.sequenceId,
      nextStepOrder: data.nextStepOrder || null,
      nextSendAt: serialize(data.nextSendAt),
    });
  });

  const sequenceSteps = {};
  await Promise.all(sequences.map(async (sequence) => {
    sequenceSteps[sequence.id] = await getSequenceSteps(db, sequence.id);
  }));

  const report = await buildReport(db, contacts);
  return serialize({
    contacts,
    stages,
    tags,
    enrollmentSummary,
    sequences: sequences.map((sequence) => ({...sequence, steps: sequenceSteps[sequence.id] || []})),
    rules,
    report,
  });
}

async function getContactDetail(db, contactId) {
  const contact = await getContactById(db, contactId);
  if (!contact) return null;
  const [notesSnap, eventsSnap, enrollmentsSnap] = await Promise.all([
    db.collection(CRM_NOTES).where("contactId", "==", contactId).get(),
    db.collection(CRM_EVENTS).where("contactId", "==", contactId).get(),
    db.collection(CRM_ENROLLMENTS).where("contactId", "==", contactId).get(),
  ]);
  const notes = notesSnap.docs
    .map((doc) => ({id: doc.id, ...doc.data()}))
    .sort((a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0));
  const events = eventsSnap.docs
    .map((doc) => ({id: doc.id, ...doc.data()}))
    .sort((a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0));
  const enrollments = enrollmentsSnap.docs
    .map((doc) => ({id: doc.id, ...doc.data()}))
    .sort((a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0));
  return serialize({contact, notes, events, enrollments});
}

async function saveSequence(db, payload) {
  await ensureCrmDefaults(db);
  const id = payload.id || `sequence_${hashValue((payload.name || "sequence").toLowerCase())}`;
  const steps = Array.isArray(payload.steps) ? payload.steps : [];
  const sequenceRef = db.collection(CRM_SEQUENCES).doc(id);
  await sequenceRef.set({
    workspaceId: CRM_WORKSPACE_ID,
    name: payload.name || "Untitled sequence",
    description: payload.description || "",
    groupKey: payload.groupKey || "",
    active: payload.active !== false,
    allowUnknownConsent: payload.allowUnknownConsent !== false,
    updatedAt: nowTs(),
    createdAt: payload.createdAt || nowTs(),
  }, {merge: true});

  const existingSteps = await db.collection(CRM_STEPS).where("sequenceId", "==", id).get();
  const batch = db.batch();
  existingSteps.docs.forEach((doc) => batch.delete(doc.ref));
  steps
    .map((step, index) => ({...step, stepOrder: index + 1}))
    .forEach((step) => {
      batch.set(db.collection(CRM_STEPS).doc(`${id}__${step.stepOrder}`), {
        workspaceId: CRM_WORKSPACE_ID,
        sequenceId: id,
        stepOrder: step.stepOrder,
        delayHours: Number(step.delayHours) || 0,
        subject: step.subject || "",
        previewText: step.previewText || "",
        bodyHtml: step.bodyHtml || "",
        ctaLabel: step.ctaLabel || "",
        ctaUrl: step.ctaUrl || "",
        updatedAt: nowTs(),
        createdAt: nowTs(),
      });
    });
  await batch.commit();
  return id;
}

async function saveRule(db, payload) {
  await ensureCrmDefaults(db);
  const id = payload.id || `rule_${hashValue((payload.name || "rule").toLowerCase() + Date.now())}`;
  await db.collection(CRM_RULES).doc(id).set({
    workspaceId: CRM_WORKSPACE_ID,
    name: payload.name || "Untitled rule",
    description: payload.description || "",
    triggerType: payload.triggerType || "tag_added",
    matchValue: payload.matchValue || "",
    actionType: payload.actionType || "enroll_sequence",
    actionValue: payload.actionValue || "",
    order: Number(payload.order) || 99,
    active: payload.active !== false,
    updatedAt: nowTs(),
    createdAt: payload.createdAt || nowTs(),
  }, {merge: true});
  return id;
}

async function saveContact(db, payload) {
  const emailLower = normalizeEmail(payload.email);
  if (!emailLower || !emailLower.includes("@")) {
    throw new Error("A valid email is required");
  }
  const contactId = payload.id || contactIdFor(emailLower);
  const ref = db.collection(CRM_CONTACTS).doc(contactId);
  const existing = await ref.get();
  const current = existing.exists ? existing.data() : null;

  await ref.set({
    workspaceId: CRM_WORKSPACE_ID,
    ownerType: CRM_OWNER_TYPE,
    source: payload.source || current?.source || "manual",
    sourceDetail: payload.sourceDetail || current?.sourceDetail || "",
    email: emailLower,
    emailLower,
    firstName: payload.firstName || current?.firstName || "",
    lastName: payload.lastName || current?.lastName || "",
    status: payload.status || current?.status || "open",
    stageId: payload.stageId || current?.stageId || DEFAULT_STAGES[0].id,
    tagIds: Array.isArray(payload.tagIds) ? payload.tagIds : current?.tagIds || [],
    notesCount: current?.notesCount || 0,
    marketingConsent: payload.marketingConsent || current?.marketingConsent || "marketing_unknown",
    marketingConsentSource: payload.marketingConsentSource || current?.marketingConsentSource || "manual_admin",
    marketingConsentCapturedAt: current?.marketingConsentCapturedAt || nowTs(),
    unsubscribedAt: current?.unsubscribedAt || null,
    linkedUserId: payload.linkedUserId || current?.linkedUserId || null,
    linkedAccountEmail: payload.linkedAccountEmail || current?.linkedAccountEmail || null,
    updatedAt: nowTs(),
    createdAt: current?.createdAt || nowTs(),
  }, {merge: true});

  await logContactEvent(db, contactId, current ? "contact_updated" : "contact_created", {
    summary: current ? "Contact updated by admin" : "Contact created by admin",
    meta: {source: payload.source || "manual"},
  });
  return contactId;
}

async function unsubscribeByEmail(db, email, meta = {}) {
  const emailLower = normalizeEmail(email);
  if (!emailLower || !emailLower.includes("@")) return false;
  const contactId = contactIdFor(emailLower);
  const contactRef = db.collection(CRM_CONTACTS).doc(contactId);
  const snap = await contactRef.get();
  if (!snap.exists) return false;

  await contactRef.update({
    unsubscribedAt: nowTs(),
    updatedAt: nowTs(),
    status: "unsubscribed",
  });
  await stopSequenceGroupForContact(db, contactId, null, "unsubscribe");
  await logContactEvent(db, contactId, "unsubscribed", {
    summary: "Unsubscribed from marketing emails",
    meta,
  });
  return true;
}

const crmAdmin = onRequest({
  cors: true,
  invoker: "public",
}, async (req, res) => {
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({error: "Method not allowed"});
    return;
  }

  const decoded = await requireAdmin(req, res);
  if (!decoded) return;

  const db = admin.firestore();
  const {action, payload = {}} = req.body || {};

  try {
    if (action === "bootstrap" || action === "snapshot") {
      res.status(200).json(await buildSnapshot(db));
      return;
    }

    if (action === "getContact") {
      const detail = await getContactDetail(db, payload.contactId);
      if (!detail) {
        res.status(404).json({error: "Contact not found"});
        return;
      }
      res.status(200).json(detail);
      return;
    }

    if (action === "saveContact") {
      const contactId = await saveContact(db, payload);
      res.status(200).json({ok: true, contactId});
      return;
    }

    if (action === "moveStage") {
      await db.collection(CRM_CONTACTS).doc(payload.contactId).update({
        stageId: payload.stageId,
        updatedAt: nowTs(),
      });
      await logContactEvent(db, payload.contactId, "stage_changed", {
        summary: `Moved to ${payload.stageId}`,
        meta: {stageId: payload.stageId, movedBy: decoded.uid},
      });
      const freshContact = await getContactById(db, payload.contactId);
      if (freshContact) {
        await evaluateAutomationRules(db, freshContact, "stage_changed", {stageId: payload.stageId});
      }
      res.status(200).json({ok: true});
      return;
    }

    if (action === "toggleTag") {
      const snap = await db.collection(CRM_CONTACTS).doc(payload.contactId).get();
      if (!snap.exists) {
        res.status(404).json({error: "Contact not found"});
        return;
      }
      const contact = snap.data();
      const tagIds = Array.isArray(contact.tagIds) ? contact.tagIds : [];
      if (tagIds.includes(payload.tagId)) {
        await removeTagFromContact(db, payload.contactId, payload.tagId);
      } else {
        await applyTagToContact(db, payload.contactId, payload.tagId, {
          reason: "manual_toggle",
        });
      }
      res.status(200).json({ok: true});
      return;
    }

    if (action === "addNote") {
      await db.collection(CRM_NOTES).add({
        workspaceId: CRM_WORKSPACE_ID,
        contactId: payload.contactId,
        body: String(payload.body || "").trim(),
        createdBy: decoded.uid,
        createdAt: nowTs(),
      });
      await db.collection(CRM_CONTACTS).doc(payload.contactId).update({
        notesCount: fieldValue().increment(1),
        updatedAt: nowTs(),
      });
      await logContactEvent(db, payload.contactId, "note_added", {
        summary: "Added note",
        meta: {createdBy: decoded.uid},
      });
      res.status(200).json({ok: true});
      return;
    }

    if (action === "saveSequence") {
      const sequenceId = await saveSequence(db, payload);
      res.status(200).json({ok: true, sequenceId});
      return;
    }

    if (action === "saveRule") {
      const ruleId = await saveRule(db, payload);
      res.status(200).json({ok: true, ruleId});
      return;
    }

    if (action === "unsubscribe") {
      const detail = await getContactById(db, payload.contactId);
      if (!detail) {
        res.status(404).json({error: "Contact not found"});
        return;
      }
      await unsubscribeByEmail(db, detail.emailLower, {by: decoded.uid});
      res.status(200).json({ok: true});
      return;
    }

    res.status(400).json({error: "Unknown action"});
  } catch (err) {
    console.error("crmAdmin error:", err);
    res.status(500).json({error: err.message});
  }
});

const crmPublicUnsubscribe = onRequest({
  cors: true,
  invoker: "public",
}, async (req, res) => {
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  const email = req.method === "GET" ? req.query.email : req.body?.email;
  try {
    const ok = await unsubscribeByEmail(admin.firestore(), email, {
      source: "public_unsubscribe",
    });
    res.status(200).json({ok});
  } catch (err) {
    console.error("crmPublicUnsubscribe error:", err);
    res.status(500).json({error: err.message});
  }
});

const runCrmSequenceQueue = onSchedule({
  schedule: "every 15 minutes",
  timeZone: "America/Chicago",
  invoker: "public",
  secrets: ["RESEND_API_KEY"],
}, async () => {
  const db = admin.firestore();
  await ensureCrmDefaults(db);
  const enrollmentsSnap = await db.collection(CRM_ENROLLMENTS).get();
  const enrollments = enrollmentsSnap.docs
    .map((doc) => ({id: doc.id, ref: doc.ref, ...doc.data()}))
    .filter((enrollment) => enrollment.status === "active" || enrollment.status === "ready")
    .sort((a, b) => (toDate(a.nextSendAt)?.getTime() || 0) - (toDate(b.nextSendAt)?.getTime() || 0))
    .slice(0, 50);

  const now = Date.now();
  for (const enrollment of enrollments) {
    const dueAt = toDate(enrollment.nextSendAt)?.getTime() || 0;
    if (!dueAt || dueAt > now) continue;

    const [contact, sequence] = await Promise.all([
      getContactById(db, enrollment.contactId),
      db.collection(CRM_SEQUENCES).doc(enrollment.sequenceId).get(),
    ]);

    if (!contact || !sequence.exists) {
      await enrollment.ref.update({
        status: "stopped",
        stopReason: "missing_contact_or_sequence",
        stoppedAt: nowTs(),
        updatedAt: nowTs(),
      });
      continue;
    }

    const sequenceData = {id: sequence.id, ...sequence.data()};
    const consent = computeConsent(contact, sequenceData);
    if (!consent.ok) {
      await enrollment.ref.update({
        status: "stopped",
        stopReason: consent.reason,
        stoppedAt: nowTs(),
        updatedAt: nowTs(),
      });
      await logContactEvent(db, contact.id, "sequence_stopped", {
        summary: `Stopped ${sequenceData.name}`,
        meta: {reason: consent.reason},
      });
      continue;
    }

    const steps = await getSequenceSteps(db, enrollment.sequenceId);
    const step = steps.find((item) => item.stepOrder === enrollment.nextStepOrder);
    if (!step) {
      await enrollment.ref.update({
        status: "completed",
        completedAt: nowTs(),
        updatedAt: nowTs(),
      });
      continue;
    }

    const unsubscribeUrl = `https://toolspark.co/unsubscribe.html?email=${encodeURIComponent(contact.emailLower)}`;
    const html = buildEmailHtml({
      firstName: contact.firstName || "there",
      previewText: step.previewText,
      bodyHtml: step.bodyHtml,
      ctaLabel: step.ctaLabel,
      ctaUrl: step.ctaUrl,
      unsubscribeUrl,
    });

    try {
      const result = await sendSequenceEmail({
        to: contact.emailLower,
        subject: step.subject,
        html,
      });
      const nextStep = steps.find((item) => item.stepOrder === step.stepOrder + 1);
      await db.collection(CRM_CAMPAIGN_EVENTS).add({
        workspaceId: CRM_WORKSPACE_ID,
        contactId: contact.id,
        sequenceId: enrollment.sequenceId,
        stepOrder: step.stepOrder,
        eventType: "email_sent",
        resendId: result.id || null,
        createdAt: nowTs(),
      });
      if (nextStep) {
        await enrollment.ref.update({
          status: "active",
          currentStepOrder: step.stepOrder,
          nextStepOrder: nextStep.stepOrder,
          lastSentAt: nowTs(),
          nextSendAt: nextSendAtFromHours(nextStep.delayHours),
          updatedAt: nowTs(),
        });
      } else {
        await enrollment.ref.update({
          status: "completed",
          currentStepOrder: step.stepOrder,
          lastSentAt: nowTs(),
          completedAt: nowTs(),
          nextSendAt: null,
          updatedAt: nowTs(),
        });
      }
      await logContactEvent(db, contact.id, "campaign_sent", {
        summary: `Sent ${sequenceData.name} email ${step.stepOrder}`,
        meta: {sequenceId: enrollment.sequenceId, stepOrder: step.stepOrder},
      });
    } catch (err) {
      await enrollment.ref.update({
        status: "active",
        lastError: err.message,
        updatedAt: nowTs(),
      });
      await db.collection(CRM_CAMPAIGN_EVENTS).add({
        workspaceId: CRM_WORKSPACE_ID,
        contactId: contact.id,
        sequenceId: enrollment.sequenceId,
        stepOrder: step.stepOrder,
        eventType: "email_failed",
        error: err.message,
        createdAt: nowTs(),
      });
      await logContactEvent(db, contact.id, "campaign_failed", {
        summary: `Failed sending ${sequenceData.name} email ${step.stepOrder}`,
        meta: {sequenceId: enrollment.sequenceId, stepOrder: step.stepOrder, error: err.message},
      });
    }
  }
});

module.exports = {
  crmAdmin,
  crmPublicUnsubscribe,
  runCrmSequenceQueue,
  ensureCrmDefaults,
  upsertContactFromSource,
};
