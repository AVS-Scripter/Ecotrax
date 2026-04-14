import { db } from '../firebase';
import { collection, doc, setDoc, getDoc, updateDoc, serverTimestamp, runTransaction, Timestamp, arrayUnion, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

export interface Community {
  id?: string;
  name: string;
  icon: string;
  createdBy: string;
  metadata: {
    memberCount: number;
    isDeleted: boolean;
    deletedAt?: any;
  };
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
      const userData = userSnap.data();
      if (userSnap.exists() && userData?.joinedCommunities && userData.joinedCommunities.length > 0) {
        throw new Error("You are already part of a community! Please leave your current community before creating a new one.");
      }

      // Create community
      transaction.set(communityRef, {
        name,
        icon,
        createdBy: userId,
        metadata: {
          memberCount: 1,
          isDeleted: false,
          deletedAt: null
        },
        createdAt: serverTimestamp(),
      });

      // Add user as admin
      transaction.set(memberRef, {
        role: 'admin',
        displayName: displayName || 'Unknown Citizen',
        joinedAt: serverTimestamp(),
      });

      // Update user joinedCommunities
      transaction.update(userRef, {
        joinedCommunities: arrayUnion(communityRef.id)
      });

      // Create a default invite link
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now
      transaction.set(inviteRef, {
        communityId: communityRef.id,
        communityName: name,
        createdBy: userId,
        maxUses: null, // unlimited
        uses: 0,
        isActive: true,
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

export async function deleteCommunity(communityId: string, userId: string) {
  if (!db) throw new Error("Firebase not initialized");
  
  const communityRef = doc(db, COMMUNITIES_COLLECTION, communityId);
  const memberRef = doc(db, COMMUNITIES_COLLECTION, communityId, 'members', userId);
  const memberSnap = await getDoc(memberRef);

  if (!memberSnap.exists() || memberSnap.data()?.role !== 'admin') {
    throw new Error("Only admins can delete a community.");
  }

  await updateDoc(communityRef, {
    'metadata.isDeleted': true,
    'metadata.deletedAt': serverTimestamp()
  });

  // Note: Full cleanup (removing from all users' arrays) cannot be done 
  // safely from the client-side for all users due to permission restrictions.
  // Instead, the UI should filter out deleted communities.
  
  return { success: true };
}

export async function getCommunity(communityId: string): Promise<Community | null> {
  if (!db) return null;
  try {
    const docRef = doc(db, COMMUNITIES_COLLECTION, communityId);
    const snap = await getDoc(docRef);
    if (snap.exists() && !snap.data().metadata?.isDeleted) {
      return { id: snap.id, ...snap.data() } as Community;
    }
    return null;
  } catch (error) {
    console.error('Error fetching community:', error);
    return null;
  }
}

export async function searchComunitiesByName(name: string, limitResults: number = 10): Promise<Community[]> {
  if (!db) return [];
  try {
    const q = query(
      collection(db, COMMUNITIES_COLLECTION),
      where('metadata.isDeleted', '==', false),
      where('name', '>=', name),
      where('name', '<=', name + '\uf8ff'),
      limit(limitResults)
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Community));
  } catch (error) {
    console.error('Error searching communities:', error);
    return [];
  }
}

export async function getAllCommunities(limitResults: number = 20): Promise<Community[]> {
  if (!db) return [];
  try {
    const q = query(
      collection(db, COMMUNITIES_COLLECTION),
      where('metadata.isDeleted', '==', false),
      orderBy('createdAt', 'desc'),
      limit(limitResults)
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Community));
  } catch (error) {
    console.error('Error fetching communities:', error);
    return [];
  }
}
