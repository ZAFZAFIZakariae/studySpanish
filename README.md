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
   npm run build         # Type-check and build the production bundle into dist/
   npm run test          # Run the Jest test suite
   npm run preview       # Serve preview.html without a build step (no npm deps required)
   npm run preview:vite  # Build + serve the Vite production bundle (requires dependencies)
   ```

### Working offline

`npm run preview` now launches a lightweight static server (`scripts/simple-serve.js`) that renders `preview.html`. The page is a high-fidelity mock built only with CDN-hosted assets, so it works even when `node_modules` is missing. Use this command whenever you need a quick visual smoke test but cannot download npm packages.

To run the full Vite preview (`npm run preview:vite`), the environment still needs access to React, React Router, Dexie, and the other dependencies declared in `package.json`. If the packages are unavailable (for example, the environment blocks network access and `npm install` cannot download them), the TypeScript compiler reports hundreds of errors such as "Cannot find module 'react'" or "JSX element implicitly has type 'any'" and the command exits early. Ensure the dependencies are installed or vendored locally before running the Vite preview in an offline setting.

When developing offline with the production bundle:

1. Populate the offline cache and install packages via the helper script:

   ```bash
   scripts/install_offline_deps.sh
   ```

2. Build the production bundle (this writes to `dist/`):

   ```bash
   npm run build
   ```

3. Serve the built app with Vite's preview server (append `-- --host` to expose it on your LAN):

   ```bash
   npm run preview:vite
   ```

The helper script installs React, React Router, Dexie, Zod, and the Markdown toolchain from pre-downloaded npm tarballs. It first looks for packages inside `.npm-offline-cache/` (configurable via `LOCAL_CACHE_DIR`). If the cache is empty, it extracts `offline-deps.tar.gz` (override with `BUNDLED_TARBALL`) and installs from the bundled tarballs. Populate either location with the required package archives to complete the build without internet access.

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

### Updating subject extracts

Subject text extracts now refresh automatically whenever you start the dev server, run the test suite, or build the app. The helper script `scripts/ensure-subject-extracts.mjs` scans `subjects/` for new, removed, or modified PDFs before `npm run dev`, `npm test`, and `npm run build`; when it spots a change, it invokes `python scripts/extract_subject_texts.py` to regenerate the derived files.

You can still trigger the refresh manually with `npm run ensure:subject-extracts` (or by running the Python extractor directly) if you need to update the extracts outside of the usual npm workflows. After the script finishes:

1. Confirm the new `.txt` files appear in `src/data/subjectExtracts/` alongside the existing extracts.
2. Open each generated file and ensure it begins with the header `Source: ...` that records the original location.
3. Verify the barrel file `src/data/subjectExtracts/index.ts` automatically imports the new entries (it is rebuilt by the extractor).

## Project structure

- `src/components/layout/AppShell.tsx` – shared layout and navigation shell.
- `src/pages/` – top-level routes for the dashboard, flashcards, content manager, and lessons.
- `src/components/` – reusable building blocks such as the dashboard, lesson viewer, and exercise engine.
- `src/lib/` – analytics, spaced-repetition, schemas, and grading utilities.

Happy studying! 🇪🇸
