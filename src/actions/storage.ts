"use server";

import { createClient } from "../../utils/supabase/server";
import { deleteFiles, publicImageUrl, uploadFile } from "../lib/storage";

const PUBLIC_FOLDERS = ["avatars", "exams", "games"] as const;
type PublicFolder = (typeof PUBLIC_FOLDERS)[number];

/**
 * Sube una imagen pública del usuario actual.
 * Uso: <form action={uploadImage}> con campos `file` y `folder`.
 * Devuelve la `key` (guárdala en la BD) y la URL para mostrarla.
 */
export async function uploadImage(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };

  const file = formData.get("file");
  const folder = formData.get("folder") as PublicFolder;
  if (!(file instanceof File) || file.size === 0) return { error: "Archivo requerido" };
  if (!PUBLIC_FOLDERS.includes(folder)) return { error: "Carpeta no válida" };

  try {
    const key = await uploadFile(file, { folder, visibility: "public", ownerId: user.id });
    return { key, url: publicImageUrl(key)! };
  } catch (e: any) {
    return { error: e.message as string };
  }
}

/** Borra una imagen pública; solo el dueño (segmento <userId> de la key). */
export async function deleteImage(key: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado" };
  if (key.split("/")[1] !== user.id) return { error: "No autorizado" };

  try {
    await deleteFiles("public", [key]);
    return { ok: true };
  } catch (e: any) {
    return { error: e.message as string };
  }
}
