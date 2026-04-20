"use client";

import React, { useState, useEffect } from 'react';
import { Trophy, Users, Star, Target, ArrowUp, Zap, Calendar, Heart, X, Loader } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { getActivities, joinActivity, leaveActivity, hasJoinedActivity, getLeaderboard, getParticipantCount } from '@/lib/activities';
import type { Activity, Profile } from '@/lib/database.types';

// Fallback demo data when DB is empty
const demoActivities = [
  { id: 'demo-1', title: 'Plant 50 Trees', category: 'Growth', description: 'Help reforest local parks and urban areas by planting native tree species.', status: 'upcoming' as const, start_time: new Date(Date.now() + 5 * 86400000).toISOString(), xp_reward: 100, max_participants: 150, created_by: '', image_url: null, latitude: null, longitude: null, location_text: null, end_time: null, created_at: '', updated_at: '' },
  { id: 'demo-2', title: 'Clean Central River', category: 'Cleanup', description: 'Remove litter and pollutants from the Central River to restore water quality.', status: 'active' as const, start_time: new Date(Date.now() + 12 * 86400000).toISOString(), xp_reward: 150, max_participants: 1000, created_by: '', image_url: null, latitude: null, longitude: null, location_text: null, end_time: null, created_at: '', updated_at: '' },
  { id: 'demo-3', title: 'Zero Waste Week', category: 'Lifestyle', description: 'Commit to producing zero waste for an entire week through mindful consumption.', status: 'active' as const, start_time: new Date(Date.now() + 2 * 86400000).toISOString(), xp_reward: 200, max_participants: 3000, created_by: '', image_url: null, latitude: null, longitude: null, location_text: null, end_time: null, created_at: '', updated_at: '' },
];

const demoLeaderboard = [
  { name: 'Elena Gilbert', xp: 12450, rank: 1, img: 'https://picsum.photos/seed/user1/100/100' },
  { name: 'Damon Salvatore', xp: 10200, rank: 2, img: 'https://picsum.photos/seed/user2/100/100' },
  { name: 'Stefan Salvatore', xp: 9850, rank: 3, img: 'https://picsum.photos/seed/user3/100/100' },
  { name: 'Bonnie Bennett', xp: 8400, rank: 4, img: 'https://picsum.photos/seed/user4/100/100' },
  { name: 'Caroline Forbes', xp: 7100, rank: 5, img: 'https://picsum.photos/seed/user5/100/100' },
];

const iconMap: Record<string, typeof Zap> = {
  Growth: Zap,
  Cleanup: Target,
  Lifestyle: Calendar,
  Transportation: Target,
  Conservation: Zap,
  Energy: Calendar,
};

