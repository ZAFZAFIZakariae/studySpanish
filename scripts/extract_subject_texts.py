#!/usr/bin/env python3
"""Extract text snippets for every asset stored under ``subjects/``.

The script walks the source ``subjects`` directory, extracts textual content
where possible, and saves the normalised output into
``src/data/subjectExtracts``. Each generated ``.txt`` file mirrors the
relative path of the original asset so downstream tooling can provide in-app
previews or search across the raw course materials.
"""
from __future__ import annotations

import json
import re
import sys
import zipfile
from dataclasses import dataclass
from io import StringIO
from pathlib import Path
from typing import Callable

from docx import Document  # type: ignore
from openpyxl import load_workbook  # type: ignore
from pptx import Presentation  # type: ignore
from pypdf import PdfReader
import xlrd  # type: ignore

ROOT = Path(__file__).resolve().parents[1]
SUBJECTS_DIR = ROOT / "subjects"
OUTPUT_DIR = ROOT / "src" / "data" / "subjectExtracts"


@dataclass
class ExtractionResult:
    text: str
    notes: list[str]


def _normalise_whitespace(text: str) -> str:
    """Collapse noisy whitespace while preserving intentional spacing."""
    cleaned = re.sub(r"\r\n?", "\n", text)
    cleaned = re.sub(r"[\t\u00a0]+", " ", cleaned)
    cleaned = re.sub(r"\u200b", "", cleaned)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    cleaned = re.sub(r"[ \t]+\n", "\n", cleaned)
    return cleaned.strip()


def extract_pdf(path: Path) -> ExtractionResult:
    reader = PdfReader(path)
    pieces: list[str] = []
    for index, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        text = text.strip()
        if text:
            pieces.append(f"### Page {index}\n{text}")
    if not pieces:
        return ExtractionResult(
            "[No text content extracted]",
            ["PDF parser returned no text; file may be scanned images."],
        )
    return ExtractionResult("\n\n".join(pieces), [])


def extract_ipynb(path: Path) -> ExtractionResult:
    data = json.loads(path.read_text(encoding="utf-8"))
    parts: list[str] = []
    for index, cell in enumerate(data.get("cells", []), start=1):
        cell_type = cell.get("cell_type", "unknown")
        header = f"### Cell {index} · {cell_type.title()}"
        source = "".join(cell.get("source", []))
        if cell_type == "code":
            source = source.rstrip()
            parts.append(f"{header}\n```python\n{source}\n```")
        else:
            parts.append(f"{header}\n{source}")
    if not parts:
        return ExtractionResult("[Notebook contains no cells]", [])
    return ExtractionResult("\n\n".join(parts), [])


def extract_text_file(path: Path) -> ExtractionResult:
    return ExtractionResult(path.read_text(encoding="utf-8", errors="replace"), [])


def extract_url(path: Path) -> ExtractionResult:
    content = path.read_text(encoding="utf-8", errors="replace")
    return ExtractionResult(content.strip(), [])


def extract_presentation(path: Path) -> ExtractionResult:
    presentation = Presentation(path)
    pieces: list[str] = []
    for slide_number, slide in enumerate(presentation.slides, start=1):
        slide_parts: list[str] = []
        for shape in slide.shapes:
            if getattr(shape, "has_text_frame", False):
                text = shape.text.strip()
                if text:
                    slide_parts.append(text)
            if getattr(shape, "has_table", False):
                rows = []
                for row in shape.table.rows:
                    cells = [cell.text.strip() for cell in row.cells]
                    if any(cells):
                        rows.append(" | ".join(cells))
                if rows:
                    slide_parts.append("Table:\n" + "\n".join(rows))
        if slide_parts:
            pieces.append(f"### Slide {slide_number}\n" + "\n\n".join(slide_parts))
    if not pieces:
        return ExtractionResult("[No text content extracted from presentation]", [])
    return ExtractionResult("\n\n".join(pieces), [])


def extract_excel_xlsx(path: Path) -> ExtractionResult:
    workbook = load_workbook(path, data_only=True, read_only=True)
    buffer = StringIO()
    for sheet in workbook.worksheets:
        buffer.write(f"### Sheet: {sheet.title}\n")
        for row in sheet.iter_rows(values_only=True):
            values = ["" if value is None else str(value) for value in row]
            if any(value.strip() for value in values):
                buffer.write("\t".join(values))
                buffer.write("\n")
        buffer.write("\n")
    text = buffer.getvalue().strip()
    if not text:
        return ExtractionResult("[No cell content extracted from workbook]", [])
    return ExtractionResult(text, [])


