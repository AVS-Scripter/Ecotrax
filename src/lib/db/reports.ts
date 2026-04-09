import { db } from '../firebase';
import { 
  collection, addDoc, getDocs, query, 
  orderBy, limit, serverTimestamp, 
  onSnapshot, where, Timestamp, updateDoc, doc
} from 'firebase/firestore';
import { incrementTotalReports } from './stats';

export interface Report {
  id?: string;
  communityId: string;
  userId?: string;
  name: string;
  issueType: string;
  description: string;
  location: string;
  image: string | null;
  status: 'in-progress' | 'resolved' | 'unresolved';
  assignedTo?: string | null;
  createdAt: Timestamp;
}

const REPORTS_COLLECTION = 'reports';

/**
 * Creates a new report in Firestore.
 */
export async function createReport(reportData: Omit<Report, 'id' | 'createdAt'>) {
  if (!db) return null;

  try {
    const docRef = await addDoc(collection(db, REPORTS_COLLECTION), {
      ...reportData,
      status: reportData.status || 'unresolved',
      assignedTo: null,
      createdAt: serverTimestamp(),
    });

    // Increment global report count
    await incrementTotalReports();

    return docRef.id;
  } catch (error) {
    console.error('Error creating report:', error);
    return null;
  }
}

/**
 * Subscribes to reports for a specific community with optional filters.
 */
export function subscribeToReports(communityId: string, callback: (reports: Report[]) => void, statusFilter?: string) {
  if (!db || !communityId) return () => {};

  let q = query(
    collection(db, REPORTS_COLLECTION),
    where('communityId', '==', communityId),
    orderBy('createdAt', 'desc')
  );

  if (statusFilter && statusFilter !== 'all') {
    // Note: requires composite index on communityId + status + createdAt
    q = query(
        collection(db, REPORTS_COLLECTION),
        where('communityId', '==', communityId),
        where('status', '==', statusFilter),
        orderBy('createdAt', 'desc')
    );
  }

  return onSnapshot(q, (snapshot) => {
    const reports = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Report[];
    callback(reports);
  });
}

/**
 * Fetches recent reports for a community.
 */
export async function getRecentReports(communityId: string, count: number = 5) {
  if (!db || !communityId) return [];

  try {
    const q = query(
      collection(db, REPORTS_COLLECTION),
      where('communityId', '==', communityId),
      orderBy('createdAt', 'desc'), 
      limit(count)
    );
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Report[];
  } catch (error) {
    console.error('Error fetching recent reports:', error);
    return [];
  }
}

export async function updateReportStatus(reportId: string, newStatus: string) {
    if (!db) return;
    const ref = doc(db, REPORTS_COLLECTION, reportId);
    await updateDoc(ref, { status: newStatus });
}
