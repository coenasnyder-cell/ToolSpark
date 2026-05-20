import {
  doc,
  updateDoc,
  increment,
  arrayUnion,
  getDoc,
  addDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

// Points awarded for each action
export const POINTS = {
  POST_THREAD: 10,
  RECEIVE_LIKE: 5,
  POST_COMMENT: 3,
  COMPLETE_LESSON: 10,
  COMPLETE_COURSE: 50,
  DAILY_LOGIN: 2,
  FIRST_POST_BONUS: 25,
};

// All available badges
export const BADGES = {
  FIRST_POST: 'first_post',
  GETTING_STARTED: 'getting_started',      // 5 threads
  COMMUNITY_VOICE: 'community_voice',       // 25 threads
  LIKED: 'liked',                           // first like received
  POPULAR: 'popular',                       // 50 likes received
  FIRST_COMMENT: 'first_comment',           // first comment
  COURSE_STARTED: 'course_started',         // started first course
  COURSE_COMPLETE: 'course_complete',       // completed first course
  SCHOLAR: 'scholar',                       // completed 3 courses
  EARLY_MEMBER: 'early_member',             // joined in first 30 days
  STREAK_7: 'streak_7',                     // 7 day login streak
  STREAK_30: 'streak_30',                   // 30 day login streak
};

// Badge display info
export const BADGE_INFO: Record<string, {
  label: string;
  description: string;
  emoji: string;
}> = {
  first_post: {
    label: 'First Post',
    description: 'Posted your first thread',
    emoji: '✍️',
  },
  getting_started: {
    label: 'Getting Started',
    description: 'Posted 5 threads',
    emoji: '🚀',
  },
  community_voice: {
    label: 'Community Voice',
    description: 'Posted 25 threads',
    emoji: '📢',
  },
  liked: {
    label: 'Liked',
    description: 'Received your first like',
    emoji: '👍',
  },
  popular: {
    label: 'Popular',
    description: 'Received 50 likes',
    emoji: '⭐',
  },
  first_comment: {
    label: 'Conversationalist',
    description: 'Posted your first comment',
    emoji: '💬',
  },
  course_started: {
    label: 'Student',
    description: 'Started your first course',
    emoji: '📚',
  },
  course_complete: {
    label: 'Graduate',
    description: 'Completed your first course',
    emoji: '🎓',
  },
  scholar: {
    label: 'Scholar',
    description: 'Completed 3 courses',
    emoji: '🏆',
  },
  early_member: {
    label: 'Early Member',
    description: 'Joined in the first 30 days',
    emoji: '🌟',
  },
  streak_7: {
    label: '7 Day Streak',
    description: 'Logged in 7 days in a row',
    emoji: '🔥',
  },
  streak_30: {
    label: '30 Day Streak',
    description: 'Logged in 30 days in a row',
    emoji: '💎',
  },
};

// Award points to a user
export const awardPoints = async (
  userId: string,
  points: number,
  type: string,
  description: string
) => {
  try {
    // Update user points total
    await updateDoc(doc(db, 'users', userId), {
      points: increment(points),
    });

    // Log the transaction
    await addDoc(
      collection(db, 'pointsHistory', userId, 'transactions'),
      {
        type,
        points,
        description,
        createdAt: serverTimestamp(),
      }
    );
  } catch (err) {
    console.log('Award points error:', err);
  }
};

// Award a badge to a user (checks if already has it)
export const awardBadge = async (
  userId: string,
  badgeId: string
) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;

    const badges = userSnap.data().badges || [];
    if (badges.includes(badgeId)) return; // already has it

    await updateDoc(userRef, {
      badges: arrayUnion(badgeId),
    });

    console.log(`Badge awarded: ${badgeId} to ${userId}`);
  } catch (err) {
    console.log('Award badge error:', err);
  }
};

// Called when user posts a thread
export const onThreadPosted = async (
  userId: string,
  totalThreads: number
) => {
  // Award points
  await awardPoints(
    userId,
    POINTS.POST_THREAD,
    'post_thread',
    'Posted a thread'
  );

  // First post bonus
  if (totalThreads === 1) {
    await awardPoints(
      userId,
      POINTS.FIRST_POST_BONUS,
      'first_post_bonus',
      'First post bonus!'
    );
    await awardBadge(userId, BADGES.FIRST_POST);
  }

  // Milestone badges
  if (totalThreads === 5) {
    await awardBadge(userId, BADGES.GETTING_STARTED);
  }
  if (totalThreads === 25) {
    await awardBadge(userId, BADGES.COMMUNITY_VOICE);
  }
};

// Called when user receives a like
export const onLikeReceived = async (
  userId: string,
  totalLikes: number
) => {
  await awardPoints(
    userId,
    POINTS.RECEIVE_LIKE,
    'receive_like',
    'Received a like'
  );

  if (totalLikes === 1) {
    await awardBadge(userId, BADGES.LIKED);
  }
  if (totalLikes === 50) {
    await awardBadge(userId, BADGES.POPULAR);
  }
};

// Called when user posts a comment
export const onCommentPosted = async (
  userId: string,
  totalComments: number
) => {
  await awardPoints(
    userId,
    POINTS.POST_COMMENT,
    'post_comment',
    'Posted a comment'
  );

  if (totalComments === 1) {
    await awardBadge(userId, BADGES.FIRST_COMMENT);
  }
};

// Called when user completes a lesson
export const onLessonCompleted = async (userId: string) => {
  await awardPoints(
    userId,
    POINTS.COMPLETE_LESSON,
    'complete_lesson',
    'Completed a lesson'
  );
};

// Called when user completes a course
export const onCourseCompleted = async (
  userId: string,
  totalCoursesCompleted: number
) => {
  await awardPoints(
    userId,
    POINTS.COMPLETE_COURSE,
    'complete_course',
    'Completed a course!'
  );

  if (totalCoursesCompleted === 1) {
    await awardBadge(userId, BADGES.COURSE_COMPLETE);
  }
  if (totalCoursesCompleted === 3) {
    await awardBadge(userId, BADGES.SCHOLAR);
  }
};

// Called on daily login
export const onDailyLogin = async (
  userId: string,
  streak: number
) => {
  await awardPoints(
    userId,
    POINTS.DAILY_LOGIN,
    'daily_login',
    'Daily login'
  );

  if (streak === 7) {
    await awardBadge(userId, BADGES.STREAK_7);
  }
  if (streak === 30) {
    await awardBadge(userId, BADGES.STREAK_30);
  }
};

// Check and award early member badge
export const checkEarlyMember = async (
  userId: string,
  createdAt: any
) => {
  try {
    const created = createdAt.toDate?.() || new Date(createdAt);
    // Check if joined within first 30 days of app launch
    // Set your app launch date here
    const launchDate = new Date('2026-05-01');
    const thirtyDaysAfterLaunch = new Date(
      launchDate.getTime() + 30 * 24 * 60 * 60 * 1000
    );
    if (created <= thirtyDaysAfterLaunch) {
      await awardBadge(userId, BADGES.EARLY_MEMBER);
    }
  } catch (err) {
    console.log('Early member check error:', err);
  }
};