export default function CommunityPage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [leaderboard, setLeaderboard] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinedMap, setJoinedMap] = useState<Record<string, boolean>>({});
  const [participantCounts, setParticipantCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    loadData();
  }, [user]);

  async function loadData() {
    setLoading(true);
    try {
      const [acts, leaders] = await Promise.all([
        getActivities().catch(() => []),
        getLeaderboard(10).catch(() => []),
      ]);
      setActivities(acts.length > 0 ? acts : demoActivities as any);
      setLeaderboard(leaders);

      // Check join status and participant counts
      const joined: Record<string, boolean> = {};
      const counts: Record<string, number> = {};
      for (const act of (acts.length > 0 ? acts : demoActivities as any)) {
        if (user) {
          try {
            joined[act.id] = await hasJoinedActivity(act.id, user.id);
          } catch { joined[act.id] = false; }
        }
        try {
          counts[act.id] = await getParticipantCount(act.id);
        } catch { counts[act.id] = 0; }
      }
      setJoinedMap(joined);
      setParticipantCounts(counts);
    } catch (err) {
      console.error('Failed to load community data:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleJoin = async (activityId: string) => {
    if (!user) {
      toast({ title: 'Sign in required', description: 'Please sign in to join challenges.', variant: 'destructive' });
      return;
    }
    try {
      if (joinedMap[activityId]) {
        await leaveActivity(activityId, user.id);
        setJoinedMap(prev => ({ ...prev, [activityId]: false }));
        setParticipantCounts(prev => ({ ...prev, [activityId]: Math.max((prev[activityId] || 1) - 1, 0) }));
        toast({ title: 'Left challenge', description: 'You have left this challenge.' });
      } else {
        await joinActivity(activityId, user.id);
        setJoinedMap(prev => ({ ...prev, [activityId]: true }));
        setParticipantCounts(prev => ({ ...prev, [activityId]: (prev[activityId] || 0) + 1 }));
        toast({ title: 'Joined!', description: 'You have joined this challenge. Good luck!' });
      }
    } catch (err: any) {
      toast({ title: 'Action failed', description: err.message, variant: 'destructive' });
    }
  };

  const displayActivities = activities.slice(0, 3);
  const allDisplayActivities = activities;

  // Combine DB leaderboard with demo fallback
  const displayLeaderboard = leaderboard.length > 0 
    ? leaderboard.map((u, i) => ({ name: u.username, xp: u.xp, rank: i + 1, img: u.avatar_url }))
    : demoLeaderboard;

  const getDeadline = (startTime: string) => {
    const diff = new Date(startTime).getTime() - Date.now();
    const days = Math.ceil(diff / 86400000);
    if (days <= 0) return 'Active now';
    return `${days} days left`;
  };

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
            <div className="text-2xl font-bold font-headline">{profile ? `#${displayLeaderboard.findIndex(u => u.name === profile.username) + 1 || '--'}` : '--'}</div>
          </div>
          <div className="h-10 w-[1px] bg-white/10" />
          <div className="text-right">
            <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Total Points</div>
            <div className="text-2xl font-bold font-headline text-primary">{profile ? profile.xp.toLocaleString() : '--'}</div>
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
            {loading ? (
              <div className="glass w-full rounded-3xl border border-white/5 animate-pulse h-24 flex items-center px-8">
                <div className="w-12 h-12 rounded-xl bg-white/5 mr-6" />
                <div className="space-y-3 flex-1">
                  <div className="h-4 bg-white/5 rounded w-1/4" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                </div>
              </div>
            ) : (
              displayActivities.map((challenge) => {
                const IconComponent = iconMap[challenge.category] || Zap;
                return (
                  <div key={challenge.id} className="glass p-6 rounded-3xl border border-white/5 hover:border-primary/20 transition-all group overflow-hidden relative">
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
                    <div className="flex flex-col md:flex-row gap-6 items-start relative z-10">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
                        <IconComponent className="w-8 h-8 text-primary" />
                      </div>
                      <div className="flex-1 space-y-4 w-full">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                          <div>
                            <div className="text-xs text-primary font-bold uppercase tracking-wider">{challenge.category}</div>
                            <h3 className="text-xl font-bold mt-1">{challenge.title}</h3>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {participantCounts[challenge.id] || 0}</span>
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {getDeadline(challenge.start_time)}</span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{challenge.description}</p>
                        {challenge.xp_reward > 0 && (
                          <div className="text-xs text-primary font-bold">🏆 {challenge.xp_reward} XP reward</div>
                        )}
                        <div className="flex justify-end">
                          <Button 
                            variant={joinedMap[challenge.id] ? "default" : "outline"} 
                            className={cn(
                              "rounded-xl px-6 h-9 glass border-white/10",
                              joinedMap[challenge.id] 
                                ? "bg-primary/20 text-primary hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30" 
                                : "hover:bg-white/5"
                            )}
                            onClick={() => handleJoin(challenge.id)}
                          >
                            {joinedMap[challenge.id] ? 'Leave Challenge' : 'Join Challenge'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
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
              {displayLeaderboard.map((u) => (
                <div key={u.rank} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-6 h-6 flex items-center justify-center rounded-lg text-xs font-bold font-headline",
                      u.rank === 1 ? "bg-yellow-500/20 text-yellow-500" :
                      u.rank === 2 ? "bg-slate-300/20 text-slate-300" :
                      u.rank === 3 ? "bg-orange-500/20 text-orange-500" : "text-muted-foreground"
                    )}>
                      {u.rank}
                    </div>
                    <Avatar className="w-10 h-10 border border-white/10 group-hover:scale-105 transition-transform">
                      <AvatarImage src={u.img || undefined} />
                      <AvatarFallback>{u.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-bold">{u.name}</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-widest">{u.xp.toLocaleString()} XP</div>
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

      {/* All Challenges Modal */}
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
                {allDisplayActivities.map((challenge) => {
                  const IconComponent = iconMap[challenge.category] || Zap;
                  return (
                    <div key={challenge.id} className="glass p-6 rounded-3xl border border-white/5 hover:border-primary/20 transition-all group overflow-hidden relative">
                      <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
                      <div className="flex gap-4 items-start relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
                          <IconComponent className="w-7 h-7 text-primary" />
                        </div>
                        <div className="flex-1 space-y-3">
                          <div>
                            <div className="text-xs text-primary font-bold uppercase tracking-wider">{challenge.category}</div>
                            <h3 className="text-lg font-bold mt-1">{challenge.title}</h3>
                            <p className="text-sm text-muted-foreground mt-2">{challenge.description}</p>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {participantCounts[challenge.id] || 0} participants</span>
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {getDeadline(challenge.start_time)}</span>
                          </div>
                          <div className="flex justify-end pt-2">
                            <Button 
                              variant={joinedMap[challenge.id] ? "default" : "outline"}
                              className={cn(
                                "rounded-xl px-6 h-9 glass border-white/10",
                                joinedMap[challenge.id] ? "bg-primary/20 text-primary" : "hover:bg-white/5"
                              )}
                              onClick={() => handleJoin(challenge.id)}
                            >
                              {joinedMap[challenge.id] ? 'Joined ✓' : 'Join Challenge'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