def extract_excel_xls(path: Path) -> ExtractionResult:
    workbook = xlrd.open_workbook(path)
    buffer = StringIO()
    for sheet in workbook.sheets():
        buffer.write(f"### Sheet: {sheet.name}\n")
        for row_index in range(sheet.nrows):
            row_values = [sheet.cell_value(row_index, col_index) for col_index in range(sheet.ncols)]
            formatted = ["" if value in ("", None) else str(value) for value in row_values]
            if any(value.strip() for value in formatted):
                buffer.write("\t".join(formatted))
                buffer.write("\n")
        buffer.write("\n")
    text = buffer.getvalue().strip()
    if not text:
        return ExtractionResult("[No cell content extracted from workbook]", [])
    return ExtractionResult(text, [])


def extract_docx(path: Path) -> ExtractionResult:
    document = Document(path)
    parts = [para.text for para in document.paragraphs if para.text.strip()]
    for table in document.tables:
        for row in table.rows:
            cells = [cell.text.strip() for cell in row.cells]
            if any(cells):
                parts.append(" | ".join(cells))
    if not parts:
        return ExtractionResult("[No text extracted from document]", [])
    return ExtractionResult("\n".join(parts), [])


def extract_archimate(path: Path) -> ExtractionResult:
    notes: list[str] = []
    pieces: list[str] = []
    try:
        with zipfile.ZipFile(path) as archive:
            for name in sorted(archive.namelist()):
                if not name.lower().endswith((".xml", ".txt")):
                    continue
                data = archive.read(name).decode("utf-8", errors="replace")
                pieces.append(f"### {name}\n{data.strip()}")
    except zipfile.BadZipFile:
        notes.append("ArchiMate file is not a ZIP archive; storing binary notice instead.")
    if not pieces:
        return ExtractionResult("[No textual XML resources extracted]", notes)
    return ExtractionResult("\n\n".join(pieces), notes)


def extract_png(path: Path) -> ExtractionResult:
    return ExtractionResult("[Binary image file – no textual content extracted]", [])


def extract_generic(path: Path) -> ExtractionResult:
    return ExtractionResult(f"[Unsupported file type: {path.suffix}]", [])


EXTRACTORS: dict[str, Callable[[Path], ExtractionResult]] = {
    ".pdf": extract_pdf,
    ".ipynb": extract_ipynb,
    ".txt": extract_text_file,
    ".sql": extract_text_file,
    ".url": extract_url,
    ".pptx": extract_presentation,
    ".ppsx": extract_presentation,
    ".xlsx": extract_excel_xlsx,
    ".xls": extract_excel_xls,
    ".docx": extract_docx,
    ".archimate": extract_archimate,
    ".png": extract_png,
}


def extract_file(path: Path) -> ExtractionResult:
    extractor = EXTRACTORS.get(path.suffix.lower())
    if extractor is None:
        return extract_generic(path)
    try:
        return extractor(path)
    except Exception as error:  # noqa: BLE001 - pipeline must be resilient
        return ExtractionResult(
            text=f"[Failed to extract content: {error}]",
            notes=[f"Extraction error for {path.name}: {error}"],
        )


def build_header(relative_path: Path, notes: list[str]) -> str:
    header_lines = [
        "# Extracted content",
        f"Source: subjects/{relative_path.as_posix()}",
    ]
    if notes:
        header_lines.append("Notes:")
        header_lines.extend(f"- {note}" for note in notes)
    return "\n".join(header_lines) + "\n\n"


def main() -> int:
    if not SUBJECTS_DIR.exists():
        print("Subjects directory not found.", file=sys.stderr)
        return 1

    written = 0
    for source in sorted(SUBJECTS_DIR.rglob("*")):
        if not source.is_file():
            continue
        relative = source.relative_to(SUBJECTS_DIR)
        output_path = OUTPUT_DIR / relative.with_suffix(".txt")
        output_path.parent.mkdir(parents=True, exist_ok=True)

        result = extract_file(source)
        header = build_header(relative, result.notes)
        content = header + _normalise_whitespace(result.text)
        output_path.write_text(content + "\n", encoding="utf-8")
        written += 1

    print(f"Extracted {written} files into {OUTPUT_DIR.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
