# Statistical NLP — Probabilistic Foundations Cheat Paper

> English-deep-dive notes with Spanish cues for SNLP-320 lecture series.

## Learning map
- **Units:** N-gram modelling, smoothing algorithms, machine translation architectures, evaluation metrics, research synthesis.
- **Goal:** explain theory in English while being ready to translate key insights to Spanish teammates or reports.

## N-gram modelling fundamentals
- **Definitions:** probability of word sequences, Markov assumption, chain rule derivations. Translate `conditional probability` → `probabilidad condicional`.
- **Smoothing comparison:**
  - *Add-k / Laplace* — simple bias, high perplexity for large vocabularies.
  - *Good-Turing* — reserve mass for unseen events, needs frequency-of-frequency table.
  - *Kneser-Ney* — absolute discounting, continuation probabilities. Include formulas and Spanish annotations.
- **Perplexity & cross-entropy:** formula reminders, interpretation as average branching factor. Provide example calculation.

## Machine translation & sequence models
- **Classical SMT:** IBM Models 1–5 summary, alignment probabilities, EM training steps.
- **Phrase-based models:** segmentation, phrase table, distortion model, feature weighting. Translate terms (`tabla de frases`, `modelo de distorsión`).
- **Sparse feature integration:** describe log-linear model, tuning with MERT/MIRA, include English explanation of each feature class with Spanish gloss.
- **Neural comparison:** encoder-decoder overview, attention mechanism cheat notes, highlight differences vs. SMT.

## Evaluation & error analysis
- **Automatic metrics:** BLEU (n-gram precision, brevity penalty), METEOR (precision, recall, alignment), TER. Provide bilingual definitions.
- **Human evaluation:** adequacy, fluency scales; include sample rubric lines in both languages.
- **Error taxonomy:** lexical, reordering, agreement, omission/addition. Add translation cues for each label.
- **Reporting template:** summary paragraph, score table, qualitative insights, improvement backlog.

## Study boosters
- Re-derive smoothing formulas weekly; explain the intuition aloud in English, then summarise in Spanish.
- Build flashcards for metric definitions with bilingual terms.
- Write a short Spanish abstract after each English research paper to ensure comprehension.

## Appendices
- **Appendix A:** formula sheet with bilingual annotations.
- **Appendix B:** sample BLEU calculation walkthrough.
- **Appendix C:** translation of frequent research vocabulary.
