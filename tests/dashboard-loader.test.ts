import { describe, expect, it } from "vitest";

import { loadDashboardViewModel } from "../src/client/dashboard";

describe("loadDashboardViewModel", () => {
  it("builds a dashboard view model from backend reference data", async () => {
    await expect(
      loadDashboardViewModel({
        simulationBalance: 10_000,
        requestedCurrencies: ["usd", "eur", "jpy", "twd"],
        fetchReferenceData: async () => ({
          currencies: {
            USD: "US Dollar",
            EUR: "Euro",
            JPY: "Japanese Yen",
          },
          latestRates: {
            base: "USD",
            date: "2024-08-23",
            rates: {
              EUR: 0.901,
              JPY: 144.9,
            },
          },
        }),
      }),
    ).resolves.toMatchObject({
      title: "MarketMage",
      simulationBalance: {
        amount: 10_000,
        currency: "USD",
      },
      currencySupport: {
        supported: ["USD", "EUR", "JPY"],
        unsupported: ["TWD"],
      },
      latestRates: {
        baseCurrency: "USD",
        dataDate: "2024-08-23",
        cards: [
          {
            currency: "EUR",
            label: "1 USD = 0.901 EUR",
            rate: 0.901,
          },
          {
            currency: "JPY",
            label: "1 USD = 144.9 JPY",
            rate: 144.9,
          },
        ],
      },
    });
  });
});
