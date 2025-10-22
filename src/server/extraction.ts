import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

export interface ImageInfo {
  path: string;
  page: number;
  index: number;
  width?: number | null;
  height?: number | null;
  color_space?: string | null;
}

const PYTHON_BIN = process.env.PYTHON_PATH || process.env.PYTHON || "python3";
const moduleDir =
  typeof __dirname !== "undefined"
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(moduleDir, "..", "..");
const subjectsDir = path.resolve(repoRoot, "subjects");

function resolveScriptPath(): string {
  return path.resolve(repoRoot, "scripts", "extract_subject_texts.py");
}

function resolveImagesDir(): string {
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
  const absoluteFilePath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(repoRoot, filePath);
  const relativeToSubjects = path.relative(subjectsDir, absoluteFilePath);

  if (relativeToSubjects.startsWith("..") || path.isAbsolute(relativeToSubjects)) {
    throw new Error("The provided file path must point to a PDF inside the subjects directory.");
  }

  return await new Promise<{ text: string; images: ImageInfo[] }>((resolve, reject) => {
    const extractor = spawn(
      PYTHON_BIN,
      [scriptPath, "--single-pdf", absoluteFilePath, "--images-dir", imagesDir],
      { stdio: ["ignore", "pipe", "pipe"], env: process.env }
    ) as ChildProcessWithoutNullStreams;

    let stdout = "";
    let stderr = "";

    extractor.stdout.setEncoding("utf8");
    extractor.stdout.on("data", (chunk: string) => {
      stdout += chunk;
    });

    extractor.stderr.setEncoding("utf8");
    extractor.stderr.on("data", (chunk: string) => {
      stderr += chunk;
    });

    extractor.on("error", (error) => {
      const wrapped = new Error(`Failed to start extraction script: ${error.message}`);
      (wrapped as Error & { cause?: Error }).cause = error instanceof Error ? error : undefined;
      reject(wrapped);
    });

    extractor.on("close", (code) => {
      if (code !== 0) {
        const details = stderr.trim();
        const message = details ? ` ${details}` : "";
        reject(new Error(`PDF extraction failed with exit code ${code}.${message}`));
        return;
      }

      try {
        const parsed = JSON.parse(stdout);
        const text = typeof parsed.text === "string" ? parsed.text : "";
        const images = Array.isArray(parsed.images) ? (parsed.images as ImageInfo[]) : [];
        resolve({ text, images });
      } catch (error) {
        const wrapped = new Error(
          error instanceof Error
            ? `Failed to parse extractor output: ${error.message}`
            : "Failed to parse extractor output"
        );
        (wrapped as Error & { cause?: Error }).cause = error instanceof Error ? error : undefined;
        if (stderr.trim()) {
          (wrapped as Error & { details?: string }).details = stderr.trim();
        }
        reject(wrapped);
      }
    });
  });
}
