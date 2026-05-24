import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DashboardApp } from "../src/client/DashboardApp";
import type { DashboardViewModel } from "../src/client/dashboard";

describe("historical chart rendering", () => {
  const viewModelWithChartData: DashboardViewModel = {
    title: "MarketMage",
    simulationBalanceLabel: "Hypothetical starting balance",
    simulationBalance: {
      amount: 10_000,
      currency: "USD",
    },
    trustMessages: ["Daily reference rates, not real-time quotes."],
    navigationItems: [
      { id: "overview", label: "Overview" },
      { id: "trend", label: "Trend" },
      { id: "simulation", label: "Simulate" },
      { id: "history", label: "History" },
    ],
    currencySupport: {
      supported: ["USD", "EUR"],
      unsupported: [],
    },
    latestRates: {
      baseCurrency: "USD",
      dataDate: "2024-08-23",
      cards: [{ currency: "EUR", label: "1 USD = 0.901 EUR", rate: 0.901 }],
    },
    historicalTrend: {
      summary:
        "EUR moved up 5% against USD from 2024-08-21 to 2024-08-23. Historical reference only, not a forecast.",
      baseCurrency: "USD",
      symbol: "EUR",
      points: [
        { date: "2024-08-21", rate: 0.899 },
        { date: "2024-08-22", rate: 0.902 },
        { date: "2024-08-23", rate: 0.901 },
      ],
      allSeries: [
        {
          symbols: ["EUR"],
          points: [
            { date: "2024-08-21", rate: 0.899 },
            { date: "2024-08-22", rate: 0.902 },
            { date: "2024-08-23", rate: 0.901 },
          ],
        },
      ],
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

  it("renders an SVG line chart from real historical rate points", () => {
    const html = renderToStaticMarkup(
      <DashboardApp viewModel={viewModelWithChartData} />,
    );

    expect(html).toContain("<svg");
    expect(html).toContain("<polyline");
    expect(html).toContain('data-chart-type="historical-line"');
  });

  it("shows the chart date range from the historical points", () => {
    const html = renderToStaticMarkup(
      <DashboardApp viewModel={viewModelWithChartData} />,
    );

    expect(html).toContain(
      '<p class="chart-date-range">2024-08-21 to 2024-08-23</p>',
    );
  });

  it("renders an empty chart state when no historical points exist", () => {
    const emptyViewModel: DashboardViewModel = {
      ...viewModelWithChartData,
      historicalTrend: {
        ...viewModelWithChartData.historicalTrend,
        points: [],
        allSeries: [],
        symbol: "",
      },
    };

    const html = renderToStaticMarkup(
      <DashboardApp viewModel={emptyViewModel} />,
    );

    expect(html).toContain("Historical chart data will appear");
  });
});
