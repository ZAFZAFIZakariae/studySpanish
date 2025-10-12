import { execFile } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

export interface ImageInfo {
  path: string;
  page: number;
  index: number;
  width?: number | null;
  height?: number | null;
  color_space?: string | null;
}

const execFileAsync = promisify(execFile);
const PYTHON_BIN = process.env.PYTHON_PATH || process.env.PYTHON || "python3";
const moduleDir =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));

function resolveScriptPath(): string {
  const repoRoot = path.resolve(moduleDir, "..", "..");
  return path.resolve(repoRoot, "scripts", "extract_subject_texts.py");
}

function resolveImagesDir(): string {
  const repoRoot = path.resolve(moduleDir, "..", "..");
  return path.resolve(repoRoot, "subjects", "tmp-extracted-images");
}

export async function extractPdf(
  filePath: string
): Promise<{ text: string; images: ImageInfo[] }> {
  if (!filePath) {
    throw new Error("A file path must be provided for PDF extraction");
  }

  const scriptPath = resolveScriptPath();
  const imagesDir = resolveImagesDir();
  const absoluteFilePath = path.resolve(filePath);

  try {
    const { stdout } = await execFileAsync(
      PYTHON_BIN,
      [scriptPath, "--single-pdf", absoluteFilePath, "--images-dir", imagesDir],
      { maxBuffer: 1024 * 1024 * 20, encoding: "utf8" }
    );

    const parsed = JSON.parse(stdout);
    const text = typeof parsed.text === "string" ? parsed.text : "";
    const images = Array.isArray(parsed.images) ? (parsed.images as ImageInfo[]) : [];

    return { text, images };
  } catch (error) {
    if (error instanceof Error) {
      const wrapped = new Error(`PDF extraction failed: ${error.message}`);
      (wrapped as Error & { cause?: Error }).cause = error;
      throw wrapped;
    }

    throw new Error("PDF extraction failed");
  }
}
