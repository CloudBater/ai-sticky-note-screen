import { describe, expect, it } from "vitest";

import { previewSimulatedConversion } from "../src/shared/conversion-preview";

describe("previewSimulatedConversion", () => {
  it("calculates a non-executing simulated conversion from a daily reference rate", () => {
    expect(
      previewSimulatedConversion({
        sourceCurrency: "usd",
        targetCurrency: "eur",
        amount: 2500,
        date: "2024-08-23",
        dailyReferenceRate: 0.901,
      }),
    ).toEqual({
      sourceCurrency: "USD",
      targetCurrency: "EUR",
      sourceAmount: 2500,
      convertedAmount: 2252.5,
      rate: 0.901,
      date: "2024-08-23",
      kind: "simulation-preview",
    });
  });

  it("rejects non-positive simulated conversion amounts", () => {
    expect(() =>
      previewSimulatedConversion({
        sourceCurrency: "usd",
        targetCurrency: "eur",
        amount: -100,
        date: "2025-08-23",
        dailyReferenceRate: 0.901,
      }),
    ).toThrow("Simulated conversion amount must be greater than 0");
  });
});
