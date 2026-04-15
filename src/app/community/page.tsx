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
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';
import { demoCommunity, demoCommunityMembers } from '@/lib/demo-data';

const challenges = [
  { id: 1, title: 'Plant 50 Trees', category: 'Growth', progress: 75, participants: 124, deadline: '5 days left', icon: Zap, description: 'Help reforest local parks and urban areas by planting native tree species.' },
  { id: 2, title: 'Clean Central River', category: 'Cleanup', progress: 32, participants: 840, deadline: '12 days left', icon: Target, description: 'Remove litter and pollutants from the Central River to restore water quality.' },
  { id: 3, title: 'Zero Waste Week', category: 'Lifestyle', progress: 90, participants: 2500, deadline: '2 days left', icon: Calendar, description: 'Commit to producing zero waste for an entire week through mindful consumption.' },
];

const allChallenges = [
  ...challenges,
  { id: 4, title: 'Bike to Work Month', category: 'Transportation', progress: 45, participants: 567, deadline: '18 days left', icon: Target, description: 'Replace car commutes with cycling to reduce carbon emissions.' },
  { id: 5, title: 'Community Garden', category: 'Growth', progress: 20, participants: 89, deadline: '30 days left', icon: Zap, description: 'Create and maintain a community vegetable garden for local food production.' },
  { id: 6, title: 'Energy Conservation', category: 'Lifestyle', progress: 68, participants: 1200, deadline: '8 days left', icon: Calendar, description: 'Reduce household energy consumption by 20% through efficient practices.' },
  { id: 7, title: 'Plastic-Free Store', category: 'Cleanup', progress: 15, participants: 234, deadline: '25 days left', icon: Target, description: 'Shop exclusively at stores that eliminate single-use plastics.' },
  { id: 8, title: 'Wildlife Protection', category: 'Conservation', progress: 55, participants: 678, deadline: '14 days left', icon: Zap, description: 'Protect local wildlife habitats and report illegal activities.' },
  { id: 9, title: 'Solar Panel Initiative', category: 'Energy', progress: 10, participants: 45, deadline: '45 days left', icon: Calendar, description: 'Install solar panels on community buildings to generate clean energy.' },
];

const leaderboard = [
  { name: 'Elena Gilbert', points: '12,450', rank: 1, img: 'https://picsum.photos/seed/user1/100/100' },
  { name: 'Damon Salvatore', points: '10,200', rank: 2, img: 'https://picsum.photos/seed/user2/100/100' },
  { name: 'Stefan Salvatore', points: '9,850', rank: 3, img: 'https://picsum.photos/seed/user3/100/100' },
  { name: 'Bonnie Bennett', points: '8,400', rank: 4, img: 'https://picsum.photos/seed/user4/100/100' },
  { name: 'Caroline Forbes', points: '7,100', rank: 5, img: 'https://picsum.photos/seed/user5/100/100' },
];

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
    return <CommunityPage />;
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

function CommunityPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <div className="pt-24 pb-12 px-6 max-w-7xl mx-auto space-y-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest mb-2">
            <Users className="w-4 h-4" /> Global Community
          </div>
          <h1 className="text-4xl md:text-5xl font-headline font-bold tracking-tight">Together for the Planet</h1>
          <p className="text-muted-foreground max-w-xl">Join active challenges, earn points, and climb the global leaderboard by taking environmental action.</p>
        </div>
        <div className="glass p-6 rounded-2xl border border-white/5 min-w-[240px] flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Your Rank</div>
            <div className="text-2xl font-bold font-headline">--</div> {/*place holder for user rank, show this when logged out */}
          </div>
          <div className="h-10 w-[1px] bg-white/10" />
          <div className="text-right">
            <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Total Points</div>
            <div className="text-2xl font-bold font-headline text-primary">--</div> {/*place holder for user exp, show this when logged out */}
          </div>
        </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-12">
        {/* Active Challenges */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold font-headline">Active Challenges</h2>
            <Button onClick={() => setIsModalOpen(true)} variant="link" className="text-primary p-0">Browse All</Button>
          </div>
          
          <div className="space-y-4">
            {challenges.map((challenge) => (
              <div key={challenge.id} className="glass p-6 rounded-3xl border border-white/5 hover:border-primary/20 transition-all group overflow-hidden relative">
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
                <div className="flex flex-col md:flex-row gap-6 items-start relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
                    <challenge.icon className="w-8 h-8 text-primary" />
                  </div>
                  <div className="flex-1 space-y-4 w-full">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <div>
                        <div className="text-xs text-primary font-bold uppercase tracking-wider">{challenge.category}</div>
                        <h3 className="text-xl font-bold mt-1">{challenge.title}</h3>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {challenge.participants}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {challenge.deadline}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-medium">
                        <span>Progress</span>
                        <span className="text-primary">{challenge.progress}%</span>
                      </div>
                      <Progress value={challenge.progress} className="h-2 bg-white/5" />
                    </div>
                    <div className="flex justify-end">
                      <Button variant="outline" className="rounded-xl px-6 h-9 glass hover:bg-white/5 border-white/10">Join Challenge</Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold font-headline">Global Leaderboard</h2>
          <div className="glass rounded-3xl border border-white/5 overflow-hidden">
            <div className="bg-primary/10 p-4 border-b border-white/5 flex items-center justify-between">
              <span className="text-xs font-bold text-primary uppercase tracking-widest">Rankings</span>
              <Trophy className="w-4 h-4 text-primary" />
            </div>
            <div className="divide-y divide-white/5">
              {leaderboard.map((user) => (
                <div key={user.rank} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-6 h-6 flex items-center justify-center rounded-lg text-xs font-bold font-headline",
                      user.rank === 1 ? "bg-yellow-500/20 text-yellow-500" :
                      user.rank === 2 ? "bg-slate-300/20 text-slate-300" :
                      user.rank === 3 ? "bg-orange-500/20 text-orange-500" : "text-muted-foreground"
                    )}>
                      {user.rank}
                    </div>
                    <Avatar className="w-10 h-10 border border-white/10 group-hover:scale-105 transition-transform">
                      <AvatarImage src={user.img} />
                      <AvatarFallback>{user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-bold">{user.name}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-widest">{user.points} XP</div>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowUp className="w-4 h-4 text-primary" />
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-white/5 text-center">
              <Button variant="ghost" className="text-xs text-muted-foreground hover:text-primary">View Global Top 100</Button>
            </div>
          </div>

          <div className="glass p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
            <div className="relative z-10 space-y-4">
              <h3 className="font-bold flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" /> Support the mission
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ecotrax is a non-profit open data platform. Help us keep the servers running and sensors deployed.
              </p>
              <Button size="sm" className="w-full rounded-xl bg-white dark:bg-white text-background hover:bg-white/90">Donate Now</Button>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setIsModalOpen(false)}>
          <div className="bg-card w-full max-w-5xl max-h-[90vh] rounded-3xl p-6 md:p-8 shadow-2xl border border-white/10 animate-in zoom-in-90 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold font-headline">All Challenges</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)}>
                <X className="w-6 h-6" />
              </Button>
            </div>

            <div className="overflow-y-auto max-h-[calc(90vh-120px)] space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {allChallenges.map((challenge) => (
                  <div key={challenge.id} className="glass p-6 rounded-3xl border border-white/5 hover:border-primary/20 transition-all group overflow-hidden relative">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
                    <div className="flex gap-4 items-start relative z-10">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
                        <challenge.icon className="w-7 h-7 text-primary" />
                      </div>
                      <div className="flex-1 space-y-3">
                        <div>
                          <div className="text-xs text-primary font-bold uppercase tracking-wider">{challenge.category}</div>
                          <h3 className="text-lg font-bold mt-1">{challenge.title}</h3>
                          <p className="text-sm text-muted-foreground mt-2">{challenge.description}</p>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {challenge.participants} participants</span>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {challenge.deadline}</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-medium">
                            <span>Progress</span>
                            <span className="text-primary">{challenge.progress}%</span>
                          </div>
                          <Progress value={challenge.progress} className="h-2 bg-white/5" />
                        </div>
                        <div className="flex justify-end pt-2">
                          <Button variant="outline" className="rounded-xl px-6 h-9 glass hover:bg-white/5 border-white/10">
                            Join Challenge
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
