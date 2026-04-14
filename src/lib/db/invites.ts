import { db } from '../firebase';
import { collection, doc, setDoc, getDoc, updateDoc, serverTimestamp, runTransaction, Timestamp, query, where, getDocs, orderBy } from 'firebase/firestore';

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

import { fbFunctions } from '../firebase';
import { httpsCallable } from 'firebase/functions';

export async function useInvite(inviteCode: string) {
  if (!fbFunctions) throw new Error("Firebase functions not initialized");

  try {
    const joinFn = httpsCallable(fbFunctions, 'joinCommunity');
    const result = await joinFn({ inviteCode });
    return result.data;
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
