# Software Architecture & Design — Practical Microservices Lab Cheat Paper

> Your English-first lab runbook with Spanish callouts for the SAD-241 clinics. Use it alongside the Git repository and observability dashboards.

## Lab inventory
- **Labs covered:** monitoring stack, chaos drills, deployment rehearsal, documentation close-out.
- **What you get:** topology diagrams, command snippets, incident matrices, bilingual reporting templates.
- **Before you start:** duplicate this sheet, add environment URLs, and list teammates with guard duty roles.

## Environment & scaffolding
- **Service map:** API gateway ↔ auth ↔ order service ↔ payment worker ↔ event bus. Annotate each component with Spanish alias (`puerta de enlace`, `servicio de pedidos`).
- **Bootstrap steps:**
  1. Export `.env.example` → `.env` and translate sensitive key descriptions.
  2. `docker compose up --build` — verify Spanish logs for readiness cues ("Servicio listo").
  3. Seed sample data using `npm run seed` and document English summary of fixtures.
- **Sprint planning:** fill the bilingual user-story template: `Como operador...` / `As an operator...` with acceptance criteria.

## Observability & resilience drills
- **Instrumentation checklist:** enable OpenTelemetry collector, configure Prometheus scrape targets, map spans to business transactions. Record metrics dictionary (latency, throughput, error rate) in both languages.
- **Chaos routine:**
  - Introduce latency via `toxiproxy-cli toxic add order_service latency --latency 1200`.
  - Trigger pod restart and monitor circuit breaker behaviour; log findings in English.
  - Rollback plan: `kubectl rollout undo deployment/order-service` + Spanish annotation in incident doc.
- **Incident matrix:** severity vs. impact table with bilingual descriptors (`Severidad Alta`, `Customer checkout failed`). Include mitigation column referencing ADR IDs.

## Deployment & documentation
- **CI/CD flow:** lint → unit tests → contract tests → canary deploy → full rollout. Translate pipeline status messages.
- **Smoke checklist:** health endpoints, message queue depth, dashboard widgets, error budget remaining. Provide screenshots labelled English/Spanish.
- **Post-deploy doc:** append metrics summary, incident learnings, and backlog actions. Keep bilingual glossary for new components.

## Study and prep tips
- Run a dry rehearsal before live labs using the incident matrix to explore "what if" scenarios.
- Practice presenting monitoring insights in English to classmates; switch to Spanish for team retros.
- After each session, update vocabulary flashcards with any new Spanish infrastructure terms.

## Reference artifacts
| Topic | Resource | Notes |
| --- | --- | --- |
| Observability baseline | `docs/cheat-papers/sad-lab-cheat.md#observability--resilience-drills` | Copy metrics dictionary into your dashboard wiki. |
| Chaos scenarios | `scripts/chaos/` (repo) | Keep bilingual annotations in each script header. |
| Reporting | `exports/` folder | Attach PDF export plus Spanish appendix before submission. |

## Keep in sync
- Latest canonical version lives here. Update timestamps when lab instructions change.
- Cross-link this document from the Subjects hub cheat paper card for quick access.
