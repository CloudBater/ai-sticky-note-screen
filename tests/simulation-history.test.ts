import { describe, expect, it } from "vitest";

import { addSimulatedConversionToHistory } from "../src/client/simulation-history";

describe("addSimulatedConversionToHistory", () => {
  it("adds a non-executing simulated conversion preview to history", () => {
    expect(
      addSimulatedConversionToHistory({
        existingEntries: [
          {
            id: "sim-1",
            sourceCurrency: "USD",
            targetCurrency: "JPY",
            sourceAmount: 1000,
            convertedAmount: 144900,
            rate: 144.9,
            date: "2024-08-22",
            kind: "simulation-history-entry",
          },
        ],
        preview: {
          sourceCurrency: "USD",
          targetCurrency: "EUR",
          sourceAmount: 2500,
          convertedAmount: 2252,
          rate: 0.901,
          date: "2024-08-23",
          kind: "simulation-preview",
        },
      }),
    ).toEqual([
      {
        id: "sim-1",
        sourceCurrency: "USD",
        targetCurrency: "JPY",
        sourceAmount: 1000,
        convertedAmount: 144900,
        rate: 144.9,
        date: "2024-08-22",
        kind: "simulation-history-entry",
      },
      {
        id: "sim-2",
        sourceCurrency: "USD",
        targetCurrency: "EUR",
        sourceAmount: 2500,
        convertedAmount: 2252,
        rate: 0.901,
        date: "2024-08-23",
        kind: "simulation-history-entry",
      },
    ]);
  });
});
