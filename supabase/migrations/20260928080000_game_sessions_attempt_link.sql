-- Trazabilidad: una sesión de juego puede venir de una evaluación asignada
-- (batería con juegos) o de práctica libre (attempt_id nulo).
alter table public.interactive_sessions
  add column if not exists attempt_id uuid references public.exam_attempts(id) on delete set null;
create index if not exists interactive_sessions_patient_idx on public.interactive_sessions (patient_id, session_start desc);
create index if not exists interactive_sessions_attempt_idx on public.interactive_sessions (attempt_id);

-- El especialista ve las sesiones de juego de sus pacientes (no había política).
drop policy if exists interactive_sessions_select_specialist on public.interactive_sessions;
create policy interactive_sessions_select_specialist on public.interactive_sessions
  for select to authenticated
  using (
    public.has_role('especialista') and (
      exists (select 1 from public.appointments a where a.patient_id = interactive_sessions.patient_id and a.specialist_id = (select auth.uid()))
      or exists (select 1 from public.specialist_patient_assignments s where s.patient_id = interactive_sessions.patient_id and s.specialist_id = (select auth.uid()))
    )
  );

-- Batería digital con los 4 juegos clínicos (sin ítems puntuables: el
-- resultado está en las métricas de cada sesión de juego).
insert into public.exams (id, title, description, created_by, is_published)
values ('dddddddd-0000-0000-0000-000000000007',
  'Batería digital de atención y funciones ejecutivas',
  '{"text":"Cuatro pruebas interactivas: Stroop (control inhibitorio), D2-R (atención selectiva), CARAS-R (impulsividad) y Torre de Londres (planificación). Duración aproximada: 15 minutos. Se juega en tablet o computadora, idealmente con el especialista o un adulto presente.","battery":"TDAH · Niños y adolescentes","diagnosis_type":"TDAH","respondent":"paciente","age_range":"7 a 16 años","kind":"games","source":"DTEP"}',
  null, true)
on conflict (id) do update set title = excluded.title, description = excluded.description, is_published = true;

insert into public.questions (id, exam_id, order_index, content, options, category, tags) values
  (md5('bateria-1')::uuid, 'dddddddd-0000-0000-0000-000000000007', 0, 'Colores y palabras', '{"type":"interactive_game","game_type":"stroop","config_json":"{\"game_type\":\"stroop\",\"phase_seconds\":45}"}'::jsonb, 'Control inhibitorio', array['juego','stroop']),
  (md5('bateria-2')::uuid, 'dddddddd-0000-0000-0000-000000000007', 1, 'Cazador de letras', '{"type":"interactive_game","game_type":"d2r","config_json":"{\"game_type\":\"d2r\",\"lines\":6,\"items_per_line\":24,\"line_seconds\":20}"}'::jsonb, 'Atención selectiva', array['juego','d2r']),
  (md5('bateria-3')::uuid, 'dddddddd-0000-0000-0000-000000000007', 2, 'La cara diferente', '{"type":"interactive_game","game_type":"caras_r","config_json":"{\"game_type\":\"caras_r\",\"time_seconds\":180}"}'::jsonb, 'Impulsividad', array['juego','caras_r']),
  (md5('bateria-4')::uuid, 'dddddddd-0000-0000-0000-000000000007', 3, 'La torre', '{"type":"interactive_game","game_type":"tower_london","config_json":"{\"game_type\":\"tower_london\",\"levels\":8,\"level_seconds\":90}"}'::jsonb, 'Planificación', array['juego','tower_london'])
on conflict (id) do update set content = excluded.content, options = excluded.options, category = excluded.category, tags = excluded.tags, order_index = excluded.order_index;
