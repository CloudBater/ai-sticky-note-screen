import { describe, expect, it } from "vitest";

import { buildCurrencyUniverse, summarizeHistory } from "./marketmage.js";

describe("buildCurrencyUniverse", () => {
  it("keeps Riley's supported currencies and reports unsupported ones", () => {
    const currencies = {
      EUR: "Euro",
      GBP: "British Pound",
      JPY: "Japanese Yen",
      SGD: "Singapore Dollar",
      TWD: "New Taiwan Dollar",
      USD: "United States Dollar"
    };

    const result = buildCurrencyUniverse(currencies);

    expect(result.supported.map((currency) => currency.code)).toEqual([
      "USD",
      "EUR",
      "JPY",
      "TWD",
      "GBP",
      "SGD"
    ]);
    expect(result.unsupported).toEqual(["CNY"]);
  });
});

describe("summarizeHistory", () => {
  it("returns first, last, and percent change for a daily rate series", () => {
    const summary = summarizeHistory({
      "2026-05-20": { EUR: 0.9 },
      "2026-05-21": { EUR: 0.918 }
    }, "EUR");

    expect(summary).toEqual({
      firstDate: "2026-05-20",
      lastDate: "2026-05-21",
      first: 0.9,
      last: 0.918,
      changePercent: 2
    });
  });
});
