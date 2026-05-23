import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

describe("TypeScript config", () => {
  it("typechecks React TSX frontend files", () => {
    const tsconfig = JSON.parse(readFileSync("tsconfig.json", "utf8")) as {
      compilerOptions?: Record<string, unknown>;
      include?: string[];
    };

    expect(tsconfig.compilerOptions?.jsx).toBe("react-jsx");
    expect(tsconfig.include).toContain("src/**/*.tsx");
    expect(tsconfig.include).toContain("tests/**/*.tsx");
  });
});
