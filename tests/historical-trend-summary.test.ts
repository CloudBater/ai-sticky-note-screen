import { describe, expect, it } from "vitest";

import { summarizeHistoricalTrend } from "../src/client/historical-trend-summary";

describe("summarizeHistoricalTrend", () => {
  it("summarizes historical movement without making a forecast", () => {
    expect(
      summarizeHistoricalTrend({
        baseCurrency: "usd",
        symbol: "eur",
        points: [
          { date: "2024-08-21", rate: 0.9 },
          { date: "2024-08-23", rate: 0.945 },
        ],
      }),
    ).toEqual({
      baseCurrency: "USD",
      symbol: "EUR",
      startDate: "2024-08-21",
      endDate: "2024-08-23",
      startRate: 0.9,
      endRate: 0.945,
      percentChange: 5,
      direction: "up",
      summary:
        "EUR moved up 5% against USD from 2024-08-21 to 2024-08-23. Historical reference only, not a forecast.",
    });
  });

  it("rejects insufficient historical points", () => {
    expect(() =>
      summarizeHistoricalTrend({
        baseCurrency: "usd",
        symbol: "eur",
        points: [{ date: "2024-08-21", rate: 0.9 }],
      }),
    ).toThrow("At least two historical reference points are required");
  });
});
