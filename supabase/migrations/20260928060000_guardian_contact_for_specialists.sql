-- El especialista necesita saber quién administra la cuenta de un menor
-- (a quién llamar, quién responde los cuestionarios). En vez de abrir
-- profiles y tutor_patient_links con políticas amplias, esta función
-- devuelve solo nombre, teléfono y correo del tutor, y solo si quien
-- pregunta atiende a ese paciente (asignación o cita).
create or replace function public.patient_guardians(p_patient uuid)
returns table (full_name text, phone text, email text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.full_name, p.phone, p.email
  from public.tutor_patient_links l
  join public.profiles p on p.id = l.tutor_id
  where l.patient_id = p_patient
    and (
      public.has_role('admin')
      or exists (select 1 from public.specialist_patient_assignments a where a.patient_id = p_patient and a.specialist_id = (select auth.uid()))
      or exists (select 1 from public.appointments a where a.patient_id = p_patient and a.specialist_id = (select auth.uid()))
    )
$$;

revoke all on function public.patient_guardians(uuid) from public, anon;
grant execute on function public.patient_guardians(uuid) to authenticated;
