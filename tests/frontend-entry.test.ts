import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("frontend entry", () => {
  it("provides the Vite HTML shell and React entry module", () => {
    expect(existsSync("index.html")).toBe(true);
    expect(existsSync("src/client/main.tsx")).toBe(true);

    expect(readFileSync("index.html", "utf8")).toContain(
      "/src/client/main.tsx",
    );
  });
});
