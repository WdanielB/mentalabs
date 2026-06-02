# MentaLabs v0.2 — Plan de Proyecto

> Ultima revision: 2026-06-02

---

## Contexto de la Aplicacion

**MentaLabs** es una plataforma de salud mental para la evaluacion diagnostica y seguimiento de pacientes con condiciones como TEA (Trastorno del Espectro Autista), TDAH y Discapacidad Intelectual (DI).

### Flujo principal

1. El **admin** crea examenes en el banco de pruebas (editor no-code) y configura reglas diagnosticas con umbrales de score por edad.
2. El **especialista** (psicologo) asigna examenes a sus pacientes, revisa resultados, crea registros clinicos firmados y gestiona su agenda de citas.
3. El **paciente** accede a sus examenes pendientes, los completa, consulta sus resultados, escribe en su diario de estado animico y accede a juegos terapeuticos.
4. El **tutor** (familiar/cuidador) tiene visibilidad sobre el estado de sus pacientes vinculados y puede ver reportes de progreso.

### Stack tecnico

| Capa | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router) |
| Base de datos / Auth | Supabase (PostgreSQL + RLS) |
| Estilos | Tailwind CSS 4 |
| Iconos | lucide-react |
| Animaciones | GSAP |
| Fechas | date-fns (locale es) |
| PDF | jsPDF |
| Lenguaje | TypeScript 6 |

### Roles de usuario

| Rol | Ruta base | Layout |
|---|---|---|
| admin | `/admin` | `AdminSidebar` (componente compartido) |
| especialista | `/especialista` | `layout.tsx` con sidebar propio |
| paciente | `/paciente` | `layout.tsx` con sidebar propio |
| tutor | `/tutor` | `layout.tsx` con sidebar propio |

### Diseno visual: SAP Fiori ERP
- Fondo de pagina: `#f5f5f5`
- Paneles: `bg-white border border-[#d9d9d9]`
- Bandas de seccion: `bg-[#f2f4f7]`
- Primario: `#0070f2`
- Texto cuerpo: `#1d2d3e` / muted: `#6a6a6a`
- Semaforo: verde `#107e3e`, ambar `#e9730c`, rojo `#bb0000`
- Sin emojis. Sin `rounded-2xl`. Sin `shadow-sm` decorativo.

---

## Estado actual del proyecto

### Base de datos (Supabase)

| Tabla / Entidad | Estado |
|---|---|
| `profiles` (todos los roles) | Listo |
| `patients`, `specialists` (extensiones) | Listo |
| `tutor_patient_links` | Listo |
| `appointments` | Listo |
| `exams`, `questions` | Listo |
| `exam_attempts`, `exam_answers` | Listo |
| `diagnostic_rules` | Listo |
| `diagnostics` (resultados) | Listo |
| `clinical_records` (historia clinica) | Listo |
| `diary_entries` | Listo |
| `game_sessions` | Listo |
| `specialist_focus_areas` | Listo |
| RLS policies | Mayormente listo (varios fix aplicados) |
| Seeds de prueba | Listo (TEA, datos reales, auth) |

---

### Modulo Admin

| Pagina | Funcionalidad | Diseno SAP |
|---|---|---|
| `/admin` — Panel de control | KPIs del sistema + acceso rapido | Listo |
| `/admin/banco-pruebas` | Lista de examenes publicados | Wrapper actualizado, interno pendiente |
| `/admin/banco-pruebas/[id]` | Editor no-code de preguntas y configuracion | Interno pendiente |
| `/admin/reglas` | CRUD de reglas diagnosticas (umbrales) | Wrapper actualizado, interno pendiente |
| `/admin/psicologos` | Lista y gestion de especialistas | Wrapper actualizado, interno pendiente |
| `/admin/pacientes` | Lista y gestion de pacientes | Wrapper actualizado, interno pendiente |
| `/admin/asignaciones` | Vinculacion especialista ↔ paciente | Wrapper actualizado, interno pendiente |
| `/admin/solicitudes` | Revision de solicitudes pendientes | Wrapper actualizado, interno pendiente |
| `AdminSidebar` | Sidebar con navegacion SAP | Listo |

---

### Modulo Especialista

