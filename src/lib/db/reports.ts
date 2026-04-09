import { db } from '../firebase';
import { 
  collection, addDoc, getDocs, query, 
  orderBy, limit, serverTimestamp, 
  onSnapshot, where, Timestamp 
} from 'firebase/firestore';
import { incrementTotalReports } from './stats';

export interface Report {
  id?: string;
  userId?: string;
  name: string;
  issueType: string;
  description: string;
  location: string;
  image: string | null;
  status: 'in-progress' | 'completed' | 'incomplete';
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
 * Subscribes to reports with optional filters.
 */
export function subscribeToReports(callback: (reports: Report[]) => void, statusFilter?: string) {
  if (!db) return () => {};

  let q = query(collection(db, REPORTS_COLLECTION), orderBy('createdAt', 'desc'));

  if (statusFilter && statusFilter !== 'all') {
    q = query(q, where('status', '==', statusFilter));
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
 * Fetches recent reports.
 */
export async function getRecentReports(count: number = 5) {
  if (!db) return [];

  try {
    const q = query(
      collection(db, REPORTS_COLLECTION), 
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
