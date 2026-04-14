import { db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { incrementTotalUsers } from './stats';

export async function createOrUpdateUserProfile(user: User, customName?: string) {
  if (!db || !user) return; // safeguard for missing config or null user

  const userRef = doc(db, 'users', user.uid);
  
  try {
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const finalName = customName || user.displayName || user.email?.split('@')[0] || 'Unknown Citizen';

      await setDoc(userRef, {
        name: finalName,
        email: user.email,
        rank: null,
        points: 0,
        hasJoinedCommunity: "",
        createdAt: serverTimestamp(),
      });

      await incrementTotalUsers();
    }
  } catch (error) {
    console.error('Error synchronizing user profile in Firestore', error);
  }
}

export async function getUserProfile(userId: string) {
  if (!db) return null;
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    return snap.data();
  }
  return null;
}
