import { describe, expect, it } from "vitest";

import { previewCurrencyWatchlist } from "../src/shared/currency-watchlist-preview";

describe("previewCurrencyWatchlist", () => {
  it("creates historical reference points for user-selected watchlist currencies", () => {
    expect(
      previewCurrencyWatchlist({
        baseCurrency: "usd",
        watchedCurrencies: ["eur", "jpy"],
        referenceRatesByDate: {
          "2024-08-21": { EUR: 0.8, JPY: 100 },
          "2024-08-23": { EUR: 1, JPY: 80 },
        },
      }),
    ).toEqual({
      baseCurrency: "USD",
      watchedCurrencies: ["EUR", "JPY"],
      kind: "currency-watchlist-preview",
      series: [
        {
          currency: "EUR",
          points: [
            { date: "2024-08-21", rate: 0.8 },
            { date: "2024-08-23", rate: 1 },
          ],
        },
        {
          currency: "JPY",
          points: [
            { date: "2024-08-21", rate: 100 },
            { date: "2024-08-23", rate: 80 },
          ],
        },
      ],
    });
  });

  it("rejects watchlist currencies missing from the historical reference rates", () => {
    expect(() =>
      previewCurrencyWatchlist({
        baseCurrency: "usd",
        watchedCurrencies: ["eur", "gbp"],
        referenceRatesByDate: {
          "2024-08-21": { EUR: 0.8 },
          "2024-08-23": { EUR: 1 },
        },
      }),
    ).toThrow("Historical reference rate is missing for watchlist currency");
  });
});
