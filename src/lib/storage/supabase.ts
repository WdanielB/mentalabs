import { createAdminClient } from "../../../utils/supabase/admin";
import type { StorageProvider, Visibility } from "./types";

// Nombres de bucket definidos en supabase/migrations/20260928000000_storage_buckets.sql
const BUCKETS: Record<Visibility, string> = {
  public: "images",
  private: "private",
};

export const supabaseStorage: StorageProvider = {
  async upload(visibility, key, body, contentType) {
    const { error } = await createAdminClient()
      .storage.from(BUCKETS[visibility])
      .upload(key, body, { contentType, upsert: false, cacheControl: "31536000" });
    if (error) throw new Error(`Storage upload failed: ${error.message}`);
  },

  async remove(visibility, keys) {
    if (keys.length === 0) return;
    const { error } = await createAdminClient().storage.from(BUCKETS[visibility]).remove(keys);
    if (error) throw new Error(`Storage remove failed: ${error.message}`);
  },

  async signedUrl(visibility, key, expiresInSeconds) {
    const { data, error } = await createAdminClient()
      .storage.from(BUCKETS[visibility])
      .createSignedUrl(key, expiresInSeconds);
    if (error || !data) throw new Error(`Storage signed URL failed: ${error?.message}`);
    return data.signedUrl;
  },
};
