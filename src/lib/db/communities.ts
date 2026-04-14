import { db } from '../firebase';
import { collection, doc, setDoc, getDoc, updateDoc, serverTimestamp, runTransaction, Timestamp } from 'firebase/firestore';

export interface Community {
  id?: string;
  name: string;
  icon: string;
  createdBy: string;
  isDeleted: boolean;
  memberCount: number;
  createdAt: any;
}

const COMMUNITIES_COLLECTION = 'communities';

export async function createCommunity(name: string, icon: string, userId: string, displayName: string) {
  if (!db) throw new Error("Firebase not initialized");
  
  const communityRef = doc(collection(db, COMMUNITIES_COLLECTION));
  const memberRef = doc(db, COMMUNITIES_COLLECTION, communityRef.id, 'members', userId);
  const userRef = doc(db, 'users', userId);

  // Default invite short code
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const inviteRef = doc(db, 'invites', inviteCode);

  try {
    await runTransaction(db, async (transaction) => {
      // Validate that the user hasn't already joined a community
      const userSnap = await transaction.get(userRef);
      if (userSnap.exists() && userSnap.data().hasJoinedCommunity) {
        throw new Error("You are already part of a community! Please leave your current community before creating a new one.");
      }

      // Create community
      transaction.set(communityRef, {
        name,
        icon,
        createdBy: userId,
        isDeleted: false,
        memberCount: 1,
        createdAt: serverTimestamp(),
      });

      // Add user as admin
      transaction.set(memberRef, {
        role: 'admin',
        displayName: displayName || 'Unknown Citizen',
        joinedAt: serverTimestamp(),
      });

      // Update user hasJoinedCommunity
      transaction.update(userRef, {
        hasJoinedCommunity: communityRef.id
      });

      // Create a default invite link
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now
      transaction.set(inviteRef, {
        communityId: communityRef.id,
        communityName: name,
        createdBy: userId,
        maxUses: null, // unlimited
        usedCount: 0,
        expiresAt: Timestamp.fromDate(expiresAt),
        createdAt: serverTimestamp()
      });
    });

    return { communityId: communityRef.id, inviteCode };
  } catch (error) {
    console.error('Error creating community:', error);
    throw error;
  }
}

export async function getCommunity(communityId: string): Promise<Community | null> {
  if (!db) return null;
  try {
    const docRef = doc(db, COMMUNITIES_COLLECTION, communityId);
    const snap = await getDoc(docRef);
    if (snap.exists() && !snap.data().isDeleted) {
      return { id: snap.id, ...snap.data() } as Community;
    }
    return null;
  } catch (error) {
    console.error('Error fetching community:', error);
    return null;
  }
}
