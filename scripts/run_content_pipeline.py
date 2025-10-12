#!/usr/bin/env python3
"""Automate the study material extraction pipeline before launching the app."""
from __future__ import annotations

import shutil
import sys
import os
from pathlib import Path
from typing import Sequence

ROOT = Path(__file__).resolve().parents[1]
SUBJECTS_DIR = ROOT / "subjects"


def _log(message: str) -> None:
    print(f"[pipeline] {message}")


def _refresh_pdf_images() -> None:
    if os.environ.get("SKIP_IMAGE_REFRESH") == "1":
        _log("Skipping PDF imagery refresh (SKIP_IMAGE_REFRESH=1).")
        return

    try:
        from pdf_image_extractor import extract_images_from_pdf
    except SystemExit as exc:
        raise SystemExit(
            "PyMuPDF (fitz) is required to extract PDF imagery. Install it with 'pip install PyMuPDF'."
        ) from exc
    except ImportError as exc:  # pragma: no cover - defensive guard
        raise SystemExit("Unable to import the PDF image extractor module.") from exc

    pdf_files = sorted(SUBJECTS_DIR.rglob("*.pdf"))
    if not pdf_files:
        _log("No PDF files found under subjects/; skipping image refresh.")
        return

    for pdf_path in pdf_files:
        images_dir = pdf_path.with_name(f"{pdf_path.stem}-images")
        if images_dir.exists():
            shutil.rmtree(images_dir)
        embedded, snapshots = extract_images_from_pdf(pdf_path)
        relative = pdf_path.relative_to(SUBJECTS_DIR)
        _log(
            f"Processed {relative} ({embedded} embedded images, {snapshots} page snapshots)."
        )


def _run_text_extraction(argv: Sequence[str] | None = None) -> int:
    from extract_subject_texts import main as extract_main

    return extract_main(argv)


def main(argv: Sequence[str] | None = None) -> int:
    if not SUBJECTS_DIR.exists():
        _log("subjects/ directory not found; skipping automatic extraction.")
        return 0

    _log("Refreshing PDF imagery...")
    _refresh_pdf_images()

    _log("Generating text extracts...")
    exit_code = _run_text_extraction(argv)
    if exit_code == 0:
        _log("Content pipeline finished successfully.")
    else:
        _log(f"Content pipeline exited with status {exit_code}.")
    return exit_code


if __name__ == "__main__":
    sys.exit(main())
