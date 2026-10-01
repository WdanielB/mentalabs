# Pitch · MentaLabs

Tres versiones del pitch, con la estructura que recomienda UTEC Ventures para cada público. Abre `index.html` para elegir una: ahí están la estructura, las 5 preguntas respondidas, el elevator pitch y el siguiente paso de cada versión.

| Archivo | Para quién | Duración | Estructura | Siguiente paso |
|---|---|---|---|---|
| `inversion.html` | Inversionistas y jurado (Demo Day) | 5:10 · 15 diapositivas + sub-diapositivas de estudio | Historia · Problema · Usuario · Solución · Producto · Competencia · Mercado · Modelo · Validación · Plan · Equipo · Lo que buscamos · Cierre | Demo de 15 min e inversión de S/ 35 000 (ángeles o fondos como StartUp Perú) |
| `colegios.html` | Dirección y equipo psicopedagógico (B2B) | 4 min | Problema · Usuario · Solución · Alternativas · Validación · Equipo · Visión | Agendar la charla con padres (piloto sin costo) |
| `familias.html` | Madres, padres y tutores (B2C) | 3 min | Problema (empatizar) · Historia · ¿Cómo lo resuelven hoy? · Solución · Validación · Confianza | Crear la cuenta y registrar a su hijo |

- **Presentar:** abre el HTML en Chrome o Edge. ← → para avanzar · `N` notas del presentador (guion con tiempos y las 5 preguntas en la primera diapositiva) · `F` pantalla completa · `P` imprimir o PDF.
- **Guion de la versión inversionistas:** `GUION_INVERSION.md` (tiempos, quién habla, voz y emoción, qué decir, preguntas del jurado y fuentes). Es el mismo texto de las notas del deck.
- **Sub-diapositivas (solo `inversion.html`):** `↓` abre el detalle de estudio de la diapositiva actual, `↑` o `Esc` lo cierra; no forman parte del recorrido. `T` inicia el cronómetro de ensayo. En Producto, `→` muestra cada pantalla por separado y luego las tres. `inversion.html?estudio` imprime también las sub-diapositivas (`MentaLabs-pitch-inversionistas-estudio.pdf`).
- **PDF listos para enviar:** `MentaLabs-pitch-inversionistas.pdf`, `MentaLabs-pitch-colegios.pdf`, `MentaLabs-pitch-familias.pdf`.
- **Archivos compartidos:** `deck.css` (estilo, maquetas de dispositivo, perfiles) y `deck.js` (navegación). Las capturas se cargan desde `../storytelling/capturas/`; copia la carpeta `docs/` completa.

## Elevator pitch (plantilla de la guía)

> Para **familias con hijos con sospecha de autismo o TDAH**, que **esperan meses por un diagnóstico**, estamos construyendo **MentaLabs**: pruebas psicológicas estandarizadas convertidas en cuestionarios y juegos que se completan desde casa, que les permite **tener un informe firmado en 4 días o menos**, a diferencia de **los 6 meses del sistema público o los consultorios que corrigen en papel**.

**10 segundos:** MentaLabs convierte las pruebas psicológicas en juegos y cuestionarios que la familia completa desde casa, para diagnosticar TEA y TDAH en 4 días y no en 6 meses.

## Antes de presentar, confirmar

1. **Roles del equipo:** propuestos como *Producto y tecnología* y *Validación y alianzas*.
2. **Lo que buscamos** (versión inversionistas): S/ 35 000 es una propuesta; confirma el monto y qué se ofrece a cambio (participación, nota convertible o fondo no reembolsable). Meta 2027: 1 000 evaluaciones (S/ 90 000) + 20 psicólogos (S/ 21 360) + colegios con 1 500 alumnos (S/ 12 000) ≈ S/ 123 000.
3. **Precios:** comisión del 20 %, S/ 89 al mes y S/ 8 por alumno son hipótesis a validar.
4. **Perfiles hipotéticos:** Rocío (coordinadora psicopedagógica) y Elena (docente) no vienen de los entregables; valídalos con un colegio antes de citarlos como hallazgos.
5. **Versión familias:** agrega el enlace o el código QR de registro en la última diapositiva.
6. **Demo en vivo:** reinicia el caso con `supabase/seed_demo_tdah.sql` (ver `docs/storytelling/`).
