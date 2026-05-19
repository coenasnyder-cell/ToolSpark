import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../services/firebase';

export function useUnreadCount() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Try current user first
    const user = auth.currentUser;
   
    if (!user) {
      // Fall back to auth state listener
      const authUnsubscribe = onAuthStateChanged(auth, (u) => {
                if (!u) return;
        setupListener(u.uid);
      });
      return authUnsubscribe;
    }

    return setupListener(user.uid);
  }, []);

  function setupListener(userId: string) {
      const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.docs.length);
    }, (error) => {
    });

    return unsubscribe;
  }

  return unreadCount;
}