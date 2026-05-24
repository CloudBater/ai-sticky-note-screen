import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { readFullstackDevConfig } from "../src/dev-config";

describe("fullstack dev runner", () => {
  it("starts the backend and proxies frontend API calls through Vite", () => {
    expect(existsSync("src/dev.ts")).toBe(true);

    const devSource = readFileSync("src/dev.ts", "utf8");

    expect(devSource).toContain("startBackendServer");
    expect(devSource).toContain("createViteServer");
    expect(devSource).toContain("proxy");
    expect(devSource).toContain("/api");
    expect(devSource).toContain("readFullstackDevConfig");
    expect(devSource).toContain("actualBackendPort");
    expect(devSource).toContain("async function startFullstackDevServer");
    expect(devSource).toContain("void startFullstackDevServer()");
    expect(devSource).toContain("await startBackendServer");
  });

  it("keeps the Vite proxy aligned with the backend PORT override", () => {
    expect(readFullstackDevConfig({ PORT: "3001" })).toEqual({
      backendHost: "127.0.0.1",
      backendPort: "3001",
      frontendHost: "127.0.0.1",
      frontendPort: 5173,
    });
  });
});
