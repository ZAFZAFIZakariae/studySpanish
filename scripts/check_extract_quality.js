#!/usr/bin/env node
/**
 * Compare a PDF with its extracted text summary to spot missing pages or figures.
 *
 * Usage:
 *   node scripts/check_extract_quality.js path/to/source.pdf path/to/extract.txt
 *
 * Example:
 *   node scripts/check_extract_quality.js \
 *     subjects/Sad/Session_2_Microservices_Bullets_Notes.pdf \
 *     src/data/subjectExtracts/Sad/Session_2_Microservices_Bullets_Notes.txt
 */

const fs = require("fs");
const path = require("path");
async function loadPdfJs() {
  const module = await import("pdfjs-dist/legacy/build/pdf.mjs");
  return module.default ?? module;
}

function usage(message) {
  if (message) {
    console.error(message);
    console.error("");
  }
  console.error("Usage: node scripts/check_extract_quality.js <pdf> <extract.txt>");
  process.exit(1);
}

function resolveExistingPath(filePath, description) {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
    usage(`${description} not found: ${filePath}`);
  }
  return resolved;
}

async function getPdfPageCount(pdfPath) {
  const pdfjsLib = await loadPdfJs();
  const rawData = new Uint8Array(fs.readFileSync(pdfPath));
  const loadingTask = pdfjsLib.getDocument({ data: rawData });
  const pdfDocument = await loadingTask.promise;
  const pageCount = pdfDocument.numPages;
  if (typeof pdfDocument.destroy === "function") {
    await pdfDocument.destroy();
  }
  if (typeof loadingTask.destroy === "function") {
    loadingTask.destroy();
  }
  return pageCount;
}

function analyseExtract(content) {
  const lines = content.split(/\r?\n/);
  const headerPattern = /^###\s*Page\s+(\d+)/i;
  const imagePattern = /!\[[^\]]*\]\([^\)]+\)/g;
  const taggedImagePattern = /!\[Page\s+(\d+)[^\]]*\]\([^\)]+\)/i;

  const pageHeaders = [];
  const pageHeaderSet = new Set();
  const headerCounts = new Map();

  const imageReferences = [];
  const perPageImages = new Map();
  const untaggedImages = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    const headerMatch = headerPattern.exec(trimmed);
    if (headerMatch) {
      const pageNumber = Number(headerMatch[1]);
      pageHeaders.push(pageNumber);
      pageHeaderSet.add(pageNumber);
      headerCounts.set(pageNumber, (headerCounts.get(pageNumber) || 0) + 1);
      continue;
    }

    const matches = line.match(imagePattern);
    if (!matches) {
      continue;
    }
    for (const raw of matches) {
      imageReferences.push(raw);
      const tagMatch = raw.match(taggedImagePattern);
      if (tagMatch) {
        const pageNumber = Number(tagMatch[1]);
        perPageImages.set(pageNumber, (perPageImages.get(pageNumber) || 0) + 1);
      } else {
        untaggedImages.push(raw);
      }
    }
  }

  const duplicateHeaders = [];
  for (const [pageNumber, count] of headerCounts.entries()) {
    if (count > 1) {
      duplicateHeaders.push({ pageNumber, count });
    }
  }

  return {
    pageHeaders,
    pageHeaderSet,
    duplicateHeaders,
    imageReferences,
    perPageImages,
    untaggedImages,
  };
}

function buildPageCoverageReport(pageCount, pageHeaderSet, perPageImages) {
  const report = [];
  for (let page = 1; page <= pageCount; page += 1) {
    report.push({
      page,
      headerPresent: pageHeaderSet.has(page),
      imageCount: perPageImages.get(page) || 0,
    });
  }
  return report;
}

async function main() {
  const [, , pdfArg, extractArg] = process.argv;
  if (!pdfArg || !extractArg) {
    usage();
  }

  const pdfPath = resolveExistingPath(pdfArg, "PDF file");
  const extractPath = resolveExistingPath(extractArg, "Extract file");

  let pageCount;
  try {
    pageCount = await getPdfPageCount(pdfPath);
  } catch (error) {
    console.error(`Failed to read PDF: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }

  const extractContent = fs.readFileSync(extractPath, "utf8");
  const {
    pageHeaders,
    pageHeaderSet,
    duplicateHeaders,
    imageReferences,
    perPageImages,
    untaggedImages,
  } = analyseExtract(extractContent);

  const missingPages = [];
  for (let page = 1; page <= pageCount; page += 1) {
    if (!pageHeaderSet.has(page)) {
      missingPages.push(page);
    }
  }
  const extraHeaders = pageHeaders.filter((page) => page > pageCount);

  const coverage = buildPageCoverageReport(pageCount, pageHeaderSet, perPageImages);

  console.log("=== Extract Quality Report ===");
  console.log(`PDF: ${pdfPath}`);
  console.log(`Extract: ${extractPath}`);
  console.log("");
  console.log(`Pages in PDF: ${pageCount}`);
  console.log(`Page headers in extract: ${pageHeaders.length}`);
  if (missingPages.length === 0 && extraHeaders.length === 0) {
    console.log("Page coverage: ✔ All PDF pages accounted for.");
  } else {
    if (missingPages.length > 0) {
      console.log(`Missing page headers: ${missingPages.join(", ")}`);
    }
    if (extraHeaders.length > 0) {
      console.log(`Headers beyond PDF length: ${extraHeaders.join(", ")}`);
    }
  }
  if (duplicateHeaders.length > 0) {
    console.log(
      "Duplicate headers:" +
        duplicateHeaders
          .map(({ pageNumber, count }) => ` Page ${pageNumber} (x${count})`)
          .join(";")
    );
  }

  console.log("");
  console.log(`Markdown image references: ${imageReferences.length}`);
  const taggedImageTotal = [...perPageImages.values()].reduce((sum, count) => sum + count, 0);
  console.log(`Tagged image references: ${taggedImageTotal}`);
  if (untaggedImages.length > 0) {
    console.log(`Unassigned image references: ${untaggedImages.length}`);
  }

  console.log("");
  console.log("Per-page summary:");
  for (const { page, headerPresent, imageCount } of coverage) {
    const headerMarker = headerPresent ? "✔" : "✘";
    const imageLabel = imageCount === 1 ? "image" : "images";
    console.log(`- Page ${page}: header ${headerMarker}, ${imageCount} ${imageLabel}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
