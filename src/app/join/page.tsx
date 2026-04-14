"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { joinCommunity } from '@/lib/community';
import { supabase } from '@/lib/supabase';

import { Button } from '@/components/ui/button';

export default function JoinPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const { user, profile, loading } = useAuth();
  
  const [inviteCommunity, setInviteCommunity] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (!code) {
      setInviteError("No invite code provided.");
      return;
    }

    const checkInvite = async () => {
        const { data, error } = await supabase
            .from('invites')
            .select('community_name')
            .eq('id', code)
            .single();
            
        if (error || !data) {
            setInviteError("Invalid invite link");
        } else {
            setInviteCommunity(data.community_name);
        }
    };
    
    checkInvite();

  }, [code]);

  const handleJoin = async () => {
    if (!user || !profile || !code) return;
    setIsJoining(true);
    setInviteError('');
    try {
      await joinCommunity(code);
      router.push('/dashboard');
    } catch (e: any) {
      setInviteError(e.message || "Error joining");
    } finally {
      setIsJoining(false);
    }
  };


  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
       <div className="glass p-8 rounded-[2rem] border border-white/5 max-w-md w-full text-center space-y-6">
          <h1 className="text-2xl font-bold font-headline">Community Invite</h1>
          
          {inviteError ? (
            <div className="bg-red-500/10 text-red-500 p-4 rounded-xl">{inviteError}</div>
          ) : !inviteCommunity ? (
            <div>Checking invite...</div>
          ) : (
             <div className="space-y-6">
                <p className="text-muted-foreground">You have been invited to join</p>
                <div className="text-2xl font-bold text-primary">{inviteCommunity}</div>
                
                {!user ? (
                   <div className="space-y-4 pt-4">
                     <p className="text-sm">Sign in to accept this invitation.</p>
                     <Button 
                       onClick={() => router.push(`/signup?redirect=${encodeURIComponent('/join?code=' + code)}`)} 
                       className="w-full rounded-xl neon-glow"
                     >
                       Create Account
                     </Button>
                     <Button 
                       variant="outline"
                       onClick={() => router.push(`/login?redirect=${encodeURIComponent('/join?code=' + code)}`)} 
                       className="w-full rounded-xl"
                     >
                       Log In
                     </Button>
                   </div>
                ) : profile?.has_joined_community ? (
                    <div className="text-yellow-500 bg-yellow-500/10 p-4 rounded-xl text-sm">
                        You are already part of a community. You must leave your current community before joining a new one.
                    </div>
                ) : (
                   <Button onClick={handleJoin} disabled={isJoining} className="w-full rounded-xl neon-glow">
                      {isJoining ? 'Joining...' : 'Accept Invite'}
                   </Button>
                )}
             </div>
          )}
       </div>
    </div>
  );
}
