import { describe, expect, it } from "vitest";

import { previewSimulatedConversionViaBackend } from "../src/client/simulated-conversion-client";

describe("previewSimulatedConversionViaBackend", () => {
  it("posts a simulated conversion preview request to the backend", async () => {
    const requests: Array<{ body: unknown; url: string }> = [];
    const fetchJson = async (url: string, init?: RequestInit): Promise<unknown> => {
      requests.push({
        body: init?.body === undefined ? undefined : JSON.parse(String(init.body)),
        url,
      });

      return {
        preview: {
          sourceCurrency: "USD",
          targetCurrency: "EUR",
          sourceAmount: 2500,
          convertedAmount: 2252,
          rate: 0.901,
          date: "2024-08-23",
          kind: "simulation-preview",
        },
      };
    };

    await expect(
      previewSimulatedConversionViaBackend({
        sourceCurrency: "usd",
        targetCurrency: "eur",
        amount: 2500,
        date: "2024-08-23",
        fetchJson,
      }),
    ).resolves.toEqual({
      sourceCurrency: "USD",
      targetCurrency: "EUR",
      sourceAmount: 2500,
      convertedAmount: 2252,
      rate: 0.901,
      date: "2024-08-23",
      kind: "simulation-preview",
    });
    expect(requests).toEqual([
      {
        body: {
          sourceCurrency: "USD",
          targetCurrency: "EUR",
          amount: 2500,
          date: "2024-08-23",
        },
        url: "/api/simulations/conversion-preview",
      },
    ]);
  });
});
