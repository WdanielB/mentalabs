-- Un especialista no puede tener dos citas activas a la misma hora.
-- Se valida en la BD (no solo en la UI) porque dos pacientes pueden reservar a la vez.
create unique index if not exists appointments_specialist_slot_uniq
  on public.appointments (specialist_id, start_time)
  where status <> 'cancelled';
