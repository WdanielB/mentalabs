// "public" → avatares, imágenes de exámenes/juegos (URL pública)
// "private" → adjuntos clínicos (solo URL firmada)
export type Visibility = "public" | "private";

export interface StorageProvider {
  upload(
    visibility: Visibility,
    key: string,
    body: ArrayBuffer,
    contentType: string
  ): Promise<void>;
  remove(visibility: Visibility, keys: string[]): Promise<void>;
  signedUrl(visibility: Visibility, key: string, expiresInSeconds: number): Promise<string>;
}
