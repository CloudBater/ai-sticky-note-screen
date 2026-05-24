/**
 * serve.ts — production entry point
 *
 * Serves the pre-built frontend from dist/ and the API under /api/*.
 * Run after `npm run build`:
 *
 *   npm run build
 *   npm start
 */
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join } from "node:path";

import { createApp } from "./app";
import { readServerConfig } from "./config";

const DIST_PATH = join(process.cwd(), "dist");

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".txt": "text/plain",
};

function serveStatic(
  url: string,
  res: Parameters<ReturnType<typeof createApp>>[1],
): void {
  const pathname = new URL(url, "http://localhost").pathname;
  const filePath = join(DIST_PATH, pathname);

  // Exact file match
  if (existsSync(filePath) && statSync(filePath).isFile()) {
    const mime = MIME[extname(filePath)] ?? "application/octet-stream";
    res.writeHead(200, { "Content-Type": mime });
    createReadStream(filePath).pipe(res);
    return;
  }

  // SPA fallback: any unknown path gets index.html
  const indexPath = join(DIST_PATH, "index.html");
  if (existsSync(indexPath)) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    createReadStream(indexPath).pipe(res);
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not found");
}

async function main(): Promise<void> {
  const config = readServerConfig(process.env);
  const apiHandler = createApp({
    frankfurterBaseUrl: config.frankfurterBaseUrl,
  });

  const server = createServer((req, res) => {
    const url = req.url ?? "/";

    if (url.startsWith("/api")) {
      void apiHandler(req, res);
      return;
    }

    serveStatic(url, res);
  });

  server.listen(config.port, "0.0.0.0", () => {
    console.log(`MarketMage ready at http://localhost:${config.port}`);
  });
}

void main();
