#!/usr/bin/env python3
"""Merge all flashcard CSV files into a consolidated Anki export."""
from __future__ import annotations

import csv
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC_PATTERN = "src/seed/**/*-flashcards.csv"
OUTPUT = ROOT / "exports" / "d2-anki-export.csv"


def gather_rows() -> list[tuple[str, str, str]]:
    rows: list[tuple[str, str, str]] = []
    seen: set[tuple[str, str, str]] = set()
    for csv_path in sorted(ROOT.glob(SRC_PATTERN)):
        with csv_path.open(newline="", encoding="utf-8") as fh:
            reader = csv.DictReader(fh)
            for record in reader:
                front = (record.get("front") or "").strip()
                back = (record.get("back") or "").strip()
                tag = (record.get("tag") or "").strip()
                if not front or not back:
                    continue
                key = (front, back, tag)
                if key in seen:
                    continue
                seen.add(key)
                rows.append(key)
    rows.sort(key=lambda item: (item[2], item[0]))
    return rows


def write_output(rows: list[tuple[str, str, str]]) -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.writer(fh)
        writer.writerow(["front", "back", "tag"])
        writer.writerows(rows)


if __name__ == "__main__":
    write_output(gather_rows())