| Pagina | Funcionalidad | Diseno SAP |
|---|---|---|
| `/especialista` — Dashboard | KPIs, lista de pacientes recientes, actividad | Listo |
| `/especialista/layout.tsx` | Sidebar SAP con secciones | Listo |
| `/especialista/agenda` | Calendario de citas por dia | Interno pendiente (usa colores slate/emerald) |
| `/especialista/examenes` | Lista de examenes asignados | Interno pendiente |
| `/especialista/examenes/[id]` | Detalle de examen y respuestas | Interno pendiente |
| `/especialista/horarios` | Configuracion de disponibilidad | Interno pendiente |
| `/especialista/pacientes` | Lista de pacientes asignados (con cache) | Interno pendiente |
| `/especialista/pacientes/[patientId]` | Historia clinica, examenes, citas del paciente | Interno pendiente (usa emerald, slate) |
| `/especialista/pacientes/[patientId]/sesion/[appointmentId]` | Sesion de consulta con registro clinico | Interno pendiente |
| `/especialista/reportes` | Reportes de progreso y diagnosticos | Interno pendiente |

---

### Modulo Paciente

| Pagina | Funcionalidad | Diseno SAP |
|---|---|---|
| `/paciente` — Dashboard | Info del paciente, KPIs, examenes pendientes, proxima cita | Listo |
| `/paciente/layout.tsx` | Sidebar SAP | Listo |
| `/paciente/examenes` | Lista de examenes asignados y su estado | Interno pendiente |
| `/paciente/resultados` | Resultados de examenes completados | Interno pendiente |
| `/paciente/citas` | Agenda de citas con especialista | Interno pendiente |
| `/paciente/diario` | Diario de estado animico (CRUD) | Funcional. Diseno pendiente (usa emerald/amber) |
| `/paciente/juegos` | Catalogo de juegos terapeuticos | Funcional. Diseno pendiente (usa gradientes de color) |
| `/examen` | Motor de examen (todas las preguntas, tipos, juegos embebidos) | Funcional. Diseno pendiente |

---

### Modulo Tutor

| Pagina | Funcionalidad | Diseno SAP |
|---|---|---|
| `/tutor` — Dashboard | KPIs, tabla de pacientes, acceso rapido | Listo |
| `/tutor/layout.tsx` | Sidebar SAP | Listo |
| `/tutor/pacientes` | Detalle expandible de cada paciente vinculado | Funcional. Diseno pendiente (usa slate) |
| `/tutor/agenda` | Vista de citas de sus pacientes | Interno pendiente |
| `/tutor/reportes` | Reportes de progreso de sus pacientes | Interno pendiente |

---

### Paginas publicas / Auth

| Pagina | Estado |
|---|---|
| `/` — Landing page | Existe (no evaluada en este ciclo) |
| `/como-funciona` | Existe |
| `/soluciones` | Existe |
| `/marketplace` | Existe |
| `/login` | Funcional |
| `/registro` | Funcional |
| `/studio` + `/studio/logica` | Existe (herramienta de diseño de examenes) |

---

### Componentes compartidos

| Componente | Estado |
|---|---|
| `AdminSidebar.tsx` | Listo (SAP) |
| `ClinicalHistoryView.tsx` | Funcional (diseno pendiente revision) |
| `ExamEditor.tsx` | Funcional (editor no-code del banco de pruebas) |
| `GameRenderer.tsx` | Funcional (renderiza juegos embebidos en examen) |
| `RefreshButton.tsx` | Listo |

---

### Server Actions y Cache

| Archivo | Contenido |
|---|---|
| `actions/admin.ts` | `getAdminStats()` con `unstable_cache` |
| `actions/cache.ts` | `revalidateAdminCache()` con `updateTag` |
| `actions/auth.ts` | Login, registro, logout |
| `actions/exams.ts` | Publicar, obtener examenes |
| `actions/specialists.ts` | Datos de especialistas |
| `lib/auth/role.ts` | `resolveUserRole()`, `ROLE_ROUTES` |
| `lib/cache/tags.ts` | Tags de cache del sistema |
| `lib/especialista/patients.ts` | Fetch de pacientes del especialista con cache |

---

