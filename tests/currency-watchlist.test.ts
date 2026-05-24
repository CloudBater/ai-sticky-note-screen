import { describe, expect, it } from "vitest";

import {
  addCurrencyToWatchlist,
  buildCurrencyWatchlistEntries,
  normalizeCurrencyCodeInput,
} from "../src/client/currency-watchlist";

describe("currency watchlist helpers", () => {
  it("normalizes user-entered currency codes", () => {
    expect(normalizeCurrencyCodeInput(" eur ")).toBe("EUR");
    expect(normalizeCurrencyCodeInput("jpy")).toBe("JPY");
    expect(normalizeCurrencyCodeInput("12")).toBeNull();
  });

  it("appends a unique currency to the watchlist", () => {
    expect(addCurrencyToWatchlist(["USD", "EUR"], "jpy")).toEqual([
      "USD",
      "EUR",
      "JPY",
    ]);
    expect(addCurrencyToWatchlist(["USD", "EUR"], " eur ")).toEqual([
      "USD",
      "EUR",
    ]);
    expect(addCurrencyToWatchlist(["USD", "EUR"], "12")).toEqual([
      "USD",
      "EUR",
    ]);
  });

  it("labels unknown currencies as unsupported watchlist entries", () => {
    expect(
      buildCurrencyWatchlistEntries(["USD", "TWD"], {
        USD: "US Dollar",
        EUR: "Euro",
      }),
    ).toEqual([
      {
        currency: "USD",
        label: "US Dollar",
        supported: true,
      },
      {
        currency: "TWD",
        label: "TWD",
        supported: false,
      },
    ]);
  });
});
