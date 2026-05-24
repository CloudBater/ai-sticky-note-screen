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

  it("mounts the backend-loaded dashboard app instead of the placeholder screen", () => {
    const mainSource = readFileSync("src/client/main.tsx", "utf8");

    expect(mainSource).toContain("mountDashboard");
    expect(mainSource).toContain("root.render");
    expect(mainSource).not.toContain("buildDashboardViewModel");
    expect(mainSource).not.toContain("supportedCurrencies");
    expect(mainSource).not.toContain("latestRates");
    expect(mainSource).not.toContain("<main>");
  });
});
