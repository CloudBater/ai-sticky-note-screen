import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DashboardApp } from "../src/client/DashboardApp";

describe("DashboardApp", () => {
  it("renders the safe MarketMage dashboard sections", () => {
    const html = renderToStaticMarkup(
      <DashboardApp
        viewModel={{
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
              { currency: "EUR", label: "1 USD = 0.901 EUR", rate: 0.901 },
            ],
          },
        }}
      />,
    );

    expect(html).toContain("MarketMage");
    expect(html).toContain("Hypothetical starting balance");
    expect(html).toContain("10,000 USD");
    expect(html).toContain("Daily reference rates, not real-time quotes.");
    expect(html).toContain("No deposits, withdrawals, or trades.");
    expect(html).toContain("Supported currencies");
    expect(html).toContain("USD");
    expect(html).toContain("Unsupported requested currencies");
    expect(html).toContain("TWD");
    expect(html).toContain("Latest daily reference rates");
    expect(html).toContain("2024-08-23");
    expect(html).toContain("1 USD = 0.901 EUR");
    expect(html).toContain("Historical Trend");
    expect(html).not.toContain("Trade");
    expect(html).not.toContain("Buy");
    expect(html).not.toContain("Sell");
    expect(html).not.toContain("Deposit");
    expect(html).not.toContain("Withdraw");
    expect(html).not.toContain("Rebalance Now");
  });

  it("renders an empty state when latest reference rates are unavailable", () => {
    const html = renderToStaticMarkup(
      <DashboardApp
        viewModel={{
          title: "MarketMage",
          simulationBalanceLabel: "Hypothetical starting balance",
          simulationBalance: {
            amount: 10_000,
            currency: "USD",
          },
          trustMessages: ["Daily reference rates, not real-time quotes."],
          navigationItems: [{ id: "overview", label: "Overview" }],
          currencySupport: {
            supported: ["USD"],
            unsupported: ["TWD"],
          },
          latestRates: {
            baseCurrency: "USD",
            dataDate: "Unavailable",
            cards: [],
          },
        }}
      />,
    );

    expect(html).toContain("No latest reference rates are available.");
    expect(html).toContain("Unsupported requested currencies");
    expect(html).toContain("TWD");
  });
});
