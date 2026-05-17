import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCJ0aVMa7M_Bs_Rg7otoAuckI86OtsFUgE",
  authDomain: "toolspark-2d62d.firebaseapp.com",
  projectId: "toolspark-2d62d",
  storageBucket: "toolspark-2d62d.firebasestorage.app",
  messagingSenderId: "82966513396",
  appId: "1:82966513396:web:f52b52b0ed2dc9537ac0a1"
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;