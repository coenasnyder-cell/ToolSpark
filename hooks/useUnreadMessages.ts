import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../services/firebase';

export const useUnreadMessages = () => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const authUnsub = onAuthStateChanged(auth, (u) => {
      if (!u) { setUnreadCount(0); return; }

      const q = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', u.uid)
      );

      const unsub = onSnapshot(q, (snap) => {
        let total = 0;
        snap.docs.forEach((d) => {
          const data = d.data();
          total += data.unreadCount?.[u.uid] || 0;
        });
        setUnreadCount(total);
      });

      return unsub;
    });

    return authUnsub;
  }, []);

  return unreadCount;
};