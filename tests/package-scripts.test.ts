import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("package scripts", () => {
  it("provides the one-command fullstack dev script promised in PLAN.md", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    expect(packageJson.scripts?.dev).toBe("tsx src/dev.ts");
    expect(packageJson.devDependencies?.tsx).toBeDefined();
    expect(packageJson.devDependencies?.vite).toBeDefined();
  });

  it("declares the React dependencies needed by the planned Vite frontend", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    expect(packageJson.dependencies?.react).toBeDefined();
    expect(packageJson.dependencies?.["react-dom"]).toBeDefined();
    expect(packageJson.devDependencies?.["@vitejs/plugin-react"]).toBeDefined();
    expect(packageJson.devDependencies?.["@types/react"]).toBeDefined();
    expect(packageJson.devDependencies?.["@types/react-dom"]).toBeDefined();
  });
});
