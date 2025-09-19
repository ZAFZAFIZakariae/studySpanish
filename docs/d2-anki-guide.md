# D2 — Consolidated Anki Export & Mobile Guide

## 1. Archivo listo para importar
- **Ruta:** `exports/d2-anki-export.csv`
- **Formato:** columnas `front, back, tag` compatibles con Anki.
- **Contenido:** combina todas las barajas (`grammar`, `verbs`, `vocab`, etc.) sin duplicados.

> 📌 Sugerencia: crea una nota de respaldo del CSV en tu gestor de archivos o nube antes de importarlo.

## 2. Importación en AnkiWeb (gratuito)
1. Abre [AnkiWeb](https://ankiweb.net) y regístrate (gratuito).
2. Ve a **Decks → Import File**.
3. Selecciona `d2-anki-export.csv`.
4. Configura:
   - **Type:** *Basic* (front/back).
   - **Field Mapping:** `Front` → *Front*, `Back` → *Back*, `Tags` → *Tags*.
   - Activa "Allow HTML in fields" para conservar cursivas/acentos.
5. Pulsa **Import** y verifica que aparecen las notas y etiquetas.

## 3. Sincronizar con AnkiMobile (iPhone/iPad)
1. Descarga la app **AnkiMobile Flashcards** (pago único, recomendable para estudio serio).
2. Inicia sesión con la misma cuenta de AnkiWeb.
3. Toca **Sync** (icono circular) para traer las tarjetas.
4. Ajusta las opciones de estudio: `Deck Options → New Cards/day` según tu carga (p.ej. 20) y `Steps` para intervalos cortos (1m → 10m → 1d).

> 💡 Truco móvil: añade el widget de AnkiMobile para repasos rápidos y usa los gestos (swipe) para clasificar respuestas sin mirar la pantalla completa.

## 4. Buenas prácticas de repaso
- Etiquetas como `d1>por-para` permiten filtros rápidos en "Browse" → `tag:d1>por-para`.
- Crea una baraja filtrada semanal con `tag:d1*` para enfocarte en trampas del simulacro.
- Activa "Bury related new cards" para espaciar tarjetas con respuestas similares.

Con esto tienes el ecosistema listo: exporto consolidado, importación web gratuita y sincronización móvil para estudiar en cualquier pausa.
