"use client";

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, isOnboarded } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    if (!isOnboarded) {
      router.push('/onboarding');
      return;
    }

  }, [user, loading, isOnboarded, router, pathname]);

  if (loading || !user || !isOnboarded) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="text-muted-foreground text-sm font-bold tracking-widest uppercase">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
