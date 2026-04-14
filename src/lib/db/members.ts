import { db } from '../firebase';
import { collection, doc, setDoc, getDoc, updateDoc, serverTimestamp, runTransaction, query, getDocs, deleteDoc } from 'firebase/firestore';

export interface Member {
  id?: string;
  role: 'admin' | 'moderator' | 'member';
  displayName: string;
  joinedAt: any;
}

export async function getMembers(communityId: string): Promise<Member[]> {
  if (!db) return [];
  try {
    const q = query(collection(db, 'communities', communityId, 'members'));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member));
  } catch (error) {
    console.error("Error fetching members", error);
    return [];
  }
}

export async function getMemberRole(communityId: string, userId: string): Promise<string | null> {
  if (!db) return null;
  const docRef = doc(db, 'communities', communityId, 'members', userId);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return snap.data().role;
  }
  return null;
}

export async function updateMemberRole(communityId: string, targetUserId: string, newRole: 'admin' | 'moderator' | 'member', adminUserId: string) {
  if (!db) throw new Error("Firebase uninitialized");
  
  try {
    await runTransaction(db, async (t) => {
      const adminMemberRef = doc(db, 'communities', communityId, 'members', adminUserId);
      const adminSnap = await t.get(adminMemberRef);
      if (!adminSnap.exists() || adminSnap.data().role !== 'admin') {
        throw new Error("Must be an admin to change roles.");
      }

      if(targetUserId === adminUserId && newRole !== 'admin') {
         // self demotion check: make sure there is another admin
         const q = query(collection(db, 'communities', communityId, 'members'));
         const membersSnap = await getDocs(q);
         const otherAdmins = membersSnap.docs.filter(d => d.id !== adminUserId && d.data().role === 'admin');
         if(otherAdmins.length === 0){
             throw new Error("You are the only admin. You cannot demote yourself.");
         }
      }

      const targetRef = doc(db, 'communities', communityId, 'members', targetUserId);
      t.update(targetRef, { role: newRole });
    });
    return true;
  } catch (e) {
    console.error("Error updating role", e);
    throw e;
  }
}

import { fbFunctions } from '../firebase';
import { httpsCallable } from 'firebase/functions';

export async function leaveCommunity(communityId: string) {
  if (!fbFunctions) throw new Error("Firebase functions not initialized");
  
  try {
    const leaveFn = httpsCallable(fbFunctions, 'leaveCommunity');
    const result = await leaveFn({ communityId });
    return result.data;
  } catch(e) {
    console.error("Error leaving community", e);
    throw e;
  }
}
