// services/loops.ts
// Loops.so integration for email marketing and automation
// Docs: https://loops.so/docs/api

const LOOPS_API_URL = 'https://app.loops.so/api/v1';

// ─────────────────────────────────────────────
// IMPLEMENTER: Add your Loops API key here
// Get it from Loops → Settings → API
// In production, store this in your environment
// variables, not hardcoded
// ─────────────────────────────────────────────
const LOOPS_API_KEY = '0098c07ddc65e9c00b244a849cca93d6';

const loopsHeaders = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${LOOPS_API_KEY}`,
};

// ─────────────────────────────────────────────
// CONTACT MANAGEMENT
// ─────────────────────────────────────────────

// Create or update a contact in Loops
// Call this on signup and when user data changes
export const upsertContact = async ({
  email,
  firstName,
  lastName,
  userId,
  tags = {},
}: {
  email: string;
  firstName: string;
  lastName?: string;
  userId: string;
  tags?: Record<string, string | boolean>;
}) => {
  try {
    const response = await fetch(`${LOOPS_API_URL}/contacts/update`, {
      method: 'PUT',
      headers: loopsHeaders,
      body: JSON.stringify({
        email,
        firstName,
        lastName: lastName || '',
        userId,
        // Custom attributes for segmentation
        appMember: true,
        ...tags,
      }),
    });
    const data = await response.json();
    return data;
  } catch (err) {
    console.log('Loops upsertContact error:', err);
  }
};

// Delete a contact from Loops
// Call this if a user deletes their account
export const deleteContact = async (email: string) => {
  try {
    const response = await fetch(`${LOOPS_API_URL}/contacts/delete`, {
      method: 'POST',
      headers: loopsHeaders,
      body: JSON.stringify({ email }),
    });
    return await response.json();
  } catch (err) {
    console.log('Loops deleteContact error:', err);
  }
};

// Update a single attribute/tag on a contact
export const updateContactTag = async (
  email: string,
  tags: Record<string, string | boolean>
) => {
  try {
    const response = await fetch(`${LOOPS_API_URL}/contacts/update`, {
      method: 'PUT',
      headers: loopsHeaders,
      body: JSON.stringify({ email, ...tags }),
    });
    return await response.json();
  } catch (err) {
    console.log('Loops updateContactTag error:', err);
  }
};

// ─────────────────────────────────────────────
// STANDARD TAGS
// Use these consistently across the app
// so segmentation stays clean
// ─────────────────────────────────────────────
export const LOOPS_TAGS = {
  APP_MEMBER: 'appMember',           // has app account
  NOT_ON_APP: 'notOnApp',            // lead, no account yet
  DONE_FOR_YOU: 'doneForYou',        // DFY client
  DIY_CLIENT: 'diyClient',           // self-serve client
  UPGRADED: 'upgraded',              // paid upgrade
  COURSE_COMPLETE: 'courseComplete', // finished a course
  INACTIVE: 'inactive',              // no login 30+ days
  EARLY_MEMBER: 'earlyMember',       // joined first 30 days
  OPT_IN: 'emailOptIn',             // explicitly opted in
};

// ─────────────────────────────────────────────
// CAMPAIGN / LOOP ENROLLMENT
// ─────────────────────────────────────────────

// Enroll a contact in a Loop (automated sequence)
// loopId comes from Loops dashboard → your sequence URL
export const enrollInLoop = async (
  email: string,
  loopId: string
) => {
  try {
    const response = await fetch(`${LOOPS_API_URL}/loops/send`, {
      method: 'POST',
      headers: loopsHeaders,
      body: JSON.stringify({ email, loopId }),
    });
    return await response.json();
  } catch (err) {
    console.log('Loops enrollInLoop error:', err);
  }
};

// ─────────────────────────────────────────────
// TRANSACTIONAL EMAILS
// One-off emails triggered by specific actions
// Set these up as transactional emails in Loops
// and reference their transactionalId here
// ─────────────────────────────────────────────
export const sendTransactionalEmail = async (
  email: string,
  transactionalId: string,
  dataVariables?: Record<string, string>
) => {
  try {
    const response = await fetch(`${LOOPS_API_URL}/transactional`, {
      method: 'POST',
      headers: loopsHeaders,
      body: JSON.stringify({
        email,
        transactionalId,
        dataVariables: dataVariables || {},
      }),
    });
    return await response.json();
  } catch (err) {
    console.log('Loops transactional error:', err);
  }
};

// ─────────────────────────────────────────────
// COMMON TRIGGER FUNCTIONS
// Wire these into your existing app actions
// ─────────────────────────────────────────────

// Call on successful signup
export const onUserSignup = async ({
  email,
  firstName,
  lastName,
  userId,
  optedIn,
  isEarlyMember,
}: {
  email: string;
  firstName: string;
  lastName?: string;
  userId: string;
  optedIn: boolean;
  isEarlyMember: boolean;
}) => {
  // Always create the contact in Loops
  await upsertContact({
    email,
    firstName,
    lastName,
    userId,
    tags: {
      [LOOPS_TAGS.APP_MEMBER]: true,
      [LOOPS_TAGS.OPT_IN]: optedIn,
      [LOOPS_TAGS.EARLY_MEMBER]: isEarlyMember,
    },
  });

  // Only enroll in welcome sequence if they opted in
  if (optedIn) {
    // IMPLEMENTER: Replace with your welcome Loop ID
    // Found in Loops dashboard → Loops → your sequence → URL
    await enrollInLoop(email, 'cmpe68czf0de30jyivrs3mjdu');
  }
};

// Call when a user completes a course
export const onUserCourseComplete = async (
  email: string,
  courseName: string
) => {
  await updateContactTag(email, {
    [LOOPS_TAGS.COURSE_COMPLETE]: true,
  });

  // IMPLEMENTER: Replace with your course completion Loop ID
  await enrollInLoop(email, 'YOUR_COURSE_COMPLETE_LOOP_ID');
};

// Call when admin marks someone as DFY client
export const onUserTaggedDFY = async (email: string) => {
  await updateContactTag(email, {
    [LOOPS_TAGS.DONE_FOR_YOU]: true,
    [LOOPS_TAGS.DIY_CLIENT]: false,
  });
};

// Call when admin marks someone as DIY client
export const onUserTaggedDIY = async (email: string) => {
  await updateContactTag(email, {
    [LOOPS_TAGS.DIY_CLIENT]: true,
    [LOOPS_TAGS.DONE_FOR_YOU]: false,
  });
};

// Call when admin marks someone as upgraded
export const onUserUpgraded = async (email: string) => {
  await updateContactTag(email, {
    [LOOPS_TAGS.UPGRADED]: true,
  });
};

// Call from your existing inactive check
// (no login in 30+ days)
export const onUserInactive = async (email: string) => {
  await updateContactTag(email, {
    [LOOPS_TAGS.INACTIVE]: true,
  });

  // IMPLEMENTER: Replace with your re-engagement Loop ID
  await enrollInLoop(email, 'YOUR_REENGAGEMENT_LOOP_ID');
};