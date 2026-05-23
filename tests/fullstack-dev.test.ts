import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("fullstack dev runner", () => {
  it("starts the backend and proxies frontend API calls through Vite", () => {
    expect(existsSync("src/dev.ts")).toBe(true);

    const devSource = readFileSync("src/dev.ts", "utf8");

    expect(devSource).toContain("startBackendServer");
    expect(devSource).toContain("createViteServer");
    expect(devSource).toContain("proxy");
    expect(devSource).toContain("/api");
    expect(devSource).toContain('BACKEND_HOST = "127.0.0.1"');
    expect(devSource).toContain('BACKEND_PORT = "3000"');
    expect(devSource).toContain("BACKEND_HOST}:${BACKEND_PORT}");
    expect(devSource).toContain("async function startFullstackDevServer");
    expect(devSource).toContain("void startFullstackDevServer()");
    expect(devSource).not.toContain("await startBackendServer");
  });
});
