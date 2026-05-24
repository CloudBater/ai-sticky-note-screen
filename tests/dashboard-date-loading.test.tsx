import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DashboardApp } from "../src/client/DashboardApp";
import type { DashboardViewModel } from "../src/client/dashboard";

describe("dashboard date loading and state sync", () => {
  const fallbackViewModel: DashboardViewModel = {
    title: "MarketMage",
    simulationBalanceLabel: "Hypothetical starting balance",
    simulationBalance: {
      amount: 10_000,
      currency: "USD",
    },
    trustMessages: ["Daily reference rates, not real-time quotes."],
    navigationItems: [
      { id: "overview", label: "Overview" },
      { id: "simulation", label: "Simulate" },
      { id: "trend", label: "Trend" },
      { id: "history", label: "History" },
    ],
    currencySupport: {
      supported: ["USD"],
      unsupported: [],
    },
    latestRates: {
      baseCurrency: "USD",
      dataDate: "Loading...",
      cards: [],
    },
    historicalTrend: {
      summary:
        "Historical movement summary will appear after daily reference rates load.",
      baseCurrency: "USD",
      symbol: "",
      points: [],
      allSeries: [],
    },
    allocationPreview: {
      baseCurrency: "USD",
      startingAmount: 10_000,
      status: "pending",
      summary:
        "Manual allocation historical preview will appear after daily history loads.",
      currencyOptions: [{ currency: "USD", label: "USD" }],
      referenceRatesByDate: {},
      allocations: [],
      points: [],
    },
    simulationHistory: {
      entries: [],
    },
  };

  it("does not bind the date input to 'Loading...' literal string to avoid console warnings", () => {
    const html = renderToStaticMarkup(
      <DashboardApp viewModel={fallbackViewModel} />,
    );

    // The reference date input should not have the value "Loading..."
    expect(html).not.toContain('value="Loading..."');
  });
});
