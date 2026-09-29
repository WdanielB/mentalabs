-- Los hijos administrados no tienen correo. profiles.email era NOT NULL + UNIQUE,
-- así que el segundo hijo sin correo chocaba con el primero (''). NULL no
-- choca en un índice único.
alter table public.profiles alter column email drop not null;
update public.profiles set email = null where email = '';

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
  values (new.id, user_role, nullif(new.email, ''), coalesce(nullif(name, ''), 'Paciente'))
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
