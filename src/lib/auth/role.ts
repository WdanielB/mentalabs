export type AppRole = "paciente" | "especialista" | "tutor" | "admin";

const KNOWN_ROLES: AppRole[] = ["paciente", "especialista", "tutor", "admin"];

export const ROLE_ROUTES: Record<AppRole, string> = {
  paciente: "/paciente",
  especialista: "/especialista",
  tutor: "/tutor",
  admin: "/admin",
};

export function normalizeRole(value: unknown): AppRole | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.toLowerCase().trim();
  if (KNOWN_ROLES.includes(normalized as AppRole)) {
    return normalized as AppRole;
  }
  return undefined;
}

export function roleFromUserMetadata(user: any): AppRole | undefined {
  return (
    normalizeRole(user?.app_metadata?.role) ??
    normalizeRole(user?.user_metadata?.role)
  );
}

export async function resolveUserRole(
  supabase: any,
  user: any
): Promise<AppRole | undefined> {
  const metadataRole = roleFromUserMetadata(user);
  if (metadataRole) return metadataRole;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profileError) {
    const profileRole = normalizeRole(profile?.role);
    if (profileRole) return profileRole;
  }

  const [{ data: specialist }, { data: patient }] = await Promise.all([
    supabase.from("specialists").select("id").eq("id", user.id).maybeSingle(),
    supabase.from("patients").select("id").eq("id", user.id).maybeSingle(),
  ]);

  if (specialist?.id) return "especialista";
  if (patient?.id) return "paciente";

  return undefined;
}