"""Utilities for extracting images from PDF files.

This module uses PyMuPDF (fitz) to iterate through the pages of a PDF and
export embedded images to a subject-specific directory.  It also provides a
simple command-line interface so that the script can be executed directly via
``python pdf_image_extractor.py <pdf-file-path>``.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Iterable, List, Optional, Tuple

try:
    import fitz  # PyMuPDF
except ImportError as exc:  # pragma: no cover - import guard
    raise SystemExit(
        "PyMuPDF (fitz) is required for pdf_image_extractor. Install it via 'pip install pymupdf'."
    ) from exc


Metadata = Tuple[int, str]


def _resolve_output_dir(pdf_path: Path) -> Path:
    """Return the directory where extracted images should be saved.

    The preferred location is ``subjects/<subject>/<pdf-name>-images/`` when the
    PDF lives under a ``subjects/<subject>`` directory.  If the file resides
    elsewhere, the images are stored alongside the PDF in a sibling directory
    named ``<pdf-name>-images``.
    """

    parts = pdf_path.resolve().parts
    try:
        subjects_index = parts.index("subjects")
    except ValueError:
        return pdf_path.parent / f"{pdf_path.stem}-images"

    if subjects_index + 1 >= len(parts):
        return pdf_path.parent / f"{pdf_path.stem}-images"

    subject_dir = Path(*parts[: subjects_index + 2])
    return subject_dir / f"{pdf_path.stem}-images"


def _ensure_output_dir(output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)


def _extract_images_from_page(
    document: "fitz.Document", page_index: int, output_dir: Path, pdf_stem: str
) -> Iterable[Metadata]:
    page = document[page_index]
    images = page.get_images(full=True)
    if not images:
        return []

    metadata: List[Metadata] = []
    seen_xrefs = set()
    image_counter = 1

    for image_info in images:
        xref = image_info[0]
        if xref in seen_xrefs:
            continue
        seen_xrefs.add(xref)

        extracted = document.extract_image(xref)
        image_bytes = extracted["image"]
        extension = extracted.get("ext", "png")
        filename = f"{pdf_stem}_p{page_index + 1:03d}_img{image_counter}.{extension}"
        image_counter += 1

        output_path = output_dir / filename
        with output_path.open("wb") as image_file:
            image_file.write(image_bytes)

        metadata.append((page_index + 1, filename))

    return metadata


def extract_images(pdf_file: Path, output_dir: Optional[Path] = None) -> List[Metadata]:
    """Extract images from ``pdf_file`` and return metadata.

    Metadata tuples contain the 1-based page number and the saved filename
    relative to the output directory.
    """

    if not pdf_file.exists():
        raise FileNotFoundError(f"PDF file not found: {pdf_file}")

    if output_dir is None:
        output_dir = _resolve_output_dir(pdf_file)

    _ensure_output_dir(output_dir)

    document = fitz.open(pdf_file)
    metadata: List[Metadata] = []
    try:
        for page_index in range(document.page_count):
            metadata.extend(
                _extract_images_from_page(document, page_index, output_dir, pdf_file.stem)
            )
    finally:
        document.close()

    return metadata


def _cli(argv: Iterable[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Extract images from a PDF file.")
    parser.add_argument("pdf_file", type=Path, help="Path to the PDF file to process.")
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Optional explicit output directory. Defaults to subjects/<subject>/<pdf-name>-images/ when available.",
    )
    args = parser.parse_args(argv)

    metadata = extract_images(args.pdf_file, args.output)
    output_dir = args.output or _resolve_output_dir(args.pdf_file)

    result = {
        "pdf": str(args.pdf_file),
        "output_dir": str(output_dir),
        "images": [
            {"page": page, "filename": filename}
            for page, filename in metadata
        ],
    }
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":  # pragma: no cover - CLI entry point
    raise SystemExit(_cli())
