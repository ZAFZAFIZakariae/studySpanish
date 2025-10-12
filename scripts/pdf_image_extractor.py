"""Utility functions for extracting images from PDF documents.

This module provides a CLI interface to extract embedded images and page-level
snapshots from PDF files. Extracted assets are stored beside the PDF inside a
folder named ``<PDF name>-images`` preserving the source directory structure.

The implementation relies on the :mod:`fitz` module (PyMuPDF). Install it with
``pip install PyMuPDF`` if it is not already available in your environment.
"""
from __future__ import annotations

import argparse
import logging
from pathlib import Path
from typing import Iterable, Optional, Set, Tuple

try:
    import fitz  # type: ignore
except ImportError as exc:  # pragma: no cover - import guard
    raise SystemExit(
        "PyMuPDF (fitz) is required for image extraction. Install it with 'pip install PyMuPDF'."
    ) from exc

LOGGER = logging.getLogger(__name__)


def _derive_output_dir(pdf_path: Path) -> Path:
    """Return the default directory for storing extracted images.

    The directory is created adjacent to the PDF file and suffixed with
    ``-images`` to avoid name collisions.
    """

    return pdf_path.with_name(f"{pdf_path.stem}-images")


def _save_pixmap(pixmap: "fitz.Pixmap", destination: Path) -> None:
    """Persist a :class:`fitz.Pixmap` to disk as a PNG file."""

    destination.parent.mkdir(parents=True, exist_ok=True)
    pixmap.save(destination, output="png")


def extract_images_from_pdf(
    pdf_path: Path,
    output_dir: Optional[Path] = None,
    include_page_snapshots: bool = True,
    deduplicate_images: bool = True,
) -> Tuple[int, int]:
    """Extract embedded images and optionally page snapshots from ``pdf_path``.

    Parameters
    ----------
    pdf_path:
        Path to the PDF file.
    output_dir:
        Target directory. If omitted, the folder ``<pdf stem>-images`` is used
        next to the PDF file.
    include_page_snapshots:
        When ``True`` (default), each page is rasterized and saved as a PNG to
        provide a faithful representation of complex layouts or vector figures.
    deduplicate_images:
        Skip saving duplicate embedded images referenced multiple times across
        pages (enabled by default).

    Returns
    -------
    Tuple[int, int]
        Counts of ``(embedded_images_saved, page_snapshots_saved)``.
    """

    pdf_path = pdf_path.expanduser().resolve()
    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF not found: {pdf_path}")

    destination_root = (output_dir or _derive_output_dir(pdf_path)).resolve()
    destination_root.mkdir(parents=True, exist_ok=True)

    doc = fitz.open(pdf_path)

    seen_images: Set[int] = set()
    embedded_count = 0
    page_snapshot_count = 0

    for page_index in range(len(doc)):
        page = doc.load_page(page_index)
        page_label = f"page_{page_index + 1:03d}"

        if include_page_snapshots:
            pixmap = page.get_pixmap(dpi=200)
            page_snapshot_path = destination_root / f"{pdf_path.stem}_{page_label}.png"
            _save_pixmap(pixmap, page_snapshot_path)
            LOGGER.debug("Saved page snapshot: %s", page_snapshot_path)
            page_snapshot_count += 1

        for img_index, img_info in enumerate(page.get_images(full=True), start=1):
            xref = img_info[0]
            if deduplicate_images and xref in seen_images:
                LOGGER.debug("Skipping duplicate image with xref %s", xref)
                continue

            try:
                base_image = doc.extract_image(xref)
            except ValueError:  # pragma: no cover - defensive programming
                LOGGER.warning("Unable to extract image with xref %s on page %s", xref, page_index)
                continue

            seen_images.add(xref)
            image_bytes = base_image["image"]
            ext = base_image.get("ext", "png")
            image_name = (
                f"{pdf_path.stem}_{page_label}_img_{img_index:03d}.{ext}"
            )
            image_path = destination_root / image_name
            image_path.write_bytes(image_bytes)
            LOGGER.debug("Saved embedded image: %s", image_path)
            embedded_count += 1

    doc.close()
    return embedded_count, page_snapshot_count


def build_arg_parser() -> argparse.ArgumentParser:
    """Create an argument parser for the CLI interface."""

    parser = argparse.ArgumentParser(description="Extract images from PDF files")
    parser.add_argument(
        "pdf",
        type=Path,
        help="Path to the PDF file to process",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=None,
        help="Optional directory to store extracted images",
    )
    parser.add_argument(
        "--no-page-snapshots",
        action="store_true",
        help="Disable saving full-page PNG snapshots.",
    )
    parser.add_argument(
        "--no-deduplicate",
        action="store_true",
        help="Store duplicate embedded images even when reused across pages.",
    )
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable debug logging output.",
    )
    return parser


def main(args: Optional[Iterable[str]] = None) -> Tuple[int, int]:
    """CLI entry point for extracting images from a PDF file."""

    parser = build_arg_parser()
    parsed = parser.parse_args(args=args)

    logging.basicConfig(level=logging.DEBUG if parsed.verbose else logging.INFO)

    embedded, snapshots = extract_images_from_pdf(
        parsed.pdf,
        output_dir=parsed.output,
        include_page_snapshots=not parsed.no_page_snapshots,
        deduplicate_images=not parsed.no_deduplicate,
    )

    LOGGER.info(
        "Extraction complete: %s embedded images, %s page snapshots saved.",
        embedded,
        snapshots,
    )

    return embedded, snapshots


if __name__ == "__main__":  # pragma: no cover - CLI usage
    main()
