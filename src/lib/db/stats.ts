import { db } from '../firebase';
import { doc, getDoc, updateDoc, increment, setDoc, onSnapshot } from 'firebase/firestore';

export interface GlobalStats {
  totalReports: number;
  monitoredZones: number;
  totalUsers: number;
  lifetimeVisits: number;
}

const STATS_DOC_ID = 'singleton_stats';
const statsRef = db ? doc(db, 'global_stats', STATS_DOC_ID) : null;

/**
 * Fetches the current global statistics.
 */
export async function getGlobalStats(): Promise<GlobalStats | null> {
  if (!statsRef) return null;
  
  try {
    const snap = await getDoc(statsRef);
    if (snap.exists()) {
      return snap.data() as GlobalStats;
    } else {
      // Initialize if not exists
      const initialStats: GlobalStats = {
        totalReports: 0,
        monitoredZones: 0,
        totalUsers: 0,
        lifetimeVisits: 0
      };
      await setDoc(statsRef, initialStats);
      return initialStats;
    }
  } catch (error) {
    console.error('Error fetching global stats:', error);
    return null;
  }
}

/**
 * Listens to real-time updates for global statistics.
 */
export function subscribeToGlobalStats(callback: (stats: GlobalStats) => void) {
  if (!statsRef) return () => {};

  return onSnapshot(statsRef, (snap) => {
    if (snap.exists()) {
      callback(snap.data() as GlobalStats);
    }
  });
}

/**
 * Increments the total users count.
 */
export async function incrementTotalUsers() {
  if (!statsRef) return;
  try {
    await updateDoc(statsRef, {
      totalUsers: increment(1)
    });
  } catch (error) {
    console.error('Error incrementing total users:', error);
  }
}

/**
 * Increments the lifetime visits count.
 */
export async function incrementLifetimeVisits() {
  if (!statsRef) return;
  try {
    await updateDoc(statsRef, {
      lifetimeVisits: increment(1)
    });
  } catch (error) {
    console.error('Error incrementing lifetime visits:', error);
  }
}

/**
 * Increments the total reports count.
 */
export async function incrementTotalReports() {
  if (!statsRef) return;
  try {
    await updateDoc(statsRef, {
      totalReports: increment(1)
    });
  } catch (error) {
    console.error('Error incrementing total reports:', error);
  }
}
