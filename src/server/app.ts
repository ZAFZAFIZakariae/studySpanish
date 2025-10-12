import express from "express";
import type { Request, Response } from "express";
import { extractPdf } from "./extraction";

export const app = express();

app.use(express.json());

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

export default app;
