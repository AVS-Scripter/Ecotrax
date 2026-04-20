// ─── Enum-like union types ───────────────────────────────────────────
export type ReportCategory = 'air' | 'water' | 'garbage' | 'noise';
export type ReportStatus = 'open' | 'in_progress' | 'needs_verification' | 'resolved' | 'rejected' | 'archived' | 'Reported' | 'Resolved';
export type UpdateType = 'verified' | 'edited' | 'resolved' | 'reopened';
export type VerificationStatus = 'pending' | 'accepted' | 'ignored' | 'completed' | 'expired';
export type ActivityStatus = 'upcoming' | 'active' | 'completed' | 'cancelled';

// ─── Embedded image metadata (stored as JSONB array in reports.images) ─
export interface ReportImage {
  storage_path: string;
  image_url: string;
  caption?: string;
  is_primary: boolean;
}

// ─── Core table types ────────────────────────────────────────────────
export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  xp: number;
  home_latitude: number | null;
  home_longitude: number | null;
  created_at: string;
}

export interface Report {
  id: string;
  reference_code: string;
  user_id: string;
  title: string;
  summary: string | null;
  description: string;
  category: ReportCategory;
  status: ReportStatus;
  location_text: string;
  latitude: number;
  longitude: number;
  address_text: string | null;
  geolocation_source: string | null;
  images: ReportImage[];
  verification_count: number;
  duplicate_count: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface ReportDuplicate {
  id: string;
  report_id: string;
  user_id: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  match_confidence: number | null;
  created_at: string;
}

export interface ReportUpdate {
  id: string;
  report_id: string;
  user_id: string;
  update_type: UpdateType;
  note: string | null;
  image_url: string | null;
  created_at: string;
}

export interface VerificationPrompt {
  id: string;
  report_id: string;
  user_id: string;
  status: VerificationStatus;
  sent_at: string | null;
  responded_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  category: string;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  location_text: string | null;
  start_time: string;
  end_time: string | null;
  xp_reward: number;
  max_participants: number | null;
  created_by: string;
  status: ActivityStatus;
  created_at: string;
  updated_at: string;
}

export interface ActivityParticipant {
  id: string;
  activity_id: string;
  user_id: string;
  joined_at: string;
  attendance_status: string;
  xp_awarded: boolean;
}

// ─── Joined / enriched types ─────────────────────────────────────────
export interface ReportWithProfile extends Report {
  profiles: Pick<Profile, 'username' | 'avatar_url'>;
}
