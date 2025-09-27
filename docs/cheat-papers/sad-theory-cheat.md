# Software Architecture & Design — Theory & Decision Frameworks Cheat Paper

> English-first digest with Spanish anchors for the SAD-201 course. Keep this side-by-side with the Spanish slide decks when preparing ADRs or ATAM workshops.

## Quick course map
- **Lectures covered:** architectural styles, drivers, quality attribute tactics, ATAM, lightweight documentation.
- **Use cases:** preparing graded ADRs, facilitating scenario reviews, translating Spanish slides, refreshing vocabulary before exams.
- **Pair with:** `Architecture decision playbook` entry inside the Subjects hub for direct links and glossary refresh.

## Architecture foundations & drivers
### English checkpoints
- Compare **layered, hexagonal, microservices, and event-driven** styles. Note the default quality attributes they elevate and the trade-offs they incur (e.g., microservices = scalability & deployability, extra operational overhead).
- Capture **stakeholder drivers** using the *business goals → quality attributes → scenarios* cascade. Record metrics such as latency targets or resilience budgets alongside owner personas.
- Use the following ADR scaffold for every decision:
  1. **Context / Contexto** — business trigger, constraints, existing systems.
  2. **Decision / Decisión** — selected option + justification.
  3. **Status / Estado** — proposed, accepted, superseded.
  4. **Consequences / Consecuencias** — positive outcomes, risks, mitigations.

### Spanish anchors (resumen)
- Estilos: `capas`, `arquitectura hexagonal`, `microservicios`, `event-driven`. Atributos clave: `disponibilidad`, `mantenibilidad`, `time-to-market`.
- Drivers comunes: modernización ERP, cumplimiento regulatorio, expansión móvil.
- Mantén un glosario paralelo con términos como *bounded context*, *quality attribute scenario*, *stakeholder salience*.

## Quality tactics & documentation
- **Availability & reliability:** circuit breakers, health checks, redundancy, automated failover. Document *Mean Time To Recovery* (MTTR) en ambos idiomas.
- **Performance & scalability:** caching layers, CQRS, async messaging. Incluye métricas de throughput con notas en español.
- **Security & governance:** zero-trust, audit trails, secrets rotation. Añade responsables RACI en la ficha de control.
- **Documentation kit:**
  - Lightweight C4 diagrams (Context, Container, Component, Code) con etiquetas bilingües.
  - ADR catalog spreadsheet linking decision ID ↔ architectural view.
  - RACI matrix for stakeholder responsibilities around deployment, review, and compliance.

## Evaluation workflows
1. **ATAM Phase 0–1 (kick-off):** craft English agenda, share Spanish context brief, collect architectural drivers.
2. **Scenario brainstorming:** run silent brainwriting, sort by utility and risk; capture results in bilingual scenario table.
3. **Utility tree analysis:** assign importance/exposure scores, highlight trade-offs, produce heatmap.
4. **Risk prioritisation & report:** document sensitivity points, non-risks, and recommended actions. Provide Spanish executive summary.
5. **Decision follow-through:** track actions in backlog, update ADR status, schedule check-in for unresolved risks.

## Study routines
- Review one section before each lecture and flag vocabulary that still feels unfamiliar.
- Practice the ADR checklist in English, then translate the highlights into Spanish for submission.
- Pair tactics with real systems in your organisation or projects to build long-term memory cues.

## Reference tables
| Concept | English reminder | Spanish cue |
| --- | --- | --- |
| Quality attribute scenario | Stimulus → Environment → Response | Escenario de atributo de calidad |
| Availability tactic | Redundancy, graceful degradation | Redundancia, degradación controlada |
| ATAM outcome | Risks, sensitivity points, trade-offs | Riesgos, puntos sensibles, compromisos |

## Export & updates
- Full markdown lives in this repository: `docs/cheat-papers/sad-theory-cheat.md`.
- Mirror to your own Notion or PDF; update glossaries weekly.
- Track translation tweaks inside the Subjects hub to keep English and Spanish artefacts aligned.
