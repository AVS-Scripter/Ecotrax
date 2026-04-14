import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

const db = admin.firestore();

/**
 * Join a community using an invite code.
 * Enforces transactional safety and denormalization.
 */
export const joinCommunity = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }

  const { inviteCode } = data;
  const uid = context.auth.uid;

  return db.runTransaction(async (transaction) => {
    const inviteRef = db.collection('invites').doc(inviteCode);
    const inviteSnap = await transaction.get(inviteRef);

    if (!inviteSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Invalid invite code.');
    }

    const inviteData = inviteSnap.data()!;
    const communityId = inviteData.communityId;

    // Validation
    if (!inviteData.isActive || (inviteData.expiresAt && inviteData.expiresAt.toDate() < new Date())) {
      throw new functions.https.HttpsError('failed-precondition', 'Invite code has expired or is inactive.');
    }

    if (inviteData.maxUses !== null && inviteData.uses >= inviteData.maxUses) {
      throw new functions.https.HttpsError('failed-precondition', 'Invite code usage limit reached.');
    }

    const commRef = db.collection('communities').doc(communityId);
    const commSnap = await transaction.get(commRef);

    if (!commSnap.exists || commSnap.data()?.metadata?.isDeleted) {
      throw new functions.https.HttpsError('not-found', 'Community no longer exists.');
    }

    const memberRef = commRef.collection('members').doc(uid);
    const memberSnap = await transaction.get(memberRef);

    if (memberSnap.exists) {
      throw new functions.https.HttpsError('already-exists', 'You are already a member of this community.');
    }

    const userRef = db.collection('users').doc(uid);

    // Update Operations
    transaction.update(inviteRef, { 
      uses: admin.firestore.FieldValue.increment(1),
      isActive: (inviteData.maxUses !== null && inviteData.uses + 1 >= inviteData.maxUses) ? false : true
    });

    transaction.update(commRef, { 
      'metadata.memberCount': admin.firestore.FieldValue.increment(1) 
    });

    transaction.set(memberRef, {
      role: inviteData.role || 'member',
      joinedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    transaction.update(userRef, {
      joinedCommunities: admin.firestore.FieldValue.arrayUnion(communityId)
    });

    return { success: true, communityId };
  });
});

/**
 * Leave a community.
 * Prevents orphaned communities by checking for alternative admins.
 */
export const leaveCommunity = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }

  const { communityId } = data;
  const uid = context.auth.uid;

  return db.runTransaction(async (transaction) => {
    const commRef = db.collection('communities').doc(communityId);
    const memberRef = commRef.collection('members').doc(uid);
    const memberSnap = await transaction.get(memberRef);

    if (!memberSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Not a member of this community.');
    }

    const role = memberSnap.data()?.role;

    if (role === 'admin') {
      // Check if this is the last admin
      const adminsSnapshot = await transaction.get(
        commRef.collection('members').where('role', '==', 'admin')
      );
      
      if (adminsSnapshot.docs.length <= 1) {
        throw new functions.https.HttpsError(
          'failed-precondition', 
          'You are the final admin. Transfer ownership or delete the community before leaving.'
        );
      }
    }

    const userRef = db.collection('users').doc(uid);

    transaction.delete(memberRef);
    transaction.update(commRef, { 
      'metadata.memberCount': admin.firestore.FieldValue.increment(-1) 
    });
    transaction.update(userRef, {
      joinedCommunities: admin.firestore.FieldValue.arrayRemove(communityId)
    });

    return { success: true };
  });
});

/**
 * Soft delete a community.
 */
export const deleteCommunity = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in.');
  }

  const { communityId } = data;
  const uid = context.auth.uid;

  const commRef = db.collection('communities').doc(communityId);
  const memberRef = commRef.collection('members').doc(uid);
  const memberSnap = await memberRef.get();

  if (!memberSnap.exists || memberSnap.data()?.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only admins can delete a community.');
  }

  await commRef.update({
    'metadata.isDeleted': true,
    'metadata.deletedAt': admin.firestore.FieldValue.serverTimestamp()
  });

  return { success: true };
});

/**
 * Async cleanup for deleted communities.
 * Triggered by document update.
 */
export const cleanupDeletedCommunity = functions.firestore
  .document('communities/{communityId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();

    if (newData.metadata?.isDeleted && !oldData.metadata?.isDeleted) {
      const communityId = context.params.communityId;
      const membersRef = db.collection('communities').doc(communityId).collection('members');
      const membersSnap = await membersRef.get();

      const batch = db.batch();

      // 1. Remove community from all users' joinedCommunities array
      for (const memberDoc of membersSnap.docs) {
        const userRef = db.collection('users').doc(memberDoc.id);
        batch.update(userRef, {
          joinedCommunities: admin.firestore.FieldValue.arrayRemove(communityId)
        });
        batch.delete(memberDoc.ref);
      }

      // 2. Delete active invites
      const invitesSnap = await db.collection('invites').where('communityId', '==', communityId).get();
      for (const inviteDoc of invitesSnap.docs) {
        batch.delete(inviteDoc.ref);
      }

      // Note: In a production environment with massive groups, this should be sharded or use 
      // Cloud Tasks/PubSub for larger batches. For standard scale, a batched write suffices.
      await batch.commit();
      
      // Finally, delete the community record or keep it as a tombstone.
      // Here we keep it as a tombstone record (soft delete policy).
      console.log(`Cleanup complete for community: ${communityId}`);
    }
  });

/**
 * Utility to initialize user data.
 */
export const onUserCreated = functions.auth.user().onCreate(async (user) => {
  await db.collection('users').doc(user.uid).set({
    displayName: user.displayName || 'New User',
    email: user.email,
    joinedCommunities: [],
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
});
