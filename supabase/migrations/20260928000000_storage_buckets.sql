-- Storage de imágenes/archivos.
-- Todas las subidas y borrados pasan por el servidor (src/lib/storage) con la
-- service role, igual que funcionará con DigitalOcean Spaces. Por eso NO se
-- crean políticas para anon/authenticated: el acceso directo desde el cliente
-- queda denegado por defecto.
--   images  → público (avatares, imágenes de exámenes/juegos). Lectura por URL pública.
--   private → privado (adjuntos clínicos). Lectura solo por URL firmada.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('images', 'images', true, 5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']),
  ('private', 'private', false, 10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
