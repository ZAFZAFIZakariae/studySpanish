# Study Compass Web App Evaluation

**Date:** 2024-05-14

## Overall score: 6.5 / 10

The product delivers a deep feature set for lesson study, analytics, and resource translation, but several operational blockers and UX gaps keep it from feeling production ready. Major deductions come from the development tooling failing out-of-the-box, heavy production bundles, and critical workflows that depend on manual database seeding.

### Score breakdown
| Area | Score | Notes |
| --- | --- | --- |
| Setup & Tooling | 5 / 10 | Local dev crashes because the predev pipeline requires PyMuPDF; first run stops before Vite starts. Build succeeds once dependencies are installed, but chunk warnings signal bundle bloat. |
| Navigation & Accessibility | 7 / 10 | Skip link, focus mode, and high-contrast toggle are implemented, yet primary nav omits direct links to key study surfaces. |
| Learning Workflows | 7 / 10 | Lesson viewer, exercise engine, flashcard trainer, and analytics dashboard are robust, but all rely on Dexie data imports before anything renders. |
| Content Operations | 6 / 10 | Subject catalog and PDF tooling are thorough, yet extraction and saving flows hinge on external services and manual asset pipelines. |
| Feedback & Reporting | 7 / 10 | CSV exports, sharing flows, and session logs give helpful insights, though some warnings remain unresolved in the automated test suite. |

## Detailed findings

### 1. Setup & Tooling (5 / 10)
- `npm run dev` invokes `scripts/run_content_pipeline.py` which exits early unless PyMuPDF is installed (`pip install PyMuPDF`). No fallback exists, so the dev server never boots in a clean clone. This is a release blocker for contributors who do not have the native dependency preinstalled.
- After installing dependencies (`npm install`), `npm run build` succeeds, but Vite emits 500 kB+ chunk warnings showing the need for code splitting.

### 2. Navigation & Accessibility (7 / 10)
- The shell provides skip-navigation, focus mode, and a persistent high-contrast toggle stored in IndexedDB.
- The main nav exposes Home, Parameters, and Subject PDFs, but omits direct access to Spanish lessons, Dashboard, Flashcards, and Content Manager, forcing extra clicks via the homepage or parameters hub.

### 3. Learning Workflows (7 / 10)
- Spanish library groups lessons by CEFR level with empty/loading states, but nothing renders until lessons are imported into Dexie (`db.lessons`).
- Lesson page combines markdown rendering, exercise grading, and mastery analytics. Session logs update live, yet all depend on seeded exercises/grades; otherwise users hit “No exercises found.”
- Flashcard trainer supports keyboard shortcuts, audio playback, and spaced repetition updates with Dexie persistence. Without preloaded decks the experience is empty, highlighting the need for guided imports.

### 4. Content Operations (6 / 10)
- Subjects hub calculates progress, translation readiness, and links to resource PDFs. However, PDF preview buttons depend on precomputed text extracts; missing extracts disable the feature with no recovery guidance.
- Subject PDF browser can request `/api/extract` and `/api/save-extract`, but these require the Express server and the external extractor module, adding operational overhead.
- Content manager validates bundles and diffs lessons/exercises/flashcards before import, yet users must manually obtain the bundle; no automated fetch exists.

### 5. Feedback & Reporting (7 / 10)
- Dashboard subscribes to Dexie changes, exports CSV reports, and provides clipboard/share integrations. Lack of seeded data reduces its utility to placeholder alerts.
- Jest suite passes but logs React Router future-flag warnings; these should be quieted before release.

## Recommendations
1. **Unblock local development.** Document or wrap the PyMuPDF requirement so `npm run dev` succeeds without manual installs.
2. **Bundle hygiene.** Investigate code splitting or asset lazy loading to resolve Vite chunk warnings.
3. **First-run experience.** Ship a guided seed/import flow or starter bundle so key pages showcase content immediately.
4. **Navigation polish.** Add direct links in the primary nav to Spanish lessons, Dashboard, Flashcards, and Content Manager.
5. **Stabilize tests.** Address React Router deprecation warnings to keep the CI log clean.
