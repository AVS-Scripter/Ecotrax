import { supabase } from './supabase';
import type { Report, ReportCategory, ReportStatus, ReportImage, ReportWithProfile } from './database.types';

// ─── Create Report ───────────────────────────────────────────────────

interface CreateReportInput {
  title: string;
  description: string;
  summary?: string;
  category: ReportCategory;
  location_text: string;
  latitude: number;
  longitude: number;
  address_text?: string;
  geolocation_source?: string;
  images?: ReportImage[];
}

export async function createReport(userId: string, input: CreateReportInput): Promise<Report> {
  const { data, error } = await supabase
    .from('reports')
    .insert({
      user_id: userId,
      title: input.title,
      description: input.description,
      summary: input.summary || input.description.slice(0, 120),
      category: input.category,
      location_text: input.location_text,
      latitude: input.latitude,
      longitude: input.longitude,
      address_text: input.address_text,
      geolocation_source: input.geolocation_source || 'browser',
      images: input.images || [],
    })
    .select()
    .single();

  if (error) throw error;
  return data as Report;
}

// ─── Fetch Reports (list page) ───────────────────────────────────────

interface ReportFilters {
  category?: ReportCategory | 'all';
  status?: ReportStatus | 'all';
  limit?: number;
  offset?: number;
}

export async function getReports(filters?: ReportFilters): Promise<ReportWithProfile[]> {
  let query = supabase
    .from('reports')
    .select('*, profiles(username, avatar_url)')
    .order('created_at', { ascending: false });

  if (filters?.category && filters.category !== 'all') {
    query = query.eq('category', filters.category);
  }
  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as unknown as ReportWithProfile[];
}

// ─── Single Report by Reference Code ────────────────────────────────

export async function getReportByRef(referenceCode: string): Promise<ReportWithProfile | null> {
  const { data, error } = await supabase
    .from('reports')
    .select('*, profiles(username, avatar_url)')
    .eq('reference_code', referenceCode)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as unknown as ReportWithProfile;
}

// ─── Map Reports ────────────────────────────────────────────────────

export async function getReportsForMap(
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number },
  category?: ReportCategory
): Promise<Report[]> {
  const { data, error } = await supabase.rpc('get_reports_for_map', {
    p_min_lat: bounds.minLat,
    p_max_lat: bounds.maxLat,
    p_min_lng: bounds.minLng,
    p_max_lng: bounds.maxLng,
    p_category: category || null,
  });

  if (error) throw error;
  return (data || []) as Report[];
}

// ─── All reports for map (no bounds constraint) ─────────────────────

export async function getAllReportsForMap(category?: ReportCategory): Promise<Report[]> {
  let query = supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as Report[];
}

// ─── Duplicate Detection ────────────────────────────────────────────

export async function checkDuplicates(
  lat: number,
  lng: number,
  category: ReportCategory,
  radiusKm: number = 0.5
): Promise<Report[]> {
  const { data, error } = await supabase.rpc('find_nearby_duplicates', {
    p_lat: lat,
    p_lng: lng,
    p_category: category,
    p_radius_km: radiusKm,
  });

  if (error) throw error;
  return (data || []) as Report[];
}

// ─── Duplicate Confirmation ─────────────────────────────────────────

export async function createDuplicateConfirmation(
  userId: string,
  reportId: string,
  description?: string,
  lat?: number,
  lng?: number,
  confidence?: number
) {
  const { data, error } = await supabase
    .from('report_duplicates')
    .insert({
      report_id: reportId,
      user_id: userId,
      description,
      latitude: lat,
      longitude: lng,
      match_confidence: confidence,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── Report Updates (verification, edits, etc.) ─────────────────────

export async function createReportUpdate(
  userId: string,
  reportId: string,
  updateType: 'verified' | 'edited' | 'resolved' | 'reopened',
  note?: string,
  imageUrl?: string
) {
  const { data, error } = await supabase
    .from('report_updates')
    .insert({
      report_id: reportId,
      user_id: userId,
      update_type: updateType,
      note,
      image_url: imageUrl,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ─── Update Report Status ───────────────────────────────────────────

export async function updateReport(reportId: string, updates: Partial<CreateReportInput & { status: ReportStatus }>) {
  const { data, error } = await supabase
    .from('reports')
    .update(updates)
    .eq('id', reportId)
    .select()
    .single();

  if (error) throw error;
  return data as Report;
}

export async function updateReportStatus(reportId: string, status: ReportStatus) {
  const updates: Record<string, unknown> = { status };
  if (status === 'Resolved' || status === 'resolved') {
    updates.resolved_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('reports')
    .update(updates)
    .eq('id', reportId)
    .select()
    .single();

  if (error) throw error;
  return data as Report;
}

// ─── Upload Report Image to Storage ─────────────────────────────────

export async function uploadReportImage(
  userId: string,
  file: File
): Promise<ReportImage> {
  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('report-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage
    .from('report-images')
    .getPublicUrl(fileName);

  return {
    storage_path: fileName,
    image_url: urlData.publicUrl,
    caption: '',
    is_primary: true,
  };
}

// ─── Report Count Stats ─────────────────────────────────────────────

export async function getReportStats() {
  const [totalRes, reportedRes, resolvedRes] = await Promise.all([
    supabase.from('reports').select('id', { count: 'exact', head: true }),
    supabase.from('reports').select('id', { count: 'exact', head: true }).or('status.eq.Reported,status.eq.open,status.eq.in_progress'),
    supabase.from('reports').select('id', { count: 'exact', head: true }).or('status.eq.Resolved,status.eq.resolved'),
  ]);

  return {
    total: totalRes.count || 0,
    reported: reportedRes.count || 0,
    resolved: resolvedRes.count || 0,
  };
}
