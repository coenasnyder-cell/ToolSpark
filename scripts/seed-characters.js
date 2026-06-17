/**
 * One-time seed script — populates the `characters` Firestore collection.
 * Run from the ToolSpark root:
 *   node scripts/seed-characters.js
 *
 * Do NOT rename any fields — the video renderer depends on them.
 * Requires firebase-admin (via functions/node_modules).
 */

const admin = require('../functions/node_modules/firebase-admin');
const serviceAccount = require('./serviceAccount.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'toolspark-2d62d',
});

const db = admin.firestore();

const characters = [
  {
    id: 'skippy',
    name: 'Skippy',
    role: 'Claude Code Developer',
    platform: 'VS Code',
    color: '#5B4FCF',
    bubblePosition: 'left',
    avatar: '💻',
    personality: 'Chaotic good dev who gets things done but occasionally skips the small stuff. Enthusiastic, fast-moving, lovably unreliable with semicolons.',
    active: true,
  },
  {
    id: 'sparky',
    name: 'Sparky',
    role: 'Accountability Coach',
    platform: 'ToolSpark Mascot',
    color: '#E85D26',
    bubblePosition: 'left',
    avatar: '⚡',
    personality: 'Keeps Coena on track, calls out spiraling, celebrates wins. Warm but direct. The one who notices when a new project appears mid-task.',
    active: true,
  },
  {
    id: 'nemo',
    name: 'Nemo',
    role: 'Thinking Partner',
    platform: 'Claude.ai',
    color: '#1D9E75',
    bubblePosition: 'left',
    avatar: '🧠',
    personality: 'Strategic, curious, occasionally drops a reframe that changes everything. The one you come to when you need to think something through.',
    active: true,
  },
  {
    id: 'specky',
    name: 'Specky',
    role: 'Spec Dropper',
    platform: 'Claude Cowork',
    color: '#378ADD',
    bubblePosition: 'left',
    avatar: '📋',
    personality: 'Always drops the spec. Precise, thorough, possibly over-thorough. If there\'s a doc to be written, Specky has already written it in triplicate.',
    active: true,
  },
  {
    id: 'coo',
    name: 'COO',
    role: 'Chief Operating Officer',
    platform: 'ChatGPT',
    color: '#3C3C3C',
    bubblePosition: 'left',
    avatar: '🤖',
    personality: 'Very corporate. Has a title. Probably has a LinkedIn. Means well but sometimes misses the vibe. The contrast that makes the team funnier.',
    active: true,
  },
  {
    id: 'coena',
    name: 'Coena',
    role: 'Founder',
    platform: 'ToolSpark HQ',
    color: '#BA7517',
    bubblePosition: 'right',
    avatar: '👩‍💻',
    personality: 'Introvert founder with dry humor. Builds tools to solve her own problems. Reluctant poster. The one keeping everyone (barely) on track.',
    active: true,
  },
];

async function seedCharacters() {
  console.log('🌱 Seeding ToolSpark characters into Firestore...\n');

  for (const character of characters) {
    const { id, ...data } = character;
    await db.collection('characters').doc(id).set({
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`✅ ${character.name} (${character.id}) — added`);
  }

  console.log('\n🎉 All 6 characters seeded successfully!');
  console.log('📍 Check Firestore console → characters collection');
  process.exit(0);
}

seedCharacters().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
