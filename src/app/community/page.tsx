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
import { supabase } from '@/lib/supabase';
import { demoCommunity, demoCommunityMembers } from '@/lib/demo-data';

export default function CommunityPageWrapper() {
  const { user, loading, communityId, isOnboarded } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const demoMode = searchParams.get('demo') === 'true';
  const authBlocked = !user || !isOnboarded || !communityId;

  if (loading) {
    return <div className="pt-24 text-center">Loading community...</div>;
  }

  if (authBlocked && demoMode) {
    return <CommunityHub demoMode />;
  }

  if (authBlocked) {
    return (
      <div className="pt-24 pb-12 px-6 max-w-2xl mx-auto space-y-6 text-center pt-32">
        <h1 className="text-3xl font-headline font-bold">Community Hub</h1>
        <p className="text-muted-foreground">This area is currently a work in progress and will be released shortly. Until then, please wait patiently. Thank you.</p>
        <div className="text-6xl">🙏</div>
        <div className="fixed bottom-6 right-6 z-50">
          <Button className="rounded-full neon-glow" onClick={() => router.push('/community?demo=true')}>
            Try Demo
          </Button>
        </div>
      </div>
    );
  }

  return (
    <CommunityHub />
  );
}

function CommunityHub({ demoMode }: { demoMode?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queriedId = searchParams.get('id');
  const { user, profile, communityId: userCommunityId } = useAuth();
  
  const activeId = queriedId || userCommunityId || (demoMode ? demoCommunity.id : null);

  const [community, setCommunity] = useState<any | null>(null);
  const [members, setMembers] = useState<Array<{ id?: string; user_id?: string; role?: string; display_name?: string }>>([]);
  const [loading, setLoading] = useState(true);

  const currentUserMember = members.find((m) => (m as any).id === user?.id || (m as any).user_id === user?.id);
  const isAdmin = currentUserMember?.role === 'admin';

  useEffect(() => {
    if (demoMode) {
      setCommunity(demoCommunity);
      setMembers(demoCommunityMembers);
      setLoading(false);
      return;
    }

    if (!activeId) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      // Fetch community info
      const { data: commData, error: commError } = await supabase
        .from('communities')
        .select('*')
        .eq('id', activeId)
        .maybeSingle();

      if (!commError && commData) {
        setCommunity(commData);
        
        // Fetch members (Note: assuming a 'members' table or RPC helper)
        const { data: memsData, error: memsError } = await supabase
          .from('community_members') // Assuming this table name in Supabase
          .select('*')
          .eq('community_id', activeId);
          
        if (!memsError && memsData) {
          setMembers(memsData);
        }
      }
      setLoading(false);
    };

    loadData();
  }, [activeId, demoMode]);

  const handleLeave = async () => {
    if (!activeId || !user) return;
    if (confirm("Are you sure you want to leave this community?")) {
        try {
            const { error } = await supabase.rpc('leave_community', {
                p_community_id: activeId
            });
            if (error) throw error;
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
              <Users className="w-4 h-4" /> {community.member_count || 0} Members
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
                                <AvatarFallback className="bg-primary/20 text-primary">{member.display_name?.[0] || '?'}</AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="text-sm font-bold flex items-center gap-2">
                                    {member.display_name}
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