## Lo que falta — Prioridades

### Prioridad 1: Consistencia visual SAP en sub-paginas

Los siguientes archivos usan colores Tailwind no-SAP (`emerald-*`, `slate-*`, `blue-*`, gradientes `from-*/to-*`). Deben migrarse al sistema de diseno.

| Archivo | Problema principal |
|---|---|
| `especialista/agenda/page.tsx` | `text-blue-600`, `bg-blue-50`, `text-green-600`, `bg-slate-100` |
| `especialista/pacientes/page.tsx` + components | Slate, emerald |
| `especialista/pacientes/[patientId]/page.tsx` | `bg-emerald-100`, `text-emerald-700`, `bg-slate-*` |
| `especialista/pacientes/[patientId]/sesion/[id]/page.tsx` | Pendiente revision |
| `especialista/examenes/page.tsx` | Pendiente revision |
| `especialista/reportes/page.tsx` | Pendiente revision |
| `especialista/horarios/page.tsx` | Pendiente revision |
| `paciente/diario/page.tsx` | `text-emerald-600`, `bg-amber-50`, iconos de emojis de mood |
| `paciente/juegos/page.tsx` | Gradientes de colores, `bg-blue-50` |
| `paciente/examenes/page.tsx` | Pendiente revision |
| `paciente/resultados/page.tsx` | Pendiente revision |
| `paciente/citas/page.tsx` | Pendiente revision |
| `tutor/pacientes/page.tsx` | Slate |
| `tutor/agenda/page.tsx` | Pendiente revision |
| `tutor/reportes/page.tsx` | Pendiente revision |
| `admin/banco-pruebas/[id]/page.tsx` | Pendiente revision (editor complejo) |
| `admin/reglas/page.tsx` interno | Pendiente revision |
| `admin/psicologos/page.tsx` interno | Pendiente revision |
| `admin/pacientes/page.tsx` interno | Pendiente revision |
| `admin/asignaciones/page.tsx` interno | Pendiente revision |
| `admin/solicitudes/page.tsx` interno | Pendiente revision |

---

### Prioridad 2: Funcionalidades incompletas o mock

| Feature | Estado | Notas |
|---|---|---|
| Agendar cita desde `/paciente/citas` | Pendiente | La pagina existe pero no hay flujo de creacion desde el lado del paciente |
| Juegos terapeuticos — logica de juego real | Parcial | `GameRenderer` existe, falta contenido de juegos (solo catalogo visual) |
| Motor de examen — tipos `interactive_game` | Parcial | `GameRenderer` integrado, falta validacion de completitud |
| Horarios de especialista | Pendiente | La pagina existe pero la logica de bloqueo de slots no esta clara |
| Reportes exportables (PDF) | Parcial | `jsPDF` instalado, falta implementacion en paginas de reporte |
| Notificaciones in-app | No iniciado | No existe tabla ni UI para notificaciones |
| Pagina publica (landing) | No evaluada | Existe pero no fue revisada en este ciclo |

---

### Prioridad 3: Mejoras tecnicas

| Item | Estado |
|---|---|
| Extender cache (`unstable_cache`) a modulos de especialista y paciente | Parcial (solo admin tiene cache) |
| Error boundaries / paginas de error (`error.tsx`) | No existe en sub-rutas |
| Loading states (`loading.tsx`) | Solo existe en especialista/pacientes |
| Middleware de redireccion por rol | Existe en `middleware.ts` |
| Tests | No existen |

---

## Resumen ejecutivo

| Area | % completado (estimado) |
|---|---|
| Base de datos y migraciones | 95% |
| Auth y roles | 95% |
| Admin — funcionalidad | 90% |
| Admin — diseno SAP | 40% (solo dashboards y wrappers) |
| Especialista — funcionalidad | 80% |
| Especialista — diseno SAP | 20% (solo dashboard + layout) |
| Paciente — funcionalidad | 70% |
| Paciente — diseno SAP | 25% (solo dashboard + layout) |
| Tutor — funcionalidad | 60% |
| Tutor — diseno SAP | 25% (solo dashboard + layout) |
| Motor de examen | 80% |
| Paginas publicas | 50% |
| **Total general** | **~60%** |
