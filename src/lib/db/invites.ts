import { db } from '../firebase';
import { collection, doc, setDoc, getDoc, updateDoc, serverTimestamp, runTransaction, Timestamp, query, where, getDocs, orderBy, arrayUnion } from 'firebase/firestore';

export interface Invite {
  id?: string;
  communityId: string;
  communityName: string;
  createdBy: string;
  maxUses: number | null;
  usedCount: number;
  expiresAt: any;
  createdAt: any;
}

const INVITES_COLLECTION = 'invites';

export async function createInvite(communityId: string, communityName: string, createdBy: string, maxUses: number | null = null, expiresInDays: number = 7) {
  if (!db) throw new Error("Firebase not initialized");

  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const inviteRef = doc(db, INVITES_COLLECTION, inviteCode);
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);

  const inviteData = {
    communityId,
    communityName,
    createdBy,
    maxUses,
    usedCount: 0,
    expiresAt: Timestamp.fromDate(expiresAt),
    createdAt: serverTimestamp()
  };

  await setDoc(inviteRef, inviteData);
  return inviteCode;
}

export async function validateInvite(inviteCode: string) {
  if (!db) return { valid: false, error: "Firebase uninitialized" };

  try {
    const inviteRef = doc(db, INVITES_COLLECTION, inviteCode);
    const snap = await getDoc(inviteRef);
    if (!snap.exists()) return { valid: false, error: "Invalid invite code." };
    
    const invite = snap.data() as Invite;
    
    if (invite.expiresAt && invite.expiresAt.toDate() < new Date()) {
      return { valid: false, error: "Invite code has expired." };
    }
    if (invite.maxUses !== null && invite.usedCount >= invite.maxUses) {
      return { valid: false, error: "Invite code usage limit reached." };
    }

    // Check if community is deleted
    const commRef = doc(db, 'communities', invite.communityId);
    const commSnap = await getDoc(commRef);
    if (!commSnap.exists() || commSnap.data().isDeleted) {
      return { valid: false, error: "Community no longer exists." };
    }

    return { valid: true, invite: { id: snap.id, ...invite } };
  } catch (error) {
    console.error("Error validating invite:", error);
    return { valid: false, error: "An error occurred." };
  }
}

export async function useInvite(inviteCode: string, userId: string, displayName: string) {
  if (!db) throw new Error("Firebase not initialized");

  try {
    const result = await runTransaction(db, async (transaction) => {
      const inviteRef = doc(db, INVITES_COLLECTION, inviteCode);
      const inviteSnap = await transaction.get(inviteRef);

      if (!inviteSnap.exists()) {
        throw new Error("Invalid invite code.");
      }

      const inviteData = inviteSnap.data() as Invite;
      const communityId = inviteData.communityId;

      // Validation
      const now = new Date();
      if (!inviteData.isActive || (inviteData.expiresAt && inviteData.expiresAt.toDate() < now)) {
        throw new Error("Invite code has expired or is inactive.");
      }

      if (inviteData.maxUses !== null && inviteData.usedCount >= inviteData.maxUses) {
        throw new Error("Invite code usage limit reached.");
      }

      const commRef = doc(db, 'communities', communityId);
      const commSnap = await transaction.get(commRef);

      if (!commSnap.exists() || commSnap.data()?.metadata?.isDeleted) {
        throw new Error("Community no longer exists.");
      }

      const memberRef = doc(db, 'communities', communityId, 'members', userId);
      const memberSnap = await transaction.get(memberRef);

      if (memberSnap.exists()) {
        throw new Error("You are already a member of this community.");
      }

      const userRef = doc(db, 'users', userId);

      // Update Operations
      transaction.update(inviteRef, { 
        usedCount: (inviteData.usedCount || 0) + 1,
        isActive: (inviteData.maxUses !== null && (inviteData.usedCount || 0) + 1 >= inviteData.maxUses) ? false : true
      });

      transaction.update(commRef, { 
        'metadata.memberCount': (commSnap.data()?.metadata?.memberCount || 0) + 1 
      });

      transaction.set(memberRef, {
        role: 'member',
        displayName: displayName || 'Unknown Citizen',
        joinedAt: serverTimestamp()
      });

      transaction.update(userRef, {
        joinedCommunities: arrayUnion(communityId)
      });

      return { success: true, communityId };
    });

    return result;
  } catch (error) {
    console.error("Error using invite:", error);
    throw error;
  }
}

export async function getInvitesForCommunity(communityId: string) {
  if (!db) return [];
  try {
    const q = query(collection(db, INVITES_COLLECTION), where("communityId", "==", communityId), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invite));
  } catch (e) {
    console.error("error fetching invites", e);
    return [];
  }
}
