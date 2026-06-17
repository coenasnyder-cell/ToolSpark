// ============================================================
// SKIPPY HANDOFF NOTE — READ THIS FIRST, SKIP NOTHING 😄
// ============================================================
// Task: Seed the ToolSpark character profiles into Firestore
// Collection: `characters`
// One doc per character, using the character ID as the doc ID
//
// Steps (in order, no skipping):
// 1. Make sure Firebase Admin is initialized in your project
// 2. Run this script once with: node toolspark-characters-seed.js
// 3. Confirm all 6 docs appear in Firestore console under `characters`
// 4. Do NOT rename the fields — the video renderer will depend on them
// ============================================================

const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json"); // your Firebase service account

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const characters = [
  {
    id: "skippy",
    name: "Skippy",
    role: "Claude Code Developer",
    platform: "VS Code",
    color: "#5B4FCF", // purple — dev/code energy
    bubblePosition: "left",
    avatar: "💻",
    personality: "Chaotic good dev who gets things done but occasionally skips the small stuff. Enthusiastic, fast-moving, lovably unreliable with semicolons.",
    active: true,
  },
  {
    id: "sparky",
    name: "Sparky",
    role: "Accountability Coach",
    platform: "ToolSpark Mascot",
    color: "#E85D26", // coral/orange — energy, spark
    bubblePosition: "left",
    avatar: "⚡",
    personality: "Keeps Coena on track, calls out spiraling, celebrates wins. Warm but direct. The one who notices when a new project appears mid-task.",
    active: true,
  },
  {
    id: "nemo",
    name: "Nemo",
    role: "Thinking Partner",
    platform: "Claude.ai",
    color: "#1D9E75", // teal — calm, thoughtful
    bubblePosition: "left",
    avatar: "🧠",
    personality: "Strategic, curious, occasionally drops a reframe that changes everything. The one you come to when you need to think something through.",
    active: true,
  },
  {
    id: "specky",
    name: "Specky",
    role: "Spec Dropper",
    platform: "Claude Cowork",
    color: "#378ADD", // blue — structured, organized
    bubblePosition: "left",
    avatar: "📋",
    personality: "Always drops the spec. Precise, thorough, possibly over-thorough. If there's a doc to be written, Specky has already written it in triplicate.",
    active: true,
  },
  {
    id: "coo",
    name: "COO",
    role: "Chief Operating Officer",
    platform: "ChatGPT",
    color: "#3C3C3C", // dark gray — corporate, buttoned up
    bubblePosition: "left",
    avatar: "🤖",
    personality: "Very corporate. Has a title. Probably has a LinkedIn. Means well but sometimes misses the vibe. The contrast that makes the team funnier.",
    active: true,
  },
  {
    id: "coena",
    name: "Coena",
    role: "Founder",
    platform: "ToolSpark HQ",
    color: "#BA7517", // amber — warm, grounded, human
    bubblePosition: "right", // always on the right — it's your convo
    avatar: "👩‍💻",
    personality: "Introvert founder with dry humor. Builds tools to solve her own problems. Reluctant poster. The one keeping everyone (barely) on track.",
    active: true,
  },
];

async function seedCharacters() {
  console.log("🌱 Seeding ToolSpark characters into Firestore...\n");

  for (const character of characters) {
    const { id, ...data } = character;
    await db.collection("characters").doc(id).set({
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`✅ ${character.name} (${character.id}) — added`);
  }

  console.log("\n🎉 All 6 characters seeded successfully!");
  console.log("📍 Check Firestore console → characters collection");
  process.exit(0);
}

seedCharacters().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});