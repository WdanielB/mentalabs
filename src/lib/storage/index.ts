// Solo servidor: usa la service role a través de utils/supabase/admin.
import { supabaseStorage } from "./supabase";
import type { StorageProvider, Visibility } from "./types";

export type { Visibility } from "./types";
export { publicImageUrl } from "./url";

// Para migrar a DigitalOcean Spaces: crear ./spaces.ts implementando
// StorageProvider con @aws-sdk/client-s3 (Spaces es compatible con S3),
// añadirlo aquí y poner STORAGE_PROVIDER=spaces.
function provider(): StorageProvider {
  switch (process.env.STORAGE_PROVIDER ?? "supabase") {
    case "supabase":
      return supabaseStorage;
    default:
      throw new Error(`STORAGE_PROVIDER desconocido: ${process.env.STORAGE_PROVIDER}`);
  }
}

export const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "application/pdf": "pdf",
};
const MAX_BYTES: Record<Visibility, number> = { public: 5 * 1024 * 1024, private: 10 * 1024 * 1024 };

/**
 * Sube un archivo y devuelve su `key`. Guarda esa key en la BD.
 * `folder` agrupa por uso, p. ej. "avatars", "exams", "clinical/<patientId>".
 */
export async function uploadFile(
  file: File,
  opts: { folder: string; visibility: Visibility; ownerId: string }
): Promise<string> {
  const ext = EXTENSIONS[file.type];
  const allowed = opts.visibility === "public" ? IMAGE_MIME_TYPES.includes(file.type) : !!ext;
  if (!allowed) throw new Error(`Tipo de archivo no permitido: ${file.type || "desconocido"}`);
  if (file.size > MAX_BYTES[opts.visibility]) {
    throw new Error(`El archivo supera ${MAX_BYTES[opts.visibility] / 1024 / 1024} MB`);
  }

  const folder = opts.folder.replace(/^\/+|\/+$/g, "");
  const key = `${folder}/${opts.ownerId}/${crypto.randomUUID()}.${ext}`;
  await provider().upload(opts.visibility, key, await file.arrayBuffer(), file.type);
  return key;
}

export async function deleteFiles(visibility: Visibility, keys: string[]) {
  await provider().remove(visibility, keys);
}

/** URL temporal para archivos privados. */
export async function getSignedUrl(key: string, expiresInSeconds = 60 * 10) {
  return provider().signedUrl("private", key, expiresInSeconds);
}
