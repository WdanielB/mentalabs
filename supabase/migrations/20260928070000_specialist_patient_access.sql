-- Un especialista ve la ficha (patients) de quien atiende por cita o a quien
-- asignó una evaluación, igual que ya ocurría con profiles. Necesario ahora que
-- la lista de pacientes se consulta como el especialista y no con service role.
drop policy if exists patients_select_specialist_related on public.patients;
create policy patients_select_specialist_related on public.patients
  for select to authenticated
  using (
    public.has_role('especialista') and (
      exists (select 1 from public.appointments a where a.patient_id = patients.id and a.specialist_id = (select auth.uid()))
      or exists (select 1 from public.exam_attempts ea where ea.patient_id = patients.id and ea.assigned_by = (select auth.uid()))
    )
  );

create index if not exists appointments_patient_specialist_idx on public.appointments (patient_id, specialist_id);
create index if not exists exam_attempts_patient_assigned_idx on public.exam_attempts (patient_id, assigned_by);
