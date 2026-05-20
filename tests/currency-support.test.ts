import { describe, expect, it } from "vitest";

import { splitRequestedCurrenciesBySupport } from "../src/shared/currency-support";

describe("splitRequestedCurrenciesBySupport", () => {
  it("normalizes requested currency codes and preserves unsupported currencies", () => {
    const requestedCurrencies = ["usd", "eur", "jpy", "twd", "gbp", "cny", "sgd"];
    const frankfurterSupportedCurrencies = {
      USD: "US Dollar",
      EUR: "Euro",
      JPY: "Japanese Yen",
      GBP: "Pound Sterling",
      CNY: "Chinese Yuan Renminbi",
      SGD: "Singapore Dollar",
    };

    expect(
      splitRequestedCurrenciesBySupport(
        requestedCurrencies,
        frankfurterSupportedCurrencies,
      ),
    ).toEqual({
      supported: ["USD", "EUR", "JPY", "GBP", "CNY", "SGD"],
      unsupported: ["TWD"],
    });
  });
});
