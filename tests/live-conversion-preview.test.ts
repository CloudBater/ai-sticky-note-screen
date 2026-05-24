import { describe, expect, it } from "vitest";

import { buildLiveConversionPreview } from "../src/client/live-conversion-preview";

describe("buildLiveConversionPreview", () => {
  it("calculates a whole target amount from the latest daily reference rates", () => {
    expect(
      buildLiveConversionPreview({
        amount: 2500,
        baseCurrency: "USD",
        latestRates: [{ currency: "EUR", label: "1 USD = 0.901 EUR", rate: 0.901 }],
        sourceCurrency: "USD",
        targetCurrency: "EUR",
      }),
    ).toEqual({
      convertedAmount: 2252,
      rate: 0.901,
      sourceAmount: 2500,
      sourceCurrency: "USD",
      targetCurrency: "EUR",
    });
  });

  it("calculates cross rates through the selected base currency", () => {
    expect(
      buildLiveConversionPreview({
        amount: 100,
        baseCurrency: "USD",
        latestRates: [
          { currency: "EUR", label: "1 USD = 0.9 EUR", rate: 0.9 },
          { currency: "JPY", label: "1 USD = 150 JPY", rate: 150 },
        ],
        sourceCurrency: "EUR",
        targetCurrency: "JPY",
      }),
    ).toMatchObject({
      convertedAmount: 16666,
      sourceCurrency: "EUR",
      targetCurrency: "JPY",
    });
  });

  it("returns undefined when a requested rate is unavailable", () => {
    expect(
      buildLiveConversionPreview({
        amount: 100,
        baseCurrency: "USD",
        latestRates: [],
        sourceCurrency: "EUR",
        targetCurrency: "JPY",
      }),
    ).toBeUndefined();
  });
});
