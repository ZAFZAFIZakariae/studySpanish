# Study Spanish Coach

A clean, coach-style workspace for organising B1–C1 Spanish practice. The app keeps lessons, analytics, and flashcards in a single place so you can plan focused sessions and keep your speaking skills sharp—even offline.

## Features

- **Overview dashboard** – scan headline stats, lesson groups, and trending tags on the home screen.
- **Progress analytics** – review mastery, timing, weak tags, and the next five recommended exercises.
- **Flashcard trainer** – flip with the spacebar and grade your recall with J/K or the arrow keys.
- **Content manager** – validate JSON bundles, preview diffs, and cache new lessons for offline use.

## Launch the standalone React app

The workspace now ships as a single-page React app under [`standalone/`](standalone/). React, ReactDOM, lesson data, styles, and assets live beside the HTML entry point—no npm commands or Vite dev server required.

### Option 1: Open directly from disk

1. Locate [`standalone/index.html`](standalone/index.html) in your file browser.
2. Double-click the file (or use `open standalone/index.html` on macOS / `xdg-open standalone/index.html` on Linux).
3. The dashboard loads instantly using the bundled data from [`standalone/lesson-data.js`](standalone/lesson-data.js).

### Option 2: Serve from a local terminal

1. Start a static web server from the `standalone/` folder:

   ```bash
   cd standalone
   python3 -m http.server 8000
   ```

   The command prints `Serving HTTP on :: port 8000`. Leave it running.

2. Visit <http://localhost:8000> in your browser to use the app.
3. Stop the server with `Ctrl+C` when you are finished.

### Updating lessons

- Edit [`standalone/lesson-data.js`](standalone/lesson-data.js) to tweak titles, notes, or markdown content.
- Drop new figures and PDFs inside [`standalone/subjects/`](standalone/subjects/) and reference them from the lesson data.
- Refresh the browser tab to see your changes instantly.

Happy studying! 🇪🇸
