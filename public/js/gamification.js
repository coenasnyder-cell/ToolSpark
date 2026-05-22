// ToolSpark Gamification Service
// Include this on any page that needs to award points

const POINTS = {
  POST_THREAD: 10,
  RECEIVE_LIKE: 5,
  POST_COMMENT: 3,
  COMPLETE_LESSON: 10,
  COMPLETE_COURSE: 50,
  FIRST_POST_BONUS: 25,
};

const BADGES = {
  first_post:        { name: 'First Post',          icon: '✍️',  desc: 'Posted your first thread' },
  getting_started:   { name: 'Getting Started',      icon: '🚀',  desc: 'Completed the welcome course' },
  community_voice:   { name: 'Community Voice',      icon: '🎙️', desc: 'Made 10 posts' },
  liked:             { name: 'Liked',                icon: '❤️',  desc: 'Received your first like' },
  popular:           { name: 'Popular',              icon: '⭐',  desc: 'Received 10 likes' },
  first_comment:     { name: 'First Comment',        icon: '💬',  desc: 'Posted your first comment' },
  course_complete:   { name: 'Course Complete',      icon: '🎓',  desc: 'Completed a course' },
  scholar:           { name: 'Scholar',              icon: '📚',  desc: 'Completed 3 courses' },
  early_member:      { name: 'Early Member',         icon: '🌟',  desc: 'Joined in the first month' },
};

async function awardPoints(uid, points, reason) {
  if (!uid || !points) return;
  try {
    const userRef = db.collection('users').doc(uid);
    await userRef.update({
      points: firebase.firestore.FieldValue.increment(points),
    });
    await db.collection('pointsHistory').doc(uid)
      .collection('transactions').add({
        points,
        reason,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    console.log('Points awarded:', points, reason);
  } catch(e) {
    console.error('awardPoints error:', e);
  }
}

async function awardBadge(uid, badgeKey) {
  if (!uid || !badgeKey) return;
  try {
    const userRef = db.collection('users').doc(uid);
    const snap = await userRef.get();
    if (!snap.exists) return;
    const badges = snap.data().badges || [];
    if (badges.includes(badgeKey)) return; // already has it
    await userRef.update({
      badges: firebase.firestore.FieldValue.arrayUnion(badgeKey),
    });
    console.log('Badge awarded:', badgeKey);
  } catch(e) {
    console.error('awardBadge error:', e);
  }
}

async function onThreadPosted(uid) {
  if (!uid) return;
  try {
    await awardPoints(uid, POINTS.POST_THREAD, 'POST_THREAD');

    // Check for first post
    const snap = await db.collection('threads')
      .where('authorId', '==', uid)
      .limit(2)
      .get();

    if (snap.size === 1) {
      // This is their first post
      await awardPoints(uid, POINTS.FIRST_POST_BONUS, 'FIRST_POST_BONUS');
      await awardBadge(uid, 'first_post');
    }

    // Check for community voice (10 posts)
    if (snap.size >= 10) {
      await awardBadge(uid, 'community_voice');
    }
  } catch(e) {
    console.error('onThreadPosted error:', e);
  }
}

async function onCommentPosted(uid) {
  if (!uid) return;
  try {
    await awardPoints(uid, POINTS.POST_COMMENT, 'POST_COMMENT');
    await awardBadge(uid, 'first_comment');
  } catch(e) {
    console.error('onCommentPosted error:', e);
  }
}

async function onLikeReceived(authorUid) {
  if (!authorUid) return;
  try {
    await awardPoints(authorUid, POINTS.RECEIVE_LIKE, 'RECEIVE_LIKE');

    // Check for liked badge
    const userSnap = await db.collection('users').doc(authorUid).get();
    if (!userSnap.exists) return;
    const pts = userSnap.data().points || 0;
    await awardBadge(authorUid, 'liked');

    // Popular badge — 10 likes received
    const totalLikes = userSnap.data().totalLikesReceived || 0;
    await db.collection('users').doc(authorUid).update({
      totalLikesReceived: firebase.firestore.FieldValue.increment(1),
    });
    if (totalLikes >= 9) {
      await awardBadge(authorUid, 'popular');
    }
  } catch(e) {
    console.error('onLikeReceived error:', e);
  }
}

async function onLessonComplete(uid) {
  if (!uid) return;
  try {
    await awardPoints(uid, POINTS.COMPLETE_LESSON, 'COMPLETE_LESSON');
  } catch(e) {
    console.error('onLessonComplete error:', e);
  }
}

async function onCourseComplete(uid) {
  if (!uid) return;
  try {
    await awardPoints(uid, POINTS.COMPLETE_COURSE, 'COMPLETE_COURSE');
    await awardBadge(uid, 'course_complete');

    // Scholar — 3 courses complete
    const progressSnap = await db.collection('userProgress')
      .where('userId', '==', uid)
      .where('completedAt', '!=', null)
      .get();
    if (progressSnap.size >= 3) {
      await awardBadge(uid, 'scholar');
    }
  } catch(e) {
    console.error('onCourseComplete error:', e);
  }
}