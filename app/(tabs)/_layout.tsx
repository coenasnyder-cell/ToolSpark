import { Tabs } from 'expo-router';
import { useEffect } from 'react';
import { Colors } from '../../constants/colors';
import { Typography } from '../../constants/typography';
import { Text } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { onDailyLogin, checkEarlyMember } from '../../services/gamification';
import { registerForPushNotifications } from '../../services/notifications';
import { useUnreadMessages } from '../../hooks/useUnreadMessages';
export default function TabLayout() {
  const unreadMessages = useUnreadMessages();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (!u) return;

      const userRef = doc(db, 'users', u.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return;
      const userData = userSnap.data();

      const today = new Date().toDateString();
      const lastLogin = userData?.lastLoginDate?.toDate?.()?.toDateString();

      if (lastLogin !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const wasYesterday = lastLogin === yesterday.toDateString();
        const newStreak = wasYesterday ? (userData?.streak || 0) + 1 : 1;
        await updateDoc(userRef, {
          lastLoginDate: serverTimestamp(),
          streak: newStreak,
        });

        await onDailyLogin(u.uid, newStreak);
      }

      if (userData?.createdAt) {
        await checkEarlyMember(u.uid, userData.createdAt);
      }

      await registerForPushNotifications(u.uid);
    });
    return unsubscribe;
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
        backgroundColor: Colors.sidebar,
        borderTopColor: Colors.border,
        borderTopWidth: 1,
        height: 85,              // taller to account for home indicator
        paddingBottom: 28,       // pushes icons up above home indicator
        paddingTop: 10,
        },
        tabBarActiveTintColor: Colors.gold,
        tabBarInactiveTintColor: Colors.text3,
        tabBarLabelStyle: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Community',
          tabBarIcon: ({ color }) => (
            <TabIcon symbol="💬" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="courses"
        options={{
          title: 'Courses',
          tabBarIcon: ({ color }) => (
            <TabIcon symbol="⊞" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tools"
        options={{
          title: 'Tools',
          tabBarIcon: ({ color }) => (
            <TabIcon symbol="✦" color={color} />
          ),
        }}
      />
      <Tabs.Screen
  name="inbox"
  options={{
    title: 'Inbox',
    tabBarIcon: ({ color }) => (
      <TabIcon symbol="✉️" color={color} />
    ),
    tabBarBadge: unreadMessages > 0 ? unreadMessages : undefined,
    tabBarBadgeStyle: {
      backgroundColor: Colors.gold,
      color: Colors.bg,
      fontSize: 10,
      fontWeight: '700',
    },
  }}
/>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <TabIcon symbol="⊞" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

function TabIcon({ symbol, color }: { 
  symbol: string; 
  color: string; 
}) {
  return (
    <Text style={{ fontSize: 22, color }}>
      {symbol}
    </Text>
  );
}