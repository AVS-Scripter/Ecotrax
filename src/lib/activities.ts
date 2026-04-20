import { supabase } from './supabase';
import type { Activity, ActivityParticipant, Profile } from './database.types';

// ─── Fetch Activities ────────────────────────────────────────────────

export async function getActivities(status?: string): Promise<Activity[]> {
  let query = supabase
    .from('activities')
    .select('*')
    .order('start_time', { ascending: true });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as Activity[];
}

// ─── Join Activity ──────────────────────────────────────────────────

export async function joinActivity(activityId: string, userId: string) {
  const { data, error } = await supabase
    .from('activity_participants')
    .insert({
      activity_id: activityId,
      user_id: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return data as ActivityParticipant;
}

// ─── Leave Activity ─────────────────────────────────────────────────

export async function leaveActivity(activityId: string, userId: string) {
  const { error } = await supabase
    .from('activity_participants')
    .delete()
    .eq('activity_id', activityId)
    .eq('user_id', userId);

  if (error) throw error;
}

// ─── Check if user joined ───────────────────────────────────────────

export async function hasJoinedActivity(activityId: string, userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('activity_participants')
    .select('id')
    .eq('activity_id', activityId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

// ─── Participant Count ──────────────────────────────────────────────

export async function getParticipantCount(activityId: string): Promise<number> {
  const { count, error } = await supabase
    .from('activity_participants')
    .select('id', { count: 'exact', head: true })
    .eq('activity_id', activityId);

  if (error) throw error;
  return count || 0;
}

// ─── Leaderboard (top users by XP) ──────────────────────────────────

export async function getLeaderboard(limit: number = 10): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('xp', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []) as Profile[];
}
