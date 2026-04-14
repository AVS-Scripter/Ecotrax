"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface UserProfile {
  displayName: string;
  email: string;
  rank: number | null;
  points: number;
  joinedCommunities: string[];
  createdAt: any;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isOnboarded: boolean;
  communityId: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isOnboarded: false,
  communityId: null,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      if (currentUser && db) {
        const userRef = doc(db, 'users', currentUser.uid);
        const unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            setProfile(null);
          }
          setLoading(false);
        });
        
        return () => unsubscribeProfile();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const isOnboarded = !!(profile && profile.joinedCommunities && profile.joinedCommunities.length > 0);
  const communityId = (profile?.joinedCommunities && profile.joinedCommunities.length > 0) ? profile.joinedCommunities[0] : null;

  return (
    <AuthContext.Provider value={{ user, profile, loading, isOnboarded, communityId }}>
      {children}
    </AuthContext.Provider>
  );
}
