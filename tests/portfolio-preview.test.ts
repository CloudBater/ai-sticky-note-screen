import { describe, expect, it } from "vitest";

import { previewPortfolioAllocation } from "../src/shared/portfolio-preview";

describe("previewPortfolioAllocation", () => {
  it("calculates a historical value preview from manual hypothetical allocations", () => {
    expect(
      previewPortfolioAllocation({
        baseCurrency: "usd",
        startingAmount: 10_000,
        allocations: [
          { currency: "usd", percent: 50 },
          { currency: "eur", percent: 50 },
        ],
        referenceRatesByDate: {
          "2024-08-21": { EUR: 0.8 },
          "2024-08-23": { EUR: 1 },
        },
      }),
    ).toEqual({
      baseCurrency: "USD",
      startingAmount: 10_000,
      kind: "portfolio-allocation-preview",
      allocations: [
        { currency: "USD", percent: 50 },
        { currency: "EUR", percent: 50 },
      ],
      points: [
        {
          date: "2024-08-21",
          value: 10_000,
        },
        {
          date: "2024-08-23",
          value: 9_000,
        },
      ],
    });
  });

  it("rejects manual allocations that do not total 100 percent", () => {
    expect(() =>
      previewPortfolioAllocation({
        baseCurrency: "usd",
        startingAmount: 10_000,
        allocations: [
          { currency: "usd", percent: 40 },
          { currency: "eur", percent: 40 },
        ],
        referenceRatesByDate: {
          "2024-08-21": { EUR: 0.8 },
          "2024-08-23": { EUR: 1 },
        },
      }),
    ).toThrow("Manual portfolio allocations must total 100 percent");
  });

  it("rejects missing historical reference rates for allocated currencies", () => {
    expect(() =>
      previewPortfolioAllocation({
        baseCurrency: "usd",
        startingAmount: 10_000,
        allocations: [
          { currency: "usd", percent: 50 },
          { currency: "eur", percent: 50 },
        ],
        referenceRatesByDate: {
          "2024-08-21": { EUR: 0.8 },
          "2024-08-23": {},
        },
      }),
    ).toThrow("Historical reference rate is missing for allocated currency");
  });
});
