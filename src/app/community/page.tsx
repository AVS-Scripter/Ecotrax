"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { getCommunity, Community } from '@/lib/db/communities';
import { getMembers, Member, leaveCommunity } from '@/lib/db/members';
import { Users, Settings, LogOut, ShieldAlert, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';

export default function CommunityPageWrapper() {
  const { user, loading, communityId, isOnboarded } = useAuth();

  if (loading) {
    return <div className="pt-24 text-center">Loading...</div>;
  }

  if (!user || !isOnboarded || !communityId) {
    return (
      <div className="pt-24 pb-12 px-6 max-w-2xl mx-auto space-y-8 text-center pt-32">
        <h1 className="text-3xl font-headline font-bold">Community Hub</h1>
        <p className="text-muted-foreground">Sign in and join a community to interact with your local group.</p>
        {!user ? (
            <Link href="/login">
                <Button className="mt-4 neon-glow rounded-xl">Sign in to continue</Button>
            </Link>
        ) : (
            <Link href="/onboarding">
                <Button className="mt-4 neon-glow rounded-xl">Join a Community</Button>
            </Link>
        )}
      </div>
    );
  }

  return <CommunityHub />;
}

function CommunityHub() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queriedId = searchParams.get('id');
  const { user, communityId: userCommunityId } = useAuth();
  
  // Use the queried ID if present, otherwise fallback to the user's community
  const activeId = queriedId || userCommunityId;

  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Check if current user is an admin of this community
  const currentUserMember = members.find(m => m.id === user?.uid);
  const isAdmin = currentUserMember?.role === 'admin';

  useEffect(() => {
    if (!activeId) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      const comm = await getCommunity(activeId);
      setCommunity(comm);
      if (comm) {
        const mems = await getMembers(activeId);
        setMembers(mems);
      }
      setLoading(false);
    };

    loadData();
  }, [activeId]);

  const handleLeave = async () => {
    if (!activeId || !user) return;
    if (confirm("Are you sure you want to leave this community?")) {
        try {
            await leaveCommunity(activeId, user.uid);
            router.push('/onboarding');
        } catch(e: any) {
            alert(e.message);
        }
    }
  }

  if (loading) {
    return <div className="pt-24 text-center">Loading community...</div>;
  }

  if (!community) {
    return (
      <div className="pt-32 text-center space-y-4">
        <h1 className="text-2xl font-bold">Community Not Found</h1>
        <p className="text-muted-foreground">The community you are looking for does not exist or has been deleted.</p>
        <Link href="/dashboard"><Button variant="outline">Back to Dashboard</Button></Link>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-12 px-6 max-w-7xl mx-auto space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-4xl shadow-xl">
            {community.icon}
          </div>
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-1">
              <Users className="w-4 h-4" /> {community.metadata.memberCount} Members
            </div>
            <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight">{community.name}</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
            {isAdmin && (
                <Link href={`/community/admin?id=${activeId}`}>
                    <Button variant="outline" className="border-white/10 glass rounded-xl gap-2">
                        <Settings className="w-4 h-4" /> Admin Panel
                    </Button>
                </Link>
            )}
            {userCommunityId === activeId && (
                <Button variant="ghost" onClick={handleLeave} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl">
                    <LogOut className="w-4 h-4 mr-2" /> Leave
                </Button>
            )}
        </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
           <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold font-headline">Community Activity</h2>
              <Link href="/report">
                 <Button className="rounded-full px-6 neon-glow">Create Report</Button>
              </Link>
           </div>
           <div className="glass p-8 rounded-3xl border border-white/5 text-center text-muted-foreground">
               View /dashboard to see the reports for this community.
           </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold font-headline pl-2">Members</h2>
          <div className="glass rounded-3xl border border-white/5 overflow-hidden">
             <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
                {members.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors group">
                        <div className="flex items-center gap-4">
                            <Avatar className="border border-white/10">
                                <AvatarFallback className="bg-primary/20 text-primary">{member.displayName[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="text-sm font-bold flex items-center gap-2">
                                    {member.displayName}
                                    {member.role === 'admin' && <ShieldAlert className="w-3 h-3 text-red-400" />}
                                    {member.role === 'moderator' && <Star className="w-3 h-3 text-yellow-400" />}
                                </div>
                                <div className="text-[10px] text-muted-foreground uppercase tracking-widest">{member.role}</div>
                            </div>
                        </div>
                    </div>
                ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
