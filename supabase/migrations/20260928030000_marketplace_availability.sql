-- Disponibilidad pública para el marketplace.

-- Horarios de especialistas activos: visibles también sin sesión.
drop policy if exists schedules_public_read_active on public.specialist_schedules;
create policy schedules_public_read_active on public.specialist_schedules
  for select to anon, authenticated
  using (
    is_active
    and exists (select 1 from public.specialists s where s.id = specialist_id and s.status = 'active')
  );

create index if not exists specialist_schedules_specialist_idx on public.specialist_schedules (specialist_id);

-- Horas ocupadas de un especialista. SECURITY DEFINER porque los pacientes no
-- pueden leer citas ajenas; devuelve SOLO la hora de inicio (sin paciente ni
-- estado) y limita el rango a 31 días para que no sirva para volcar la agenda.
create or replace function public.specialist_busy_slots(p_specialist uuid, p_from timestamptz, p_to timestamptz)
returns setof timestamptz
language sql
stable
security definer
set search_path = ''
as $$
  select a.start_time
  from public.appointments a
  where a.specialist_id = p_specialist
    and a.status <> 'cancelled'
    and a.start_time >= p_from
    and a.start_time < least(p_to, p_from + interval '31 days')
$$;

revoke all on function public.specialist_busy_slots(uuid, timestamptz, timestamptz) from public;
grant execute on function public.specialist_busy_slots(uuid, timestamptz, timestamptz) to anon, authenticated;
