/**
 * One-time backfill script — run from the ToolSpark root:
 *   node scripts/backfill.js
 *   node scripts/backfill.js --dry-run
 *
 * Requires firebase-admin (already in functions/node_modules).
 * Uses your active Firebase CLI credentials automatically.
 */

const admin = require('../functions/node_modules/firebase-admin');

const DRY_RUN = process.argv.includes('--dry-run');
const PROJECT_ID = 'toolspark-2d62d';

const serviceAccount = require('./serviceAccount.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: PROJECT_ID
});
const db = admin.firestore();

// ─────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────

function log(msg) { console.log(msg); }
function dim(msg) { console.log('\x1b[90m' + msg + '\x1b[0m'); }
function ok(msg)  { console.log('\x1b[32m✓ ' + msg + '\x1b[0m'); }
function warn(msg){ console.log('\x1b[33m⚠ ' + msg + '\x1b[0m'); }

// Build a uid-by-email lookup from the users collection
async function buildEmailToUidMap() {
  const snap = await db.collection('users').get();
  const map = {};
  snap.forEach(doc => {
    const d = doc.data();
    const email = d.userEmail || d.clientEmail || d.email || '';
    if (email) map[email.toLowerCase()] = doc.id;
  });
  log(`Loaded ${Object.keys(map).length} user email → uid mappings`);
  return map;
}

// Firestore max batch size
const BATCH_SIZE = 400;

async function commitBatches(writes) {
  if (!writes.length) return;
  for (let i = 0; i < writes.length; i += BATCH_SIZE) {
    const chunk = writes.slice(i, i + BATCH_SIZE);
    if (DRY_RUN) {
      dim(`  [dry-run] Would write ${chunk.length} docs`);
      continue;
    }
    const batch = db.batch();
    chunk.forEach(({ ref, data, mode }) => {
      if (mode === 'set')    batch.set(ref, data, { merge: true });
      if (mode === 'update') batch.update(ref, data);
    });
    await batch.commit();
  }
}

// ─────────────────────────────────────────────────────────
// TASK 1 — spark_profiles → spark_results
// ─────────────────────────────────────────────────────────

async function backfillSparkResults(emailToUid) {
  log('\n── spark_profiles → spark_results ──');

  const [profilesSnap, resultsSnap] = await Promise.all([
    db.collection('spark_profiles').get(),
    db.collection('spark_results').get()
  ]);

  const existingResultIds = new Set();
  resultsSnap.forEach(doc => existingResultIds.add(doc.id));

  log(`Found ${profilesSnap.size} spark_profiles, ${existingResultIds.size} existing spark_results`);

  const writes = [];
  let skipped = 0;

  profilesSnap.forEach(doc => {
    if (existingResultIds.has(doc.id)) { skipped++; return; }

    const d = doc.data() || {};
    const email = (d.email || '').toLowerCase();
    const uid   = emailToUid[email] || d.userId || null;

    const resultData = {
      sessionId:   d.sessionId   || doc.id,
      name:        d.name        || '',
      email:       d.email       || '',
      accountEmail: email        || '',
      userId:      uid,
      statement:   d.statement   || '',
      whatYouKnow: d.whatYouKnow || '',
      whoYouHelp:  d.whoYouHelp  || '',
      aiSystems:   Array.isArray(d.aiSystems) ? d.aiSystems : [],
      closing:     d.closing     || '',
      rawProfile:  d.rawProfile  || '',
      transcript:  Array.isArray(d.transcript) ? d.transcript : [],
      source:      d.source      || 'find-your-spark',
      createdAt:   d.createdAt   || admin.firestore.FieldValue.serverTimestamp(),
      linkedAt:    admin.firestore.FieldValue.serverTimestamp()
    };

    writes.push({ ref: db.collection('spark_results').doc(doc.id), data: resultData, mode: 'set' });

    // Also stamp userId/accountEmail back onto the profile if missing
    if (!d.userId && uid) {
      writes.push({
        ref: doc.ref,
        data: { userId: uid, accountEmail: email },
        mode: 'update'
      });
    }
  });

  log(`Skipped ${skipped} already-linked | Writing ${writes.length} operations`);
  await commitBatches(writes);
  ok(`spark_results backfill complete`);
}

// ─────────────────────────────────────────────────────────
// TASK 2 — clarity_sessions → clientresults
// ─────────────────────────────────────────────────────────

async function backfillClientResults(emailToUid) {
  log('\n── clarity_sessions → clientresults ──');

  const [sessionsSnap, clientResultsSnap] = await Promise.all([
    db.collection('clarity_sessions').where('status', '==', 'completed').get(),
    db.collection('clientresults').get()
  ]);

  const existingIds = new Set();
  clientResultsSnap.forEach(doc => existingIds.add(doc.id));

  log(`Found ${sessionsSnap.size} completed clarity_sessions, ${existingIds.size} existing clientresults`);

  const writes = [];
  let skipped = 0;

  sessionsSnap.forEach(doc => {
    if (existingIds.has(doc.id)) { skipped++; return; }

    const d = doc.data() || {};
    const email = (d.clientEmail || '').toLowerCase();
    const uid   = emailToUid[email] || null;

    const resultData = {
      sessionId:    doc.id,
      displayName:  d.displayName  || '',
      businessName: d.businessName || '',
      clientEmail:  d.clientEmail  || '',
      summary:      d.summary      || '',
      extracted:    d.extracted    || {},
      actionPlan:   d.actionPlan   || '',
      status:       d.status       || 'completed',
      createdAt:    d.createdAt    || admin.firestore.FieldValue.serverTimestamp(),
      // clientResults (AI tool recs) only exists if user previously viewed results.html
      // Leave it absent here — it gets filled when they visit results.html
    };

    if (uid) resultData.userId = uid;

    writes.push({ ref: db.collection('clientresults').doc(doc.id), data: resultData, mode: 'set' });
  });

  log(`Skipped ${skipped} already-present | Writing ${writes.length} operations`);
  await commitBatches(writes);
  ok(`clientresults backfill complete`);
}

// ─────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────

async function main() {
  log(`\nToolSpark backfill — project: ${PROJECT_ID}`);
  if (DRY_RUN) warn('DRY RUN — no data will be written\n');

  const emailToUid = await buildEmailToUidMap();

  await backfillSparkResults(emailToUid);
  await backfillClientResults(emailToUid);

  log('\nDone.\n');
}

main().catch(err => { console.error(err); process.exit(1); });
