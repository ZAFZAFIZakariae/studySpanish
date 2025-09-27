# Statistical NLP — Corpus Labs Cheat Paper

> Operational field guide for SNLP-360 labs with bilingual commentary.

## Lab catalogue
- **Experiments covered:** NER on AnCora, POS tagging, language modelling, bias evaluation, poster project prep.
- **Outputs:** reproducible notebooks, evaluation tables, bilingual reflections, poster-ready summaries.

## Environment prep & datasets
- **Setup checklist:** Google Colab (GPU when available), spaCy, Hugging Face Transformers, fastText, scikit-learn. Document install commands and Spanish notes (e.g., `!pip install spacy==3.6 --quiet  # instalar spaCy`).
- **Dataset intake:** download AnCora, Europarl, WikiLingua. Record source, licensing, preprocessing steps with bilingual comments.
- **Data profiling:** compute token counts, entity distribution, label coverage. Use provided notebook cells and annotate key findings in Spanish.

## Model training routines
- **NER pipeline:**
  1. Load spaCy config, adjust hyperparameters (batch size, dropout). Provide recommended ranges.
  2. Train, evaluate, and save model artefacts; log metrics table.
  3. Translate key pipeline stages (`tokenizer`, `tagger`, `ner`) into Spanish for lab notes.
- **POS & language models:** highlight differences in objectives, include quick-start scripts, mention evaluation metrics (accuracy, perplexity).
- **Experiment tracking:** record seed, dataset split, hyperparameters, environment info. Append bilingual summary per run.

## Evaluation & reporting
- **Metric sheet:** precision, recall, F1, confusion matrices. Provide template table with English headers and Spanish subtitle.
- **Error analysis:** capture misclassified entities, category patterns, example sentences. Translate insights for Spanish wrap-up.
- **Poster/project prep:** outline sections (Motivation, Method, Results, Ethics). Provide bilingual bullet list for each section.

## Study habits
- Document experiments immediately; use the bilingual log to avoid translation gaps later.
- Present results to a peer in English, then summarise in Spanish to confirm retention.
- Iterate on experiments with small parameter tweaks to understand sensitivity.

## Appendices
- **Appendix A:** notebook template with bilingual comments.
- **Appendix B:** evaluation dashboard screenshot guide.
- **Appendix C:** glossary of corpus and modelling terminology.
