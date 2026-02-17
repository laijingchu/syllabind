import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { storage } from "./storage";
import { parseSyllabindIdFromUrl, injectOgTags } from "./utils/ogTags";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", async (_req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    const syllabindId = parseSyllabindIdFromUrl(_req.originalUrl);

    if (syllabindId) {
      try {
        const syllabus = await storage.getSyllabus(syllabindId);
        if (syllabus && syllabus.status === "published") {
          let html = await fs.promises.readFile(indexPath, "utf-8");
          html = injectOgTags(html, syllabus);
          return res.status(200).set({ "Content-Type": "text/html" }).end(html);
        }
      } catch {
        // Fall through to default index.html on error
      }
    }

    res.sendFile(indexPath);
  });
}
