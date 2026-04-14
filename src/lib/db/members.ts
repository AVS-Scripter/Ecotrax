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

import { arrayRemove, increment } from 'firebase/firestore';

export async function leaveCommunity(communityId: string, userId: string) {
  if (!db) throw new Error("Firebase not initialized");
  
  try {
    const result = await runTransaction(db, async (transaction) => {
      const commRef = doc(db, 'communities', communityId);
      const memberRef = doc(db, 'communities', communityId, 'members', userId);
      const memberSnap = await transaction.get(memberRef);

      if (!memberSnap.exists()) {
        throw new Error("Not a member of this community.");
      }

      const role = memberSnap.data()?.role;

      if (role === 'admin') {
        // Check if this is the last admin
        const membersRef = collection(db, 'communities', communityId, 'members');
        // Note: Querying in a transaction is tricky in some versions, 
        // but here we can just use the memberCount if we trust it, 
        // or actually fetch all members (though that's expensive).
        // Since we are moving to client-side, we'll try to do a check.
        const q = query(membersRef);
        const membersSnap = await getDocs(q); 
        const otherAdmins = membersSnap.docs.filter(d => d.id !== userId && d.data().role === 'admin');
        
        if (otherAdmins.length === 0) {
          throw new Error("You are the final admin. Transfer ownership or delete the community before leaving.");
        }
      }

      const userRef = doc(db, 'users', userId);

      transaction.delete(memberRef);
      transaction.update(commRef, { 
        'metadata.memberCount': increment(-1) 
      });
      transaction.update(userRef, {
        joinedCommunities: arrayRemove(communityId)
      });

      return { success: true };
    });

    return result;
  } catch(e) {
    console.error("Error leaving community", e);
    throw e;
  }
}
