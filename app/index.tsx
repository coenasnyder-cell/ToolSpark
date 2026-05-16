// ToolSpark — index.tsx
// Status: ACTIVE
// Description: Entry point — redirects based on auth state

import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../services/firebase';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/colors';

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: Colors.bg
      }}>
        <ActivityIndicator color={Colors.gold} size="large" />
      </View>
    );
  }

  if (user) {
   return <Redirect href="/(tabs)"/>;
  }

  return <Redirect href="/(auth)/login" />;
}