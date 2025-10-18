# Study Spanish Coach (Static Edition)

A self-contained Spanish study workspace that mirrors the modern LMS aesthetic. The static build ships with a sidebar-driven layout, responsive cards, and an offline lesson viewer so you can review every extract without installing Node.js or running a bundler.

## Features

- **Dashboard shell** – fixed sidebar navigation, global search bar, and responsive cards inspired by OpenAI/Google design systems.
- **Lesson explorer** – browse subjects, filter by tags, and highlight recent material.
- **Markdown renderer** – click a lesson to convert the bundled `.txt` extract into rich Markdown (images are referenced directly from the repository).
- **Offline manifest** – `lesson-data.js` ships with the full subject/lesson catalogue so the app can run without network access.

## Launching the static app

The project is now pure HTML/CSS/vanilla JS. You can load it either directly from the filesystem or through any static file server.

### Option 1 – Open the file directly

1. Locate `index.html` at the repository root.
2. Double-click the file (or run `open index.html` on macOS / `xdg-open index.html` on Linux).
3. Your browser will render the dashboard immediately—no build step required.

### Option 2 – Serve with Python (recommended for local testing)

```bash
cd studySpanish
python3 -m http.server 8000
```

Then open <http://localhost:8000/index.html> in your browser. Serving through `http.server` ensures that relative image paths resolve correctly and mimics a production deployment more closely than the direct file method.

### Alternative static servers

Any static server works if you prefer different tooling (for example, `ruby -run -ehttpd . -p8000`, `php -S localhost:8000`, or `npx serve .`). None of these require a build pipeline—the repository already contains the production-ready assets.

## Repository structure

- `index.html` – entry point that wires the layout and loads the stylesheet/script.
- `styles.css` – handcrafted responsive design system.
- `app.js` – vanilla JavaScript that powers navigation, filtering, and Markdown rendering.
- `lesson-data.js` – offline manifest of every lesson and associated metadata.
- `subjects/` – original text and media assets referenced by the viewer.

Happy studying! 🇪🇸
