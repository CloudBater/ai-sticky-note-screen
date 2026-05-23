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

  it("mounts the safe dashboard app instead of the placeholder screen", () => {
    const mainSource = readFileSync("src/client/main.tsx", "utf8");

    expect(mainSource).toContain("DashboardApp");
    expect(mainSource).toContain("buildDashboardViewModel");
    expect(mainSource).toContain("requestedCurrencies");
    expect(mainSource).not.toContain("<main>");
  });
});
