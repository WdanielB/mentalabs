# Contexto del Sistema: MentaLabs (Fase Beta / v1.0.0)

Este documento define la arquitectura core y las reglas de negocio de MentaLabs. Lee esto antes de proponer cambios en el código o en la base de datos.

## 1. Pila Tecnológica
- **Frontend:** Next.js 14 (App Router, Server Actions), React, TypeScript.
- **UI/UX:** Tailwind CSS, shadcn/ui.
- **Backend/BaaS:** Supabase (PostgreSQL, Auth, Realtime, Storage).
- **Utilidades Clave:** `date-fns` (manejo de fechas), `jsPDF` (exportación de reportes).

## 2. Arquitectura de Seguridad y Roles (RBAC)
El sistema utiliza un middleware robusto y Row Level Security (RLS) en Supabase.
Existen 4 roles principales. El enrutamiento automático después del login depende estrictamente de estos roles:
- `Paciente`: Acceso a progreso, citas próximas y resolución de exámenes pendientes.
- `Especialista`: Gestión de agenda, creación/asignación de exámenes, visualización de pacientes.
- `Padre/Tutor`: (Flujo vinculado a pacientes menores).
- `Admin`: Módulo de administración general.

## 3. Funcionalidades Core (Lógica Existente)
- **Motor de Exámenes:** Formularios dinámicos (basados en JSON). Los especialistas usan un creador "no-code" para plantillas.
- **Gestión de Agenda:** Lógica estricta en PostgreSQL (funciones y `pg_cron`) para calcular disponibilidad y evitar cruces de horarios.
- **Notificaciones:** Implementadas con Supabase Realtime para alertas instantáneas (ej. nueva cita, examen completado).
- **Exportación:** Generación de PDF en el cliente usando `jsPDF`.

## 4. Reglas de Desarrollo
- Mantener la separación estricta de rutas según el rol (App Router).
- Toda nueva tabla en Supabase DEBE tener políticas RLS configuradas según el rol.
- Priorizar Server Actions para mutaciones de datos y consultas pesadas.