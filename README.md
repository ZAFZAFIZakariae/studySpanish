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
   npm run build        # Type-check and build the production bundle
   npm run test         # Run the Jest test suite
   npm run preview      # Build and serve the production bundle locally
   ```

### Working offline

`npm run preview` builds the production bundle and serves it with Vite’s preview server. The command requires the dependencies
declared in `package.json`. If the packages are unavailable (for example, the environment blocks network access and `npm
install` cannot download them), the TypeScript compiler reports hundreds of errors such as "Cannot find module 'react'" or "JSX
element implicitly has type 'any'" and the command exits early. Ensure the dependencies are installed or vendored locally before
running the preview in an offline setting.

When developing offline with the production bundle, run the helper script before building:

```bash
scripts/install_offline_deps.sh
```

The script installs React, React Router, Dexie, Zod, and the Markdown toolchain from pre-downloaded npm tarballs. It first looks for packages inside `.npm-offline-cache/` (configurable via `LOCAL_CACHE_DIR`). If the cache is empty, it extracts `offline-deps.tar.gz` (override with `BUNDLED_TARBALL`) and installs from the bundled tarballs. Populate either location with the required package archives to complete the build without internet access.

### CDN fallback preview

If package installation is blocked entirely, open [`public/cdn-fallback.html`](public/cdn-fallback.html) directly in the browser. The page loads the prebuilt production bundle from the configured CDN (React, ReactDOM, and React Router are sourced from esm.sh) and renders a handful of lesson extracts fetched from the repository. Override the query parameters (`bundle`, `bundleBase`, `extractBase`, `paths`) to point at a different CDN host or set of extracts when necessary. This provides a quick visual smoke test without running `npm install` or Vite locally.

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
