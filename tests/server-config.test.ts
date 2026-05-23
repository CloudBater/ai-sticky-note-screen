import { describe, expect, it } from "vitest";

import { readServerConfig } from "../src/server/config";

describe("readServerConfig", () => {
  it("uses safe defaults for local backend startup", () => {
    expect(readServerConfig({})).toEqual({
      port: 3000,
      frankfurterBaseUrl: "https://api.frankfurter.app",
    });
  });

  it("reads the backend port and Frankfurter base URL from environment variables", () => {
    expect(
      readServerConfig({
        PORT: "4173",
        FRANKFURTER_BASE_URL: "https://api.frankfurter.test",
      }),
    ).toEqual({
      port: 4173,
      frankfurterBaseUrl: "https://api.frankfurter.test",
    });
  });
});
