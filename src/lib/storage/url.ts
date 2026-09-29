// URL pública de un objeto del bucket público. Seguro para cliente y servidor.
// En la BD se guarda solo la `key` (p. ej. "avatars/<userId>/<uuid>.webp"),
// nunca la URL completa: al migrar a DigitalOcean Spaces solo cambia
// NEXT_PUBLIC_STORAGE_PUBLIC_URL y los datos siguen siendo válidos.
//
//   Supabase: https://<ref>.supabase.co/storage/v1/object/public/images
//   DO Spaces: https://<bucket>.<region>.cdn.digitaloceanspaces.com

export function publicImageUrl(key: string | null | undefined): string | null {
  if (!key) return null;
  const base =
    process.env.NEXT_PUBLIC_STORAGE_PUBLIC_URL ??
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images`;
  return `${base.replace(/\/$/, "")}/${key}`;
}
