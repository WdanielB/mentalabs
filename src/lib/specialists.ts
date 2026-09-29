import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Datos públicos: cliente anónimo sin cookies, así las páginas que los usan
// pueden ser estáticas/ISR en vez de renderizarse en cada request.
const createClient = async () =>
  createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

export interface SpecialistCard {
  id: string;
  full_name: string;
  title: string | null;
  specialty: string;
  bio: string | null;
  rating: number;
  review_count: number;
  sessions_count: number;
  hourly_rate: number;
  years_experience: number;
  city: string | null;
  license_number: string | null;
  focus_areas: string[];
  approaches: string[];
  age_groups: string[];
  modalities: string[];
  languages: string[];
}

const PUBLIC_COLUMNS =
  "id, display_name, title, specialty, bio, rating, review_count, sessions_count, hourly_rate, years_experience, city, license_number, focus_areas, approaches, age_groups, modalities, languages";

/**
 * Especialistas activos visibles para cualquiera (anon incluido) vía RLS.
 * No expone email ni datos de contacto.
 */
export async function getPublicSpecialists(opts?: { specialty?: string; limit?: number }): Promise<SpecialistCard[]> {
  const supabase = await createClient();
  let q = supabase
    .from("specialists")
    .select(PUBLIC_COLUMNS)
    .eq("status", "active")
    .order("rating", { ascending: false })
    .order("review_count", { ascending: false });

  if (opts?.specialty) q = q.ilike("specialty", `%${opts.specialty}%`);
  if (opts?.limit) q = q.limit(opts.limit);

  const { data, error } = await q;
  if (error || !data) return [];

  return data.map((s: any) => ({
    id: s.id,
    full_name: s.display_name ?? "Especialista",
    title: s.title,
    specialty: s.specialty ?? "Psicología",
    bio: s.bio,
    rating: Number(s.rating) || 0,
    review_count: s.review_count ?? 0,
    sessions_count: s.sessions_count ?? 0,
    hourly_rate: Number(s.hourly_rate) || 0,
    years_experience: s.years_experience ?? 0,
    city: s.city,
    license_number: s.license_number,
    focus_areas: s.focus_areas ?? [],
    approaches: s.approaches ?? [],
    age_groups: s.age_groups ?? [],
    modalities: s.modalities ?? [],
    languages: s.languages ?? [],
  }));
}
