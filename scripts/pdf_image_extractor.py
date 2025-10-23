"""Utilities for extracting images from PDF files.

This module uses PyMuPDF (``fitz``) to iterate through the pages of a PDF and
export embedded images (and, when necessary, page-level snapshots) to a
subject-specific directory. It also provides a simple command-line interface so
that the script can be executed directly via ``python pdf_image_extractor.py
<pdf-file-path>``.
"""

from __future__ import annotations

import argparse
import json
import shutil
from pathlib import Path
from typing import Iterable, List, Optional, Tuple

try:
    import fitz  # PyMuPDF
except ImportError as exc:  # pragma: no cover - import guard
    raise SystemExit(
        "PyMuPDF (fitz) is required for pdf_image_extractor. Install it via 'pip install pymupdf'."
    ) from exc


def _disable_mupdf_diagnostics() -> None:
    """Attempt to silence noisy MuPDF diagnostics printed to stderr."""

    tools = getattr(fitz, "TOOLS", None)
    if tools is None:
        return

    try:
        # Newer versions of PyMuPDF expose ``mupdf_display_errors`` which can
        # completely silence diagnostic output.  Older versions may lack this
        # API, so guard the call defensively.
        disable_errors = getattr(tools, "mupdf_display_errors", None)
        if callable(disable_errors):
            disable_errors(False)

        # ``mupdf_log_level`` was introduced in PyMuPDF 1.21.0.  When
        # available, bumping the log level to ``50`` (critical only) ensures
        # low-severity warnings are not emitted even if error display remains
        # enabled.
        set_log_level = getattr(tools, "mupdf_log_level", None)
        if callable(set_log_level):
            try:
                # ``fitz.CS_WARN`` was renamed to ``fitz.ERROR`` in later
                # releases; fall back to the numeric literal to avoid
                # attribute errors across versions.
                CRITICAL_LEVEL = getattr(fitz, "ERROR", None) or getattr(fitz, "CS_WARN", None) or 50
            except Exception:  # pragma: no cover - extremely defensive
                CRITICAL_LEVEL = 50
            set_log_level(CRITICAL_LEVEL)
    except Exception:  # pragma: no cover - diagnostics should never break extraction
        # If anything goes wrong we silently ignore it so the extractor can
        # continue operating; the worst case is that MuPDF warnings remain
        # visible, which mirrors the previous behaviour.
        return


_disable_mupdf_diagnostics()


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


def _prepare_output_dir(output_dir: Path) -> None:
    """Ensure ``output_dir`` exists and is empty."""

    if output_dir.exists():
        shutil.rmtree(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)


def _extract_images_from_page(
    document: "fitz.Document", page_index: int, output_dir: Path, pdf_stem: str
) -> List[Metadata]:
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
        extension = str(extracted.get("ext", "png") or "png").lower()
        filename = f"{pdf_stem}_page_{page_index + 1:03d}_img_{image_counter:03d}.{extension}"
        image_counter += 1

        output_path = output_dir / filename
        with output_path.open("wb") as image_file:
            image_file.write(image_bytes)

        metadata.append((page_index + 1, filename))

    return metadata


def _export_page_snapshot(
    document: "fitz.Document", page_index: int, output_dir: Path, pdf_stem: str
) -> Optional[Metadata]:
    """Render a full-page snapshot when no embedded images are present."""

    page = document[page_index]

    try:
        pixmap = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # ~144 DPI snapshot
    except Exception:
        return None

    filename = f"{pdf_stem}_page_{page_index + 1:03d}.png"
    output_path = output_dir / filename

    try:
        pixmap.save(output_path)
    except Exception:
        return None

    return page_index + 1, filename


def _collect_images(
    document: "fitz.Document", output_dir: Path, pdf_stem: str
) -> Tuple[List[Metadata], int, int]:
    metadata: List[Metadata] = []
    embedded_total = 0
    snapshot_total = 0

    for page_index in range(document.page_count):
        page_metadata = _extract_images_from_page(document, page_index, output_dir, pdf_stem)
        if page_metadata:
            embedded_total += len(page_metadata)
            metadata.extend(page_metadata)
            continue

        snapshot = _export_page_snapshot(document, page_index, output_dir, pdf_stem)
        if snapshot is None:
            continue

        metadata.append(snapshot)
        snapshot_total += 1

    return metadata, embedded_total, snapshot_total


def _run_extraction(pdf_file: Path, output_dir: Path) -> Tuple[List[Metadata], int, int]:
    document = fitz.open(pdf_file)
    try:
        return _collect_images(document, output_dir, pdf_file.stem)
    finally:
        document.close()


def extract_images(pdf_file: Path, output_dir: Optional[Path] = None) -> List[Metadata]:
    """Extract images from ``pdf_file`` and return metadata.

    Metadata tuples contain the 1-based page number and the saved filename
    relative to the output directory.
    """

    if not pdf_file.exists():
        raise FileNotFoundError(f"PDF file not found: {pdf_file}")

    if output_dir is None:
        output_dir = _resolve_output_dir(pdf_file)

    _prepare_output_dir(output_dir)

    metadata, _, _ = _run_extraction(pdf_file, output_dir)
    return metadata


def extract_images_from_pdf(pdf_file: Path) -> Tuple[int, int]:
    """Extract embedded images and page snapshots for ``pdf_file``.

    Returns a tuple ``(embedded_count, snapshot_count)`` describing how many
    embedded images and fallback page snapshots were written to disk.
    """

    if not pdf_file.exists():
        raise FileNotFoundError(f"PDF file not found: {pdf_file}")

    output_dir = _resolve_output_dir(pdf_file)
    _prepare_output_dir(output_dir)

    _, embedded_total, snapshot_total = _run_extraction(pdf_file, output_dir)
    return embedded_total, snapshot_total


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

    output_dir = args.output or _resolve_output_dir(args.pdf_file)
    _prepare_output_dir(output_dir)

    metadata, embedded_total, snapshot_total = _run_extraction(args.pdf_file, output_dir)

    result = {
        "pdf": str(args.pdf_file),
        "output_dir": str(output_dir),
        "images": [
            {"page": page, "filename": filename}
            for page, filename in metadata
        ],
        "counts": {
            "embedded": embedded_total,
            "snapshots": snapshot_total,
        },
    }
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":  # pragma: no cover - CLI entry point
    raise SystemExit(_cli())
