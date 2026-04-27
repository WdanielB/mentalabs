import { unstable_cache } from 'next/cache';
import { createClient } from '../../../utils/supabase/server';
import { createAdminClient } from '../../../utils/supabase/admin';
import { CACHE_TAGS } from '../cache/tags';

export class AuthError extends Error { readonly type = 'auth' as const }
export class NetworkError extends Error { readonly type = 'network' as const }

export type SafePatient = {
  id: string
  full_name: string
  email: string
  birth_date: string | null
  status: 'active' | 'inactive' | 'in_treatment'
  pendingExams: number
  lastExamTitle: string | null
  lastScore: number | null
}

const _cachedSpecialistPatients = unstable_cache(
  async (specialistId: string): Promise<{ patients: SafePatient[]; specialistId: string }> => {
    const supabase = createAdminClient();

    const [assignRes, apptRes, examRes] = await Promise.all([
      supabase.from('specialist_patient_assignments').select('patient_id').eq('specialist_id', specialistId),
      supabase.from('appointments').select('patient_id').eq('specialist_id', specialistId),
      supabase.from('exam_attempts').select('patient_id').eq('assigned_by', specialistId),
    ]);

    const ids = [
      ...new Set([
        ...(assignRes.data?.map((a) => a.patient_id) ?? []),
        ...(apptRes.data?.map((a) => a.patient_id) ?? []),
        ...(examRes.data?.map((e) => e.patient_id) ?? []),
      ]),
    ];

    if (ids.length === 0) return { patients: [], specialistId };

    const [ptsRes, pendingRes, completedRes] = await Promise.all([
      supabase
        .from('patients')
        .select('id, status, profiles!inner(full_name, email, birth_date)')
        .in('id', ids),
      supabase
        .from('exam_attempts')
        .select('patient_id')
        .in('patient_id', ids)
        .eq('assigned_by', specialistId)
        .eq('status', 'pending'),
      supabase
        .from('exam_attempts')
        .select('patient_id, total_score, exams!inner(title)')
        .in('patient_id', ids)
        .eq('assigned_by', specialistId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false }),
    ]);

    const pendingMap: Record<string, number> = {};
    pendingRes.data?.forEach((p) => {
      pendingMap[p.patient_id] = (pendingMap[p.patient_id] ?? 0) + 1;
    });

    const latestMap: Record<string, { score: number; title: string }> = {};
    completedRes.data?.forEach((c: any) => {
      if (!latestMap[c.patient_id]) {
        latestMap[c.patient_id] = { score: c.total_score, title: c.exams?.title };
      }
    });

    const patients: SafePatient[] = (ptsRes.data ?? []).map((p: any) => ({
      id:           p.id,
      full_name:    p.profiles?.full_name ?? 'Paciente',
      email:        p.profiles?.email ?? '',
      birth_date:   p.profiles?.birth_date ?? null,
      status:       (p.status ?? 'active') as SafePatient['status'],
      pendingExams: pendingMap[p.id] ?? 0,
      lastExamTitle:latestMap[p.id]?.title ?? null,
      lastScore:    latestMap[p.id]?.score ?? null,
    }));

    return { patients, specialistId };
  },
  [CACHE_TAGS.SPECIALIST_PATIENTS],
  { tags: [CACHE_TAGS.SPECIALIST_PATIENTS], revalidate: 120 }
);

export async function getSpecialistPatients(): Promise<{ patients: SafePatient[]; specialistId: string }> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new AuthError('No active session');
  return _cachedSpecialistPatients(user.id);
}
