"use client";

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { supabase } from '@/lib/supabase';

import { Button } from '@/components/ui/button';
import { Users, Link as LinkIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function AdminPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queriedId = searchParams.get('id');
  const { user, profile, communityId: userCommunityId, loading: authLoading } = useAuth();
  
  const activeId = queriedId || userCommunityId;

  const [community, setCommunity] = useState<any | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!activeId || !user) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      // Fetch community info
      const { data: commData } = await supabase
        .from('communities')
        .select('*')
        .eq('id', activeId)
        .maybeSingle();
      
      if (commData) {
        setCommunity(commData);
        
        // Fetch members
        const { data: memsData } = await supabase
          .from('community_members')
          .select('*')
          .eq('community_id', activeId);
          
        if (memsData) {
          setMembers(memsData);
          
          // Security check: must be admin to view
          const currentMember = memsData.find(m => m.user_id === user.id);
          if (currentMember?.role !== 'admin') {
              router.push(`/community?id=${activeId}`);
              return;
          }
        }

        // Fetch invites
        const { data: invsData } = await supabase
          .from('invites')
          .select('*')
          .eq('community_id', activeId);
          
        if (invsData) setInvites(invsData);
      }
      setLoading(false);
    };

    loadData();
  }, [activeId, user, authLoading, router]);

  const handleRoleChange = async (targetId: string, newRole: 'admin' | 'moderator' | 'member') => {
      if(!activeId || !user) return;
      try {
          const { error } = await supabase
            .from('community_members')
            .update({ role: newRole })
            .eq('id', targetId);
          if (error) throw error;
          
          setMembers(members.map(m => m.id === targetId ? { ...m, role: newRole } : m));
      } catch (e: any) {
          alert(e.message);
      }
  }

  const handleCreateInvite = async () => {
      if (!activeId || !user || !community) return;
      setIsCreatingInvite(true);
      try {
          const { error } = await supabase.rpc('create_invite', {
              p_community_id: activeId,
              p_expiry_days: 7
          });
          if (error) throw error;
          
          // Refresh invites
          const { data: invsData } = await supabase
            .from('invites')
            .select('*')
            .eq('community_id', activeId);
          if (invsData) setInvites(invsData);
      } catch(e: any) {
          alert(e.message);
      } finally {
          setIsCreatingInvite(false);
      }
  }


  const copyToClipboard = (code: string) => {
      const url = `${window.location.origin}/join?code=${code}`;
      navigator.clipboard.writeText(url);
      alert('Invite link copied to clipboard!');
  }

  if (authLoading || loading) {
      return <div className="pt-24 text-center">Loading...</div>;
  }

  if (!community) {
      return <div className="pt-24 text-center">Community not found.</div>;
  }

  return (
    <div className="pt-24 pb-12 px-6 max-w-7xl mx-auto space-y-12">
        <header>
            <h1 className="text-3xl font-headline font-bold">Admin Panel: {community.name}</h1>
        </header>

        <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
                <h2 className="text-xl font-bold flex items-center gap-2"><Users className="w-5 h-5" /> Members</h2>
                <div className="glass p-6 rounded-3xl border border-white/5 space-y-4">
                    {members.map(member => (
                        <div key={member.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-2 border-b border-white/5 last:border-0">
                            <div>
                                <div className="font-bold">{member.display_name}</div>
                                <div className="text-xs text-muted-foreground">{member.role}</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <select 
                                    className="bg-white/5 border border-white/10 rounded-lg text-sm p-1"
                                    value={member.role}
                                    onChange={(e) => handleRoleChange(member.id!, e.target.value as any)}
                                    disabled={member.user_id === user?.id}
                                >
                                    <option value="member">Member</option>
                                    <option value="moderator">Moderator</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-6">
                 <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold flex items-center gap-2"><LinkIcon className="w-5 h-5" /> Invites</h2>
                    <Button onClick={handleCreateInvite} disabled={isCreatingInvite} size="sm" className="neon-glow rounded-xl">
                        {isCreatingInvite ? 'Creating...' : '+ New Invite'}
                    </Button>
                 </div>
                 <div className="glass p-6 rounded-3xl border border-white/5 space-y-4">
                    {invites.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No active invites. Create one to invite members.</p>
                    ) : (
                        invites.map(invite => (
                            <div key={invite.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                                <div>
                                    <div className="font-bold font-mono tracking-widest text-primary">{invite.id}</div>
                                    <div className="text-xs text-muted-foreground">
                                        Uses: {invite.used_count || 0} / {invite.max_uses === null ? '∞' : invite.max_uses}
                                    </div>
                                </div>
                                <Button size="sm" variant="outline" onClick={() => copyToClipboard(invite.id!)} className="rounded-xl">
                                    Copy Link
                                </Button>
                            </div>
                        ))
                    )}
                 </div>

            </div>
        </div>
    </div>
  )
}
