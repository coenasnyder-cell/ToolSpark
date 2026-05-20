import * as ExpoNotifications from 'expo-notifications';
import * as Device from 'expo-device';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

// ─────────────────────────────────────────────
// Configure how notifications appear when app is foregrounded
// ─────────────────────────────────────────────
ExpoNotifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ─────────────────────────────────────────────
// Returns a native FCM token (not an Expo push token)
// Pass this to your backend which calls FCM directly
// ─────────────────────────────────────────────
export const registerForPushNotifications = async (
  userId: string
): Promise<string | null> => {
  try {
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    const { status: existingStatus } =
      await ExpoNotifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } =
        await ExpoNotifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Push notification permission denied');
      return null;
    }

    const tokenData = await ExpoNotifications.getDevicePushTokenAsync();
    const token = tokenData.data; // raw FCM token string

    // Save token to user doc
    await updateDoc(doc(db, 'users', userId), {
      fcmToken: token,
    });

    return token;
  } catch (err) {
    console.log('Push registration error:', err);
    return null;
  }
};

// ─────────────────────────────────────────────
// Get a user's saved push token from Firestore
// ─────────────────────────────────────────────
export const getUserPushToken = async (
  userId: string
): Promise<string | null> => {
  try {
    const snap = await getDoc(doc(db, 'users', userId));
    return snap.data()?.fcmToken || null;
  } catch {
    return null;
  }
};

// ─────────────────────────────────────────────
// SEND PUSH NOTIFICATION
//
// TODO for implementer:
// Replace the fetch call below with your own backend endpoint.
// Your backend should accept { token, title, body, data }
// and call FCM using your server key.
//
// Example backend endpoint: POST /api/send-notification
// ─────────────────────────────────────────────
export const sendPushNotification = async ({
  token,
  title,
  body,
  data = {},
}: {
  token: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<void> => {
  if (!token) return;

  try {
    // ── IMPLEMENTER: replace this URL with your backend endpoint ──
    await fetch('https://YOUR_BACKEND_URL/api/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, title, body, data }),
    });
    // ─────────────────────────────────────────────────────────────
  } catch (err) {
    console.log('Send push error:', err);
  }
};

// ─────────────────────────────────────────────
// Notification type helpers
// Call these alongside your existing Firestore addDoc calls
// ─────────────────────────────────────────────

export const sendLikeNotification = async (
  recipientUserId: string,
  senderName: string,
  threadTitle: string,
  threadId: string
): Promise<string | null> => {
  const token = await getUserPushToken(recipientUserId);
  if (token) {
    await sendPushNotification({
      token,
      title: 'Someone liked your post',
      body: `${senderName} liked your thread "${threadTitle}"`,
      data: { threadId, type: 'like' },
    });
  }
  return token; // return so caller can save as recipientToken
};

export const sendCommentNotification = async (
  recipientUserId: string,
  senderName: string,
  threadTitle: string,
  threadId: string
): Promise<string | null> => {
  const token = await getUserPushToken(recipientUserId);
  if (token) {
    await sendPushNotification({
      token,
      title: 'New comment on your thread',
      body: `${senderName} commented on "${threadTitle}"`,
      data: { threadId, type: 'comment' },
    });
  }
  return token;
};

export const sendMentionNotification = async (
  recipientUserId: string,
  senderName: string,
  threadTitle: string,
  threadId: string
): Promise<string | null> => {
  const token = await getUserPushToken(recipientUserId);
  if (token) {
    await sendPushNotification({
      token,
      title: 'You were mentioned',
      body: `${senderName} mentioned you in "${threadTitle}"`,
      data: { threadId, type: 'mention' },
    });
  }
  return token;
};
export const sendMessageNotification = async (
  recipientUserId: string,
  senderName: string,
  messagePreview: string,
  conversationId: string
): Promise<string | null> => {
  const token = await getUserPushToken(recipientUserId);
  if (token) {
    await sendPushNotification({
      token,
      title: `New message from ${senderName}`,
      body: messagePreview.length > 50
        ? messagePreview.substring(0, 50) + '...'
        : messagePreview,
      data: { conversationId, type: 'message' },
    });
  }
  return token;
};