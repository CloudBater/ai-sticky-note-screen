import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("package scripts", () => {
  it("provides the one-command local dev script promised in PLAN.md", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts?: Record<string, string>;
    };

    expect(packageJson.scripts?.dev).toBe("vite --host 127.0.0.1");
  });
});
