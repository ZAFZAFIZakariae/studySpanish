# Diseño de Bases de Datos — Modelado relacional Cheat Paper

> English-oriented relational modelling reference for DBD-110 with Spanish terminology sidebars.

## Coverage
- **Topics:** requirements gathering, conceptual modelling, logical mapping, normalisation (1NF–BCNF), constraints, SQL patterns.
- **Use cases:** exam revision, ERD walkthroughs, quick translation when explaining diagrams to Spanish-speaking peers.

## Conceptual & logical design
- **Requirement capture:** interview notes → business rules → candidate entities/relationships. Document cardinality using both `1..*` and Spanish descriptions (`uno a muchos`).
- **Entity modelling:** include strong/weak entity examples, associative entities, inheritance patterns (`table per hierarchy`, `tabla por jerarquía`).
- **Logical mapping:** convert conceptual elements to relational schema, note naming conventions (English singular names with Spanish alias column).
- **Checklist:**
  - Validate primary keys (PK) and foreign keys (FK).
  - Ensure optionality matches business rules.
  - Prepare English narrative explaining each entity for viva voce.

## Normalisation toolkit
- **Normal forms cheat table:**
  - 1NF: atomic attributes, no repeating groups.
  - 2NF: remove partial dependencies on composite keys.
  - 3NF: remove transitive dependencies.
  - BCNF: determinants must be candidate keys.
- **Diagnostic steps:** identify functional dependencies, create dependency diagrams, test decomposition with lossless join.
- **Spanish hints:** `dependencia funcional`, `descomposición sin pérdida`, `atributo derivado`.
- **Exceptions:** document justified denormalisation (reporting tables, caching) with bilingual rationale.

## Constraints & SQL patterns
- **Constraint inventory:** PK, FK, UNIQUE, CHECK, NOT NULL, DEFAULT, plus trigger-based enforcement. Provide sample syntax with English comments and Spanish inline explanation.
- **Integrity scripts:** `ALTER TABLE` statements to add constraints post-creation, include translation of error messages.
- **Query patterns:** join templates, window functions, CTEs, set operations. Map each to Spanish phrasing (`funciones de ventana`).
- **Exam prep:** practise short-answer questions summarising when to use each constraint and the trade-offs.

## Study recommendations
- Redraw the library case ERD using the provided template, then explain it in English to ensure clarity.
- Work through normalisation exercises, annotating each step in Spanish to cement vocabulary.
- Teach a classmate the constraint section—if they understand it in English and Spanish, you have mastered it.

## Appendices
- **Appendix A:** sample bilingual ERD legend.
- **Appendix B:** functional dependency worksheet.
- **Appendix C:** SQL snippet library with translation notes.
