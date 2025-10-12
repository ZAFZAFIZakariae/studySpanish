# Pipeline Verification – PDF Extraction

_Date: 2025-10-12_

## App smoke check
- Started the Vite dev server with `npm run dev -- --host`.
- Confirmed the Study Spanish Coach home page renders without console errors.

## PDF extraction spot checks
Executed `scripts/extract_subject_texts.py` in single-PDF mode for three representative files. For each run I captured the first page excerpt from the pipeline's JSON output and compared it with text read directly from the source PDF using `pypdf.PdfReader`.

| PDF | Pipeline excerpt | Direct PDF excerpt | Images exported |
| --- | --- | --- | --- |
| `subjects/Dbd/Teoria/Tema 1/tema1_DBD.pdf` | `Diseño y Gestión de Bases de Datos` … `Profesores: Laura Mota y Pedro Valderas` | Same header lines retrieved via `PdfReader` | 8 |
| `subjects/Sad/Session_2_Microservices_Bullets_Notes.pdf` | `Microservices: Definition, Benefits, and Trade-Offs` … | Matching text (with identical warnings about "wrong pointing object" references) | 33 |
| `subjects/snlp/slides/Chapter 1.pdf` | `CHAPTER 1 Introduction to Signals and Natural Language Processing with DL` | Same leading section extracted from the PDF | 0 |

### Observations
- The extraction pipeline returns structured Markdown with per-page headings and embeds local PNG references when figures are present.
- The JSON metadata reports the expected number of page images for slides that contain figures; pure-text PDFs produce zero image entries.
- Direct reads from the original PDFs match the pipeline's excerpts, confirming the text layer is captured faithfully even when the parser logs non-fatal warnings.

### Overall assessment
- **Rating:** 8/10. The pipeline reproduced the sampled PDFs accurately and exported the expected image assets, but the score stops short of a perfect mark because the spot checks only cover a small subset of subjects and rely on manual comparison.
- **What's missing for 10/10:** Automation that exercises the full corpus (including edge-case PDFs with complex layouts) and produces machine-comparable diff artifacts. Until those broader, repeatable checks are in place, the confidence level remains high but not absolute.
