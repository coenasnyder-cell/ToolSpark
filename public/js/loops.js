// loops.js
// Loops.so integration for email marketing
// Include this script in any page that needs email functionality
// <script src="/js/loops.js"></script>

const LOOPS_API_URL = 'https://app.loops.so/api/v1';
const LOOPS_API_KEY = 'cmpe68czf0de30jyivrs3mjdu'; // same key as mobile app

const loopsHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${LOOPS_API_KEY}`,
};

const LOOPS_TAGS = {
  APP_MEMBER: 'appMember',
  NOT_ON_APP: 'notOnApp',
  DONE_FOR_YOU: 'doneForYou',
  DIY_CLIENT: 'diyClient',
  UPGRADED: 'upgraded',
  COURSE_COMPLETE: 'courseComplete',
  INACTIVE: 'inactive',
  EARLY_MEMBER: 'earlyMember',
  OPT_IN: 'emailOptIn',
};

async function upsertContact({ email, firstName, lastName, userId, tags = {} }) {
  try {
    const response = await fetch(`${LOOPS_API_URL}/contacts/update`, {
      method: 'PUT',
      headers: loopsHeaders,
      body: JSON.stringify({
        email,
        firstName,
        lastName: lastName || '',
        userId,
        appMember: true,
        ...tags,
      }),
    });
    return await response.json();
  } catch (err) {
    console.log('Loops upsertContact error:', err);
  }
}

async function enrollInLoop(email, loopId) {
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
}

async function updateContactTag(email, tags) {
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
}

async function onUserSignup({ email, firstName, lastName, userId, optedIn, isEarlyMember }) {
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

  if (optedIn) {
    await enrollInLoop(email, 'cmpe68czf0de30jyivrs3mjdu');
  }
}

async function onUserTaggedDFY(email) {
  await updateContactTag(email, {
    [LOOPS_TAGS.DONE_FOR_YOU]: true,
    [LOOPS_TAGS.DIY_CLIENT]: false,
  });
}

async function onUserTaggedDIY(email) {
  await updateContactTag(email, {
    [LOOPS_TAGS.DIY_CLIENT]: true,
    [LOOPS_TAGS.DONE_FOR_YOU]: false,
  });
}

async function onUserUpgraded(email) {
  await updateContactTag(email, {
    [LOOPS_TAGS.UPGRADED]: true,
  });
}

async function onUserCourseComplete(email) {
  await updateContactTag(email, {
    [LOOPS_TAGS.COURSE_COMPLETE]: true,
  });
}