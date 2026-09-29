# Demo Day · Caso Thiago (sospecha de TEA)

> Hay un segundo caso, completo y con diagnóstico, pensado para el storytelling del pitch:
> **Mateo, 8 años, TDAH** (padre, hijo y psicólogo; cuestionario, juegos interactivos y 5 sesiones).
> Ver [storytelling/STORYTELLING_MATEO.md](storytelling/STORYTELLING_MATEO.md) y las capturas en
> [storytelling/capturas/](storytelling/capturas/).

Caso 100 % ficticio, construido sobre los perfiles de usuario del Entregable 1
(Mariana, la madre; Roberto, el psicólogo infantil) y el foco del Entregable 2
(familias de Arequipa, niños en inicial).

## Antes de presentar

1. Reinicia el caso: en Supabase → SQL Editor, ejecuta `supabase/seed_demo_tea.sql`.
   Deja todo como al inicio (el informe de la 2.ª sesión vuelve a borrador).
2. Abre dos navegadores (o uno normal y otro en incógnito): uno para Mariana y otro para Roberto.
3. Ten a mano la landing en `/` y el directorio en `/marketplace`.

| Rol | Correo | Contraseña |
|---|---|---|
| Madre (tutora) | `mariana.demo@mentalabs.com` | `1234` |
| Psicólogo | `roberto.demo@mentalabs.com` | `1234` |

Thiago no tiene cuenta propia: lo administra Mariana (menor de 18, sin correo).

## La historia en una línea de tiempo

| Fecha (2026) | Qué pasa | Dónde se ve |
|---|---|---|
| 01/09 | Mariana crea su cuenta y registra a Thiago (2 años 4 meses) | Portal familiar → Perfiles de la familia |
| 02/09 | Encuentra a Roberto en el directorio (TEA, niños, Arequipa) y agenda | `/marketplace` |
| 08/09 | 1.ª consulta: anamnesis completa, informe firmado | Historia clínica |
| 10/09, 20:47 | Mariana responde el **M-CHAT-R/F** desde casa, de noche → 11 puntos, **riesgo alto** (corregido por la plataforma) | Resultados |
| 19/09 | Roberto observa y aplica **CARS-2** → 33 puntos, **TEA leve a moderado** | Resultados |
| 02/10 | Devolución de resultados (cita confirmada) | Próxima cita |

Mensaje clave: de la primera consulta a la devolución en **24 días**, frente a los 60 a 90 días entre
citas que describe el Entregable 1. Es un caso ilustrativo, no una medición.

## Guion (7 minutos)

1. **El problema (landing, 30 s).** “Entender cómo piensa tu hijo no debería tomar un año.”
2. **Encontrar ayuda (marketplace, 1 min).** Filtra *Autismo (TEA)* + *Niños*, busca “Arequipa”.
   Muestra que se ve colegiatura, tarifa y horarios libres reales. Abre *Ver horarios* de Roberto.
3. **Una sola cuenta para la familia (Mariana, 1,5 min).** Ingresa como Mariana.
   Arriba del menú: *Estás gestionando a Thiago*. Enseña el **Recorrido de Thiago**,
   el resultado del M-CHAT y el informe firmado de la 1.ª consulta.
   Opcional: en *Perfiles de la familia* añade un segundo hijo para mostrar que no hace falta otro correo.
4. **El especialista (Roberto, 2,5 min).** Ingresa como Roberto → *Mis pacientes* → Thiago.
   Señala el aviso *Cuenta administrada por su tutora: Mariana…* (a quién llamar),
   los puntajes ya corregidos (M-CHAT 11, CARS-2 33) y la regla aplicada por edad.
   Abre la sesión del 19/09 (`/especialista/pacientes/cccccccc-0000-0000-0000-000000000003/sesion/cccccccc-0000-0000-0000-0000000000a2`),
   revisa el plan y **firma el informe en vivo**.
5. **La familia recibe el informe (Mariana, 30 s).** Recarga el portal: aparece el nuevo informe firmado.
   Antes de firmarlo, Mariana no lo veía: la base de datos solo lo libera firmado.
6. **La diferencia (biblioteca, 1 min).** En *Biblioteca de pruebas*: 6 baterías digitalizadas desde DTEP
   (M-CHAT-R/F, CARS-2, AQ-50, RAADS-R, WURS-25, Conners 4) con reglas por puntaje y edad.
   Ese es el espacio vacío del Entregable 2: *calidad de exámenes estandarizados*, que Terapify o Yana no cubren.

## Qué decir si preguntan

- **¿La plataforma diagnostica?** No. Corrige y ordena los instrumentos; el diagnóstico lo firma el profesional.
- **¿Se puede manipular un puntaje?** No: la corrección ocurre en la base de datos y rechaza respuestas que no
  existen en el instrumento.
- **¿Quién ve los datos de un niño?** Su tutor y los especialistas que lo atienden. Otro especialista no ve nada.
- **Licencias:** CARS-2, Conners 4, AQ y RAADS-R tienen derechos de autor (WPS, MHS, etc.). Para uso comercial
  hace falta licencia de cada editorial; en la demo se usan como prototipo.

## Datos técnicos del caso

- M-CHAT-R/F: ítems que puntúan 2, 5, 6, 7, 9, 10, 14, 15, 16, 17 y 19 (total 11).
- CARS-2 admite medios puntos; se guarda ×2 internamente (66 = 33) y la app muestra 33.
- Reglas diagnósticas y baterías: `scripts/import-dtep.mjs` → `supabase/seed_dtep_instruments.sql`.
