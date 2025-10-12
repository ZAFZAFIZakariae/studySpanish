import express from "express";
import type { Request, Response } from "express";
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractPdf } from "./extraction";

export const app = express();

app.use(express.json());

const moduleDir =
  typeof __dirname !== "undefined" ? __dirname : path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(moduleDir, "..", "..");
const subjectsDir = path.resolve(repoRoot, "subjects");
const extractionImagesDir = path.resolve(subjectsDir, "tmp-extracted-images");
const extractsOutputDir = path.resolve(repoRoot, "src", "data", "subjectExtracts");
const publicDir = path.resolve(repoRoot, "public");
const publicAssetsDir = path.resolve(publicDir, "subject-assets");

app.post("/api/extract", async (req: Request, res: Response) => {
  const filePath = typeof req.body?.filePath === "string" ? req.body.filePath.trim() : "";

  if (!filePath) {
    res.status(400).json({ error: "A filePath string must be provided" });
    return;
  }

  try {
    const result = await extractPdf(filePath);
    res.json(result);
  } catch (error) {
    console.error("Failed to extract PDF", error);
    res.status(500).json({ error: "Failed to extract PDF content" });
  }
});

app.post("/api/save-extract", async (req: Request, res: Response) => {
  const filePath = typeof req.body?.filePath === "string" ? req.body.filePath.trim() : "";
  const markdown = typeof req.body?.markdown === "string" ? req.body.markdown : "";
  const assetsInput = Array.isArray(req.body?.assets) ? req.body.assets : [];

  if (!filePath) {
    res.status(400).json({ error: "A filePath string must be provided" });
    return;
  }

  if (!markdown) {
    res.status(400).json({ error: "A markdown string must be provided" });
    return;
  }

  const absoluteSourcePath = path.isAbsolute(filePath)
    ? filePath
    : path.resolve(repoRoot, filePath);
  const relativeSubjectPath = path.relative(subjectsDir, absoluteSourcePath);

  if (relativeSubjectPath.startsWith("..") || path.isAbsolute(relativeSubjectPath)) {
    res.status(400).json({
      error: "The provided filePath must point to a file inside the subjects directory.",
    });
    return;
  }

  const relativeDirectory = path.dirname(relativeSubjectPath);
  const baseName = path.basename(relativeSubjectPath, path.extname(relativeSubjectPath));
  const outputDirectory = path.resolve(
    extractsOutputDir,
    path.join("subjects", relativeDirectory === "." ? "" : relativeDirectory)
  );
  const outputPath = path.resolve(outputDirectory, `${baseName}.txt`);

  try {
    await mkdir(outputDirectory, { recursive: true });
    const content = markdown.endsWith("\n") ? markdown : `${markdown}\n`;
    await writeFile(outputPath, content, { encoding: "utf8", flag: "w" });
  } catch (error) {
    console.error("Failed to write extract", error);
    res.status(500).json({ error: "Failed to write extract file" });
    return;
  }

  const assetsToCopy = (assetsInput as unknown[]).flatMap((entry) => {
    if (
      entry &&
      typeof (entry as { originalPath?: unknown }).originalPath === "string" &&
      typeof (entry as { targetPath?: unknown }).targetPath === "string"
    ) {
      const originalPath = (entry as { originalPath: string }).originalPath.trim();
      const targetPath = (entry as { targetPath: string }).targetPath.trim();
      if (!originalPath || !targetPath) {
        return [];
      }
      return [{ originalPath, targetPath }];
    }
    return [];
  });

  try {
    for (const asset of assetsToCopy) {
      const sourcePath = path.isAbsolute(asset.originalPath)
        ? asset.originalPath
        : path.resolve(repoRoot, asset.originalPath);
      const relativeTempPath = path.relative(extractionImagesDir, sourcePath);

      if (relativeTempPath.startsWith("..") || path.isAbsolute(relativeTempPath)) {
        throw new Error("Asset path must originate from the temporary extraction directory.");
      }

      const normalisedTarget = asset.targetPath.replace(/\\+/g, "/").replace(/^\/+/, "");

      if (!normalisedTarget.startsWith("subject-assets/")) {
        throw new Error("Asset target path must be within the public/subject-assets directory.");
      }

      const destinationPath = path.resolve(publicDir, normalisedTarget);
      const relativeDestination = path.relative(publicAssetsDir, destinationPath);

      if (relativeDestination.startsWith("..") || path.isAbsolute(relativeDestination)) {
        throw new Error("Asset target path must be contained within public/subject-assets.");
      }

      await mkdir(path.dirname(destinationPath), { recursive: true });
      await copyFile(sourcePath, destinationPath);
    }
  } catch (error) {
    console.error("Failed to copy extracted images", error);
    res.status(500).json({ error: "Failed to copy extracted images" });
    return;
  }

  res.json({
    ok: true,
    outputPath: path.relative(repoRoot, outputPath).split(path.sep).join("/"),
  });
});

export default app;
