# Diseño de Bases de Datos — Laboratorio SQL Performance Cheat Paper

> English-first optimisation playbook for DBD-204 with Spanish cues for reporting.

## Lab summary
- **Focus areas:** baseline capture, indexing strategies, query tuning, benchmarking, bilingual reporting.
- **Outcomes:** consistent lab submissions, reproducible experiments, clear communication with Spanish-speaking evaluators.

## Preparation & baselines
- **Environment checklist:** PostgreSQL 15, `pg_stat_statements`, query visualiser. Document installation commands in English, add Spanish annotation for labs.
- **Baseline capture:**
  - Run provided `baseline.sql` script and export metrics table (execution time, buffers hit, CPU ms).
  - Store results in the bilingual log (`logs/baseline.csv` + `registros/baseline-es.csv`).
  - Screenshot execution plans, label sections (Seq Scan / Escaneo Secuencial).
- **Data integrity:** verify row counts, constraints, and indexes before modifications. Note Spanish translation for constraint errors.

## Indexing & tuning drills
- **Index cookbook:**
  - B-tree composite indexes for high-selectivity filters.
  - Partial indexes for status columns; include `WHERE status = 'ACTIVE'` + Spanish comment.
  - Covering indexes using `INCLUDE` clause.
- **Plan analysis:**
  - Use `EXPLAIN (ANALYZE, BUFFERS)` to compare before/after metrics.
  - Track changes in `cost`, `rows`, `loops`. Translate key metrics (`buffers`) in notes.
- **Query rewrites:** leverage CTEs, window functions, and query refactoring (e.g., `EXISTS` vs `IN`). Document reasoning in English with Spanish summary line.

## Reporting & bilingual delivery
- **Lab report template:** introduction, methodology, results table, discussion, appendix with SQL snippets.
- **Metrics table:** include columns for baseline vs optimised metrics, improvement percentage, commentary. Provide Spanish translation for table headers.
- **Oral playback:** prepare 3-minute English overview plus 1-minute Spanish summary focusing on KPIs and lessons learned.
- **Repository hygiene:** commit SQL scripts with English README, add Spanish footnotes explaining dataset context.

## Study guidance
- Timebox each lab step using the included planner (baseline 30m, indexing 40m, reporting 30m).
- Rerun baselines weekly to understand drift and highlight improvements.
- Practice explaining each optimisation to a non-technical stakeholder in Spanish to ensure clarity.

## Appendix
- **Appendix A:** `metrics-template.xlsx` with bilingual headers.
- **Appendix B:** sample screenshots with annotations in both languages.
- **Appendix C:** glossary of performance terms (cache hit ratio, plan stability) with Spanish equivalents.
