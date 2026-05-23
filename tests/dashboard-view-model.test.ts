import { describe, expect, it } from "vitest";

import { buildDashboardViewModel } from "../src/client/dashboard";

describe("buildDashboardViewModel", () => {
  it("builds the safe MarketMage dashboard copy and rate cards", () => {
    expect(
      buildDashboardViewModel({
        simulationBalance: 10_000,
        baseCurrency: "usd",
        dataDate: "2024-08-23",
        requestedCurrencies: ["usd", "eur", "jpy", "twd"],
        supportedCurrencies: {
          USD: "US Dollar",
          EUR: "Euro",
          JPY: "Japanese Yen",
        },
        latestRates: {
          EUR: 0.901,
          JPY: 144.9,
        },
      }),
    ).toEqual({
      title: "MarketMage",
      simulationBalanceLabel: "Hypothetical starting balance",
      simulationBalance: {
        amount: 10_000,
        currency: "USD",
      },
      trustMessages: [
        "Daily reference rates, not real-time quotes.",
        "Historical reference only.",
        "Not investment advice.",
        "No deposits, withdrawals, or trades.",
        "No trades are executed.",
      ],
      navigationItems: [
        { id: "overview", label: "Overview" },
        { id: "trend", label: "Historical Trend" },
        { id: "simulation", label: "Simulation" },
        { id: "history", label: "History" },
      ],
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
