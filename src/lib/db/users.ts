import { db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { incrementTotalUsers } from './stats';

/**
 * Ensures a user profile document exists in the Firestore database.
 * If it doesn't exist, it securely creates it with default initialization values.
 */
export async function createOrUpdateUserProfile(user: User, customName?: string) {
  if (!db || !user) return; // safeguard for missing config or null user

  const userRef = doc(db, 'users', user.uid);
  
  try {
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // Prioritize custom typed name > google display name > email prefix string slicing
      const finalName = customName || user.displayName || user.email?.split('@')[0] || 'Unknown Citizen';

      await setDoc(userRef, {
        name: finalName,
        email: user.email,
        role: 'user',
        rank: 1,
        points: 0,
        joinedChallenges: [],
        createdAt: serverTimestamp(),
      });

      // Increment global user count
      await incrementTotalUsers();
    }
  } catch (error) {
    console.error('Error synchronizing user profile in Firestore', error);
  }
}
