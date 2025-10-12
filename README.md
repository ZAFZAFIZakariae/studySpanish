# Study Spanish Coach

A clean, coach-style workspace for organising B1–C1 Spanish practice. The app keeps lessons, analytics, and flashcards in a single place so you can plan focused sessions and keep your speaking skills sharp—even offline.

## Features

- **Overview dashboard** – scan headline stats, lesson groups, and trending tags on the home screen.
- **Progress analytics** – review mastery, timing, weak tags, and the next five recommended exercises.
- **Flashcard trainer** – flip with the spacebar and grade your recall with J/K or the arrow keys.
- **Content manager** – validate JSON bundles, preview diffs, and cache new lessons for offline use.

## Run the app locally

1. Install dependencies (Node.js 18+ recommended):

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

   Vite prints a local URL (typically <http://localhost:5173>) that you can open in the browser.

3. Optional scripts:

   ```bash
   npm run build   # Type-check and build the production bundle
   npm run test    # Run the Jest test suite
   ```

## Verification checklist

To confirm the app is healthy, run the test suite followed by a production build:

```bash
npm test
npm run build
```

Both commands should complete without errors. The build step prints a summary of emitted assets; large bundles are flagged with a warning but do not indicate a failure.

## Importing content

Use the **Content manager** page to upload JSON bundles that follow the `SeedBundle` schema (`lessons`, `exercises`, and `flashcards` arrays). The UI validates the structure, previews new/updated records, and updates the offline cache after a successful import.

## Project structure

- `src/components/layout/AppShell.tsx` – shared layout and navigation shell.
- `src/pages/` – top-level routes for the dashboard, flashcards, content manager, and lessons.
- `src/components/` – reusable building blocks such as the dashboard, lesson viewer, and exercise engine.
- `src/lib/` – analytics, spaced-repetition, schemas, and grading utilities.

Happy studying! 🇪🇸
