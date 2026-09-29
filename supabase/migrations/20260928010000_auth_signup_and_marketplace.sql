-- 1) Alta de usuarios en la BD (reemplaza la server action createUserProfile,
--    que aceptaba cualquier userId sin verificar quién llamaba).
--    El registro envía { role, full_name } en options.data (user_metadata).
--    Solo se aceptan roles auto-registrables; "admin" nunca.
--    El rol se copia a app_metadata (no editable por el usuario) para que el
--    JWT lo lleve y el proxy pueda autorizar rutas sin consultar la BD.

create schema if not exists private;

create or replace function private.set_signup_role()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  requested text := new.raw_user_meta_data ->> 'role';
begin
  if coalesce(new.raw_app_meta_data ->> 'role', '') = '' then
    new.raw_app_meta_data := coalesce(new.raw_app_meta_data, '{}'::jsonb)
      || jsonb_build_object(
        'role',
        case when requested in ('paciente', 'tutor', 'especialista') then requested else 'paciente' end
      );
  end if;
  return new;
end;
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  user_role public.user_role := (new.raw_app_meta_data ->> 'role')::public.user_role;
  name text := coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(coalesce(new.email, ''), '@', 1));
begin
  insert into public.profiles (id, role, email, full_name)
  values (new.id, user_role, coalesce(new.email, ''), name)
  on conflict (id) do nothing;

  if user_role = 'paciente' then
    insert into public.patients (id, status) values (new.id, 'active') on conflict (id) do nothing;
  elsif user_role = 'especialista' then
    insert into public.specialists (id, specialty, status, display_name)
    values (new.id, 'Psicología General', 'pending', name)
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;
revoke all on function private.set_signup_role() from public, anon, authenticated;

-- 2) Perfil público del especialista para el marketplace (sin email).
alter table public.specialists
  add column if not exists focus_areas      text[]  not null default '{}',
  add column if not exists display_name     text,
  add column if not exists title            text,
  add column if not exists avatar_key       text,
  add column if not exists city             text,
  add column if not exists license_number   text,
  add column if not exists years_experience int     not null default 0,
  add column if not exists review_count     int     not null default 0,
  add column if not exists sessions_count   int     not null default 0,
  add column if not exists languages        text[]  not null default '{Español}',
  add column if not exists modalities       text[]  not null default '{online}',
  add column if not exists approaches       text[]  not null default '{}',
  add column if not exists age_groups       text[]  not null default '{}';

update public.specialists s
set display_name = p.full_name
from public.profiles p
where p.id = s.id and s.display_name is null;

-- Los triggers se crean después de las columnas que usan.
drop trigger if exists on_auth_user_set_role on auth.users;
create trigger on_auth_user_set_role
  before insert on auth.users
  for each row execute function private.set_signup_role();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- El especialista no puede auto-activarse ni inflar su rating/reseñas.
create or replace function private.guard_specialist_self_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) = new.id and not public.has_role('admin') then
    new.status         := old.status;
    new.rating         := old.rating;
    new.review_count   := old.review_count;
    new.sessions_count := old.sessions_count;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_specialist_self_update on public.specialists;
create trigger guard_specialist_self_update
  before update on public.specialists
  for each row execute function private.guard_specialist_self_update();

-- Lectura pública (marketplace) solo de especialistas activos.
drop policy if exists specialists_public_read_active on public.specialists;
create policy specialists_public_read_active on public.specialists
  for select to anon, authenticated
  using (status = 'active');

create index if not exists specialists_status_rating_idx on public.specialists (status, rating desc);

-- 3) Backfill: rol en app_metadata para usuarios que solo lo tenían en profiles.
update auth.users u
set raw_app_meta_data = coalesce(u.raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', p.role::text)
from public.profiles p
where p.id = u.id and coalesce(u.raw_app_meta_data ->> 'role', '') = '';

-- 4) Avisos del security advisor.
alter function public.has_role(text) set search_path = '';
alter function public."current_role"() set search_path = '';
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
