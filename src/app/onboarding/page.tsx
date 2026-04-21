"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Plus, Link as LinkIcon, LogOut } from 'lucide-react';
import { createCommunity, joinCommunity } from '@/lib/community';
import { signOut } from '@/lib/auth';
import { supabase } from '@/lib/supabase';


export default function OnboardingPage() {
  const { user, profile, isOnboarded, loading } = useAuth();
  const router = useRouter();

  const [createName, setCreateName] = useState('');
  const [createIcon, setCreateIcon] = useState('🌍');
  const [isCreating, setIsCreating] = useState(false);

  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  useEffect(() => {
    if (!loading && isOnboarded) {
      router.push('/dashboard');
    }
  }, [loading, isOnboarded, router]);

  if (loading || isOnboarded) {
    return <div className="min-h-screen pt-24 text-center">Loading...</div>;
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    setIsCreating(true);
    try {
      const displayName = profile.name || user.displayName || user.email?.split('@')[0] || 'Citizen'
      const community = await createCommunity(createName.trim(), createIcon.trim() || '🌍', user.id, displayName);
      router.push(`/community?id=${community.communityId}`);
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Error creating community');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    setIsJoining(true);
    setJoinError('');
    try {
      const displayName = profile.name || user.displayName || user.email?.split('@')[0] || 'Citizen'
      const communityId = await joinCommunity(joinCode.trim(), user.id, displayName);
      if (!communityId) {
        throw new Error('Unable to determine joined community ID.');
      }
      router.push(`/community?id=${communityId}`);
    } catch (error: any) {
      console.error(error);
      setJoinError(error.message || 'Error joining community');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLogout = () => {
    signOut();
  }


  return (
    <div className="min-h-screen pt-24 flex items-center justify-center px-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle,rgba(0,255,159,0.03)_0%,transparent_60%)] pointer-events-none" />
      
      <div className="w-full max-w-4xl relative animate-in fade-in zoom-in-95 duration-500 space-y-8">
        <div className="text-center space-y-2">
            <h1 className="text-3xl font-headline font-bold">Welcome to Ecotrax, {profile?.name}</h1>
            <p className="text-muted-foreground text-sm">Join a community or start your own to begin.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Join Panel */}
            <div className="glass p-8 rounded-[2rem] border border-white/5 shadow-2xl space-y-6 relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-3 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                        <LinkIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold font-headline">Join a Community</h2>
                        <p className="text-xs text-muted-foreground">Got an invite code?</p>
                    </div>
                </div>

                <form onSubmit={handleJoin} className="space-y-4 relative z-10">
                    {joinError && <div className="text-red-500 text-sm font-bold text-center bg-red-500/10 py-2 rounded-xl">{joinError}</div>}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest ml-1">Invite Code</label>
                        <Input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="e.g. X7KQ9M" className="bg-white/5 border-white/10 rounded-2xl h-12 uppercase" required />
                    </div>
                    <Button type="submit" disabled={isJoining} className="w-full h-12 rounded-2xl neon-glow font-bold">
                        {isJoining ? 'Joining...' : 'Join Now'}
                    </Button>
                </form>
            </div>

            {/* Create Panel */}
            <div className="glass p-8 rounded-[2rem] border border-white/5 shadow-2xl space-y-6 relative overflow-hidden group">
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-3 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                        <Plus className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold font-headline">Create Community</h2>
                        <p className="text-xs text-muted-foreground">Start a new movement.</p>
                    </div>
                </div>

                <form onSubmit={handleCreate} className="space-y-4 relative z-10">
                    <div className="grid grid-cols-4 gap-2">
                        <div className="col-span-1 space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest ml-1">Icon</label>
                            <Input value={createIcon} onChange={(e) => setCreateIcon(e.target.value)} className="bg-white/5 border-white/10 rounded-2xl h-12 text-center text-xl" required maxLength={2} />
                        </div>
                        <div className="col-span-3 space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest ml-1">Name</label>
                            <Input value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="Green City Alliance" className="bg-white/5 border-white/10 rounded-2xl h-12" required />
                        </div>
                    </div>
                    <Button type="submit" disabled={isCreating} variant="outline" className="w-full h-12 rounded-2xl text-blue-400 border-blue-400/30 hover:bg-blue-400/10 font-bold">
                        {isCreating ? 'Creating...' : 'Create New'}
                    </Button>
                </form>
            </div>
        </div>
        <div className="flex justify-center">
            <Button variant="ghost" onClick={handleLogout} className="text-xs text-muted-foreground hover:text-white">
                <LogOut className="w-3 h-3 mr-2" /> Log out
            </Button>
        </div>
      </div>
    </div>
  );
}
