# Study Hub Expansion Roadmap

## Vision
Create a bilingual study hub that unifies Spanish and English learning materials across every subject. The app should let an English-dominant student manage university courses, labs, and language practice in one workflow: discover materials, translate where needed, review flashcards, and track progress across disciplines.

## Guiding Principles
- **Single source of truth** – consolidate lessons, course files, and lab resources using one schema so the dashboard, flashcards, and analytics always stay in sync.
- **Language accessibility** – surface English-first summaries and smart translations for Spanish-only content without mutating the original source.
- **Modular study flows** – let subjects, courses, labs, and micro-lessons plug into the same scheduling, tagging, and flashcard systems.
- **Offline-first** – preserve the existing caching/import pipeline so materials remain available offline.

## User Journeys
1. **Plan a study session**: pick a subject → choose a course or lab module → review upcoming tasks and flashcards → launch exercises or reference documents.
2. **Translate Spanish materials**: open a Spanish PDF/lesson → see auto-generated English outline → toggle inline translations for paragraphs, keywords, and diagrams.
3. **Track progress**: view a unified dashboard showing mastery per subject, overdue labs, and vocabulary gaps to prioritise the next session.

## Information Architecture
- **Subjects directory**: wrap each folder in `subjects/` with metadata (`subject.json`) describing title, language profile, credits, and related skills.
- **Course & lab entities**: within each subject, store `courses/` and `labs/` directories containing lesson bundles, worksheets, and assessments. Link each lesson to flashcard decks and prerequisite tags.
- **Resource types**:
  - `lessons/` – structured markdown or JSON (re-using the `SeedBundle` schema) for concept explanations.
  - `readings/` – PDFs, slides, or links augmented with extracted outlines and glossary metadata.
  - `assignments/` – task objects with due dates, status, and submission artefacts.
  - `flashcards/` – spaced-repetition decks tied to subjects, automatically federated into the global trainer.
- **Cross-cutting tags**: standardise taxonomy (e.g., "databases", "microservices", "ethics") for search, analytics, and recommendations.

## App Structure Updates
- **Navigation**: extend the AppShell with a "Subjects" hub listing all subjects plus quick filters (language, type, due soon). Each subject page summarises courses, labs, and resources.
- **Dashboard**: augment analytics with subject-level metrics (credit weight, completion, flashcard health, assignment urgency) and highlight cross-subject blockers.
- **Lesson/Resource viewer**: add a universal viewer capable of rendering markdown, JSON lessons, and annotated PDFs with translation overlays, note-taking, and offline caching.
- **Flashcards**: scope decks by subject while keeping a combined review queue. Allow filtering by subject, language, or difficulty during a session.
- **Content Manager**: upgrade import/validation to support subject bundles (metadata + resources + translations). Provide progress indicators for large uploads and allow diffing existing subjects.

## Language Support
- **Metadata layer**: store English summaries, glossaries, and key questions alongside original Spanish texts so UI can show bilingual cards.
- **On-demand translation**: integrate a translation service (API or local model) invoked when a user opens a Spanish resource, caching outputs for offline reuse.
- **Terminology synchronisation**: maintain a bilingual terminology database to keep flashcards, notes, and course materials aligned across languages.
- **Pronunciation aids**: reuse current audio tooling (if any) or add TTS snippets for critical vocabulary within non-language subjects taught in Spanish.

## Study Workflows
- **Session planner**: combine calendar deadlines, flashcard scheduling, and energy levels to recommend next tasks across subjects.
- **Lab companion**: for hands-on labs, provide checklists, environment setup snippets, and quick-switch notes/translations.
- **Reflection log**: capture daily summaries tagged by subject, generating future review prompts and adjusting spaced-repetition weights.

## Analytics & Progress Tracking
- Expand mastery metrics to include subject completion %, assignment status, and translation confidence (how often the student switches to English aids).
- Visualise cognitive load by showing time spent per language, upcoming workload, and flashcard streaks across subjects.
- Provide export options (e.g., CSV, Notion sync) for academic advisors or self-reporting.

## Phased Implementation
1. **Foundation (Week 1-2)**
   - Define subject/course/lab schemas and seed initial metadata for existing folders.
   - Update dashboard navigation to surface subjects and load stub subject pages.
   - Ensure content manager can register new schemas without breaking current Spanish lessons.
2. **Language Layer (Week 3-4)**
   - Build translation metadata pipeline (auto summaries + glossary extraction).
   - Add bilingual toggles to lesson viewer and flashcards.
3. **Workflow Enhancements (Week 5-6)**
   - Implement session planner and assignment tracking UI.
   - Enhance analytics with subject-level charts and overdue alerts.
4. **Refinement (Week 7+)**
   - Integrate lab companion features, offline caching improvements, and optional voice/pronunciation aids.
   - Gather feedback, polish accessibility, and iterate on high-contrast and keyboard flows.

## Success Metrics
- All subjects accessible with English guidance in ≤2 clicks.
- ≥90% of Spanish resources include English summaries and glossary entries.
- Dashboard highlights overdue assignments or labs at least 3 days in advance.
- Flashcard completion rate improves by 20% thanks to cross-subject scheduling.

## Risks & Mitigations
- **Translation accuracy**: mitigate by allowing manual edits and flagging low-confidence segments.
- **Content sprawl**: enforce tagging and metadata validation during imports.
- **Performance**: lazy-load heavy PDFs and cache translation outputs per resource.
- **User adoption**: provide onboarding tours showing how to manage subjects and switch languages.

## Next Steps
- Audit current `subjects/` folders, map contents to the new schema, and identify translation needs.
- Prototype subject hub UI with existing data to validate navigation and performance.
- Define integration strategy for translation services (API keys, rate limits, offline fallback).
