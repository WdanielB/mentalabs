-- ================================================================
-- MENTALABS: especialistas de ejemplo para el marketplace (datos ficticios)
-- Idempotente. Requiere la migración 20260928010000_auth_signup_and_marketplace
-- (el trigger on_auth_user_created crea profile + specialist).
-- Emails @mock.mentalabs.com, contraseña 1234 (solo entorno de pruebas).
-- ================================================================

do $$
declare
  m record;
begin
  for m in
    select * from (values
      ('bbbbbbbb-0000-0000-0000-000000000001'::uuid, 'lucia.ramos',    'Dra. Lucía Ramos Villanueva',   'Psicología Clínica',   'Psicóloga clínica infantil',              'Lima',     'CPsP 21457', 12, 4.9, 187, 1240, 150, array['TDAH/TDA','Autismo (TEA)','Desarrollo Infantil'],        array['Cognitivo-conductual','ABA'],                   array['Niños','Adolescentes'],            array['online','presencial'], array['Español','Inglés'],
        'Acompaño a familias en la evaluación y el tratamiento del TDAH y el espectro autista. Trabajo con padres y colegios para que los avances se sostengan fuera de la consulta.'),
      ('bbbbbbbb-0000-0000-0000-000000000002', 'martin.quispe',   'Mg. Martín Quispe Huamán',      'Psicología Clínica',   'Psicólogo clínico de adultos',            'Cusco',    'CPsP 30982',  8, 4.8, 142,  860, 120, array['Ansiedad','Depresión','Estrés / Burnout'],             array['Cognitivo-conductual','ACT'],                   array['Adultos'],                         array['online'],              array['Español','Quechua'],
        'Terapia breve y basada en evidencia para ansiedad, depresión y agotamiento laboral. Sesiones estructuradas con objetivos medibles desde la primera semana.'),
      ('bbbbbbbb-0000-0000-0000-000000000003', 'carla.mendoza',   'Dra. Carla Mendoza Paredes',    'Psiquiatría',          'Psiquiatra infanto-juvenil',              'Lima',     'CMP 48213',  15, 4.9, 211, 1980, 280, array['TDAH/TDA','Ansiedad','Problemas de Conducta'],         array['Psicofarmacología','Psicoeducación'],           array['Niños','Adolescentes'],            array['online','presencial'], array['Español'],
        'Evaluación psiquiátrica y manejo farmacológico cuando hace falta, siempre coordinado con el psicólogo tratante y la familia.'),
      ('bbbbbbbb-0000-0000-0000-000000000004', 'jorge.salazar',   'Dr. Jorge Salazar Ríos',        'Neurología',           'Neurólogo pediatra',                      'Arequipa', 'CMP 39120',  18, 4.7,  96,  720, 250, array['Autismo (TEA)','Desarrollo Infantil','Dificultades de Aprendizaje'], array['Neurodesarrollo'],                    array['Niños'],                           array['presencial'],          array['Español'],
        'Diagnóstico diferencial del neurodesarrollo: descarto causas neurológicas y oriento el plan terapéutico con el equipo multidisciplinario.'),
      ('bbbbbbbb-0000-0000-0000-000000000005', 'andrea.flores',   'Lic. Andrea Flores Castillo',   'Terapia Ocupacional',  'Terapeuta ocupacional, integración sensorial', 'Lima', 'CTMP 8841',  6, 4.8,  77,  540, 100, array['Autismo (TEA)','Desarrollo Infantil'],                array['Integración sensorial'],                        array['Niños'],                           array['presencial'],          array['Español'],
        'Trabajo la regulación sensorial, la motricidad fina y la autonomía en rutinas diarias con juegos y actividades en casa.'),
      ('bbbbbbbb-0000-0000-0000-000000000006', 'rosa.cardenas',   'Lic. Rosa Cárdenas Linares',    'Fonoaudiología',       'Terapeuta de lenguaje',                   'Trujillo', 'CTMP 9120',  10, 4.9, 131,  990,  90, array['Autismo (TEA)','Dificultades de Aprendizaje','Desarrollo Infantil'], array['Comunicación aumentativa'],     array['Niños'],                           array['online','presencial'], array['Español'],
        'Retrasos del habla y del lenguaje, comunicación alternativa y lectoescritura inicial. Doy tareas cortas y concretas para practicar en casa.'),
      ('bbbbbbbb-0000-0000-0000-000000000007', 'diego.vargas',    'Mg. Diego Vargas Solís',        'Terapia de Parejas',   'Terapeuta de pareja y familia',           'Lima',     'CPsP 25530', 11, 4.6,  88,  610, 160, array['Terapia de Parejas','Duelo y Pérdida'],                array['Sistémica','Gottman'],                          array['Adultos'],                         array['online','presencial'], array['Español'],
        'Conflictos de pareja, comunicación y crianza compartida. También acompaño separaciones y reorganización familiar.'),
      ('bbbbbbbb-0000-0000-0000-000000000008', 'valeria.chavez',  'Ps. Valeria Chávez Rojas',      'Psicología Clínica',   'Psicóloga de adolescentes',               'Piura',    'CPsP 34410',  5, 4.7,  64,  380,  95, array['Ansiedad','Depresión','Problemas de Conducta'],        array['DBT','Cognitivo-conductual'],                   array['Adolescentes'],                    array['online'],              array['Español'],
        'Autolesiones, regulación emocional y ansiedad escolar. Espacio seguro para el adolescente y sesiones de orientación para los padres.'),
      ('bbbbbbbb-0000-0000-0000-000000000009', 'ricardo.paz',     'Dr. Ricardo Paz Guzmán',        'Psiquiatría',          'Psiquiatra de adultos',                   'Lima',     'CMP 41877',  20, 4.8, 176, 2310, 300, array['Depresión','Ansiedad','Estrés / Burnout'],             array['Psicofarmacología'],                            array['Adultos','Adultos mayores'],       array['online','presencial'], array['Español','Inglés'],
        'Trastornos del ánimo y de ansiedad en adultos. Seguimiento cercano de la medicación y trabajo coordinado con psicoterapia.'),
      ('bbbbbbbb-0000-0000-0000-000000000010', 'milagros.torres', 'Mg. Milagros Torres Benavides', 'Psicología Educativa', 'Psicopedagoga',                           'Chiclayo', 'CPsP 28761',  9, 4.7,  83,  670,  85, array['Dificultades de Aprendizaje','TDAH/TDA'],              array['Neuropsicología educativa'],                    array['Niños','Adolescentes'],            array['online','presencial'], array['Español'],
        'Evaluación de dislexia, discalculia y funciones ejecutivas. Elaboro informes para el colegio con adaptaciones concretas.'),
      ('bbbbbbbb-0000-0000-0000-000000000011', 'sebastian.leon',  'Ps. Sebastián León Aguirre',    'Psicología Clínica',   'Psicólogo, adultos neurodivergentes',    'Lima',     'CPsP 36102',  4, 4.9,  52,  290, 110, array['Autismo (TEA)','TDAH/TDA','Ansiedad'],                array['Afirmativo neurodivergente','ACT'],             array['Adultos'],                         array['online'],              array['Español','Inglés'],
        'Diagnóstico tardío de TEA y TDAH en adultos. Enfoque afirmativo: entender cómo funciona tu mente y ajustar el entorno, no solo "corregir" síntomas.'),
      ('bbbbbbbb-0000-0000-0000-000000000012', 'patricia.huerta', 'Dra. Patricia Huerta Salas',    'Psicología Clínica',   'Psicóloga, duelo y trauma',              'Arequipa', 'CPsP 19874', 16, 4.8, 158, 1510, 140, array['Duelo y Pérdida','Depresión','Estrés / Burnout'],     array['EMDR','Humanista'],                             array['Adultos','Adultos mayores'],       array['online','presencial'], array['Español'],
        'Duelo, pérdidas gestacionales y experiencias traumáticas. Ritmo cuidadoso y respeto por los tiempos de cada persona.')
    ) as t(id, slug, full_name, specialty, title, city, license, years, rating, reviews, sessions, rate, areas, approaches, ages, modalities, languages, bio)
  loop
    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      m.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      m.slug || '@mock.mentalabs.com', extensions.crypt('1234', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"],"role":"especialista"}',
      jsonb_build_object('full_name', m.full_name), now(), now(), '', '', '', ''
    ) on conflict (id) do nothing;

    update public.specialists set
      status = 'active', display_name = m.full_name, specialty = m.specialty, title = m.title,
      city = m.city, license_number = m.license, years_experience = m.years, rating = m.rating,
      review_count = m.reviews, sessions_count = m.sessions, hourly_rate = m.rate,
      focus_areas = m.areas, approaches = m.approaches, age_groups = m.ages,
      modalities = m.modalities, languages = m.languages, bio = m.bio
    where id = m.id;
  end loop;
end $$;

-- Horarios semanales (hora de Lima). 0 = domingo. Alterna mañana/tarde según el especialista.
delete from public.specialist_schedules where specialist_id::text like 'bbbbbbbb-%';
insert into public.specialist_schedules (specialist_id, day_of_week, start_time, end_time, is_active)
select s.id, d.dow,
  case when (right(s.id::text, 2)::int + d.dow) % 2 = 0 then time '09:00' else time '14:00' end,
  case when (right(s.id::text, 2)::int + d.dow) % 2 = 0 then time '13:00' else time '19:00' end,
  true
from public.specialists s
cross join (values (1), (2), (3), (4), (5), (6)) as d(dow)
where s.id::text like 'bbbbbbbb-%'
  and (d.dow <> 6 or right(s.id::text, 2)::int % 3 = 0);
