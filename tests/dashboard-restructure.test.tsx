import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { DashboardApp } from "../src/client/DashboardApp";
import type { DashboardViewModel } from "../src/client/dashboard";

describe("Dashboard Restructure - Trend & History Tabs", () => {
  const baseViewModel: DashboardViewModel = {
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
      { id: "simulation", label: "Simulate" },
      { id: "trend", label: "Trend" },
      { id: "history", label: "History" },
    ],
    currencySupport: {
      supported: ["USD", "EUR", "JPY", "CNY"],
      unsupported: ["TWD"],
    },
    currencyCatalog: {
      USD: "US Dollar",
      EUR: "Euro",
      JPY: "Japanese Yen",
      CNY: "Chinese Yuan",
      TWD: "New Taiwan Dollar",
    },
    latestRates: {
      baseCurrency: "USD",
      dataDate: "2024-08-23",
      cards: [
        { currency: "EUR", label: "1 USD = 0.901 EUR", rate: 0.901 },
        { currency: "JPY", label: "1 USD = 144.9 JPY", rate: 144.9 },
        { currency: "CNY", label: "1 USD = 7.12 CNY", rate: 7.12 },
      ],
    },
    historicalTrend: {
      summary:
        "EUR moved up 5% against USD from 2024-08-21 to 2024-08-23. Historical reference only, not a forecast.",
      baseCurrency: "USD",
      symbol: "EUR",
      points: [
        { date: "2024-08-21", rate: 0.9 },
        { date: "2024-08-23", rate: 0.945 },
      ],
      allSeries: [
        {
          symbols: ["CNY"],
          points: [
            { date: "2024-08-21", rate: 7.01 },
            { date: "2024-08-22", rate: 7.08 },
            { date: "2024-08-23", rate: 7.12 },
          ],
        },
        {
          symbols: ["EUR"],
          points: [
            { date: "2024-08-21", rate: 0.9 },
            { date: "2024-08-22", rate: 0.902 },
            { date: "2024-08-23", rate: 0.945 },
          ],
        },
        {
          symbols: ["JPY"],
          points: [
            { date: "2024-08-21", rate: 140 },
            { date: "2024-08-22", rate: 142 },
            { date: "2024-08-23", rate: 144.9 },
          ],
        },
      ],
    },
    simulationHistory: { entries: [] },
  };

  describe("Trend Tab - Reference Rates History Section", () => {
    it("renders Reference rates trend section in Trend tab", () => {
      const html = renderToStaticMarkup(<DashboardApp viewModel={baseViewModel} />);

      expect(html).toContain("Reference rates trend");
      expect(html).toContain('data-history-chart="multi-currency"');
      expect(html).toContain("High:");
      expect(html).toContain("Low:");
    });

    it("renders history base currency selector in Trend tab", () => {
      const html = renderToStaticMarkup(<DashboardApp viewModel={baseViewModel} />);

      expect(html).toContain('aria-label="History base currency"');
      expect(html).toContain('data-history-base-currency="USD"');
      expect(html).toContain("<option");
      expect(html).toContain("USD");
      expect(html).toContain("EUR");
    });

    it("renders target currency dropdown in Trend tab", () => {
      const html = renderToStaticMarkup(<DashboardApp viewModel={baseViewModel} />);

      expect(html).toContain('aria-label="Select target currencies"');
      expect(html).toContain("Target currencies");
      expect(html).toContain("selected-currency-badge");
      expect(html).toContain("CNY");
    });

    it("renders date range preset buttons in Trend tab", () => {
      const html = renderToStaticMarkup(<DashboardApp viewModel={baseViewModel} />);

      expect(html).toContain(">1Y<");
      expect(html).toContain(">6M<");
      expect(html).toContain(">3M<");
      expect(html).toContain(">1M<");
      expect(html).toContain(">2W<");
      expect(html).toContain(">1W<");
    });

    it("renders date range calendar inputs in Trend tab", () => {
      const html = renderToStaticMarkup(<DashboardApp viewModel={baseViewModel} />);

      expect(html).toContain('aria-label="History start date"');
      expect(html).toContain('aria-label="History end date"');
      expect(html).toContain('type="date"');
    });

    it("renders multi-currency comparison chart in Trend tab", () => {
      const html = renderToStaticMarkup(<DashboardApp viewModel={baseViewModel} />);

      expect(html).toContain("history-chart-window");
      expect(html).toContain("history-movement-grid");
      expect(html).toContain("history-movement-card");
      expect(html).toContain("Range movement");
    });

    it("renders currency pair labels with percentage changes in Trend tab", () => {
      const html = renderToStaticMarkup(<DashboardApp viewModel={baseViewModel} />);

      expect(html).toContain("history-pair-label");
      expect(html).toContain("USD/");
      expect(html).toContain("%");
    });
  });

  describe("History Tab - Removed Reference Rates Controls", () => {
    it("History tab does not contain history base currency selector", () => {
      const html = renderToStaticMarkup(<DashboardApp viewModel={baseViewModel} />);

      const historySection = html.substring(
        html.indexOf('id="history"'),
        html.indexOf('id="history"') + 5000
      );

      expect(historySection).not.toContain(
        'aria-label="History base currency"'
      );
      expect(historySection).not.toContain('data-history-base-currency');
      expect(historySection).not.toContain("history-base-control");
    });

    it("History tab does not contain currency toggle buttons", () => {
      const html = renderToStaticMarkup(<DashboardApp viewModel={baseViewModel} />);

      const historySection = html.substring(
        html.indexOf('id="history"'),
        html.indexOf('id="history"') + 5000
      );

      expect(historySection).not.toContain('data-history-currency="');
      expect(historySection).not.toContain(
        'aria-label="Toggle CNY history line"'
      );
      expect(historySection).not.toContain("history-currency-toggles");
    });

    it("History tab does not contain date range preset buttons or inputs", () => {
      const html = renderToStaticMarkup(<DashboardApp viewModel={baseViewModel} />);

      const historySection = html.substring(
        html.indexOf('id="history"'),
        html.lastIndexOf("</section>")
      );

      expect(historySection).not.toContain(">1Y<");
      expect(historySection).not.toContain(">6M<");
      expect(historySection).not.toContain(">3M<");
      expect(historySection).not.toContain(
        'aria-label="History start date"'
      );
      expect(historySection).not.toContain('aria-label="History end date"');
      expect(historySection).not.toContain("history-range-controls");
    });

    it("History tab does not contain multi-currency chart", () => {
      const html = renderToStaticMarkup(<DashboardApp viewModel={baseViewModel} />);

      const historySection = html.substring(
        html.indexOf('id="history"'),
        html.lastIndexOf("</section>")
      );

      expect(historySection).not.toContain('data-history-chart');
      expect(historySection).not.toContain("history-chart-window");
      expect(historySection).not.toContain("history-multi-line-chart");
    });

    it("History tab does not display 'Reference rates trend' heading", () => {
      const html = renderToStaticMarkup(<DashboardApp viewModel={baseViewModel} />);

      const historyStart = html.indexOf('id="history"');
      const historySimulationStart = html.indexOf(
        "Simulation history",
        historyStart
      );
      const betweenStartAndSimulation = html.substring(
        historyStart,
        historySimulationStart
      );

      expect(betweenStartAndSimulation).not.toContain(
        "Reference rates trend"
      );
      expect(betweenStartAndSimulation).not.toContain('data-history-chart');
    });
  });

  describe("History Tab - Selected Supported Currencies", () => {
    it("History tab shows 'Selected currencies' section heading", () => {
      const html = renderToStaticMarkup(<DashboardApp viewModel={baseViewModel} />);

      const historySection = html.substring(
        html.indexOf('id="history"'),
        html.indexOf('id="history"') + 3000
      );

      expect(historySection).toContain("Selected currencies");
      expect(historySection).toContain("Supported currencies");
    });

    it("History tab displays supported currency codes as text", () => {
      const html = renderToStaticMarkup(<DashboardApp viewModel={baseViewModel} />);

      const historySection = html.substring(
        html.indexOf('id="history"'),
        html.indexOf("Simulation history")
      );

      expect(historySection).toContain("USD");
      expect(historySection).toContain("EUR");
      expect(historySection).toContain("JPY");
      expect(historySection).toContain("CNY");
      expect(historySection).toContain(",");
    });

    it("History tab does not display unsupported currencies", () => {
      const html = renderToStaticMarkup(<DashboardApp viewModel={baseViewModel} />);

      const historyStart = html.indexOf('id="history"');
      const historyEnd = html.indexOf("</section>", historyStart);
      const historySection = html.substring(historyStart, historyEnd);

      expect(historySection).toContain("USD");
      expect(historySection).toContain("EUR");
      expect(historySection).not.toContain("TWD");
    });

    it("History tab displays supported currencies with commas", () => {
      const html = renderToStaticMarkup(<DashboardApp viewModel={baseViewModel} />);

      const historySection = html.substring(
        html.indexOf('id="history"'),
        html.indexOf("Simulation history")
      );

      expect(historySection).toContain("USD");
      expect(historySection).toContain(", ");
      expect(historySection).toContain("EUR");
    });
  });

  describe("History Tab - Simulation History Preserved", () => {
    it("History tab contains 'Simulation history' section heading", () => {
      const html = renderToStaticMarkup(<DashboardApp viewModel={baseViewModel} />);

      const historySection = html.substring(
        html.indexOf('id="history"'),
        html.lastIndexOf("</section>")
      );

      expect(historySection).toContain("Simulation history");
      expect(historySection).toContain("Review");
    });

    it("History tab shows empty state when no simulation entries", () => {
      const html = renderToStaticMarkup(<DashboardApp viewModel={baseViewModel} />);

      const historySection = html.substring(
        html.indexOf('id="history"'),
        html.lastIndexOf("</section>")
      );

      expect(historySection).toContain(
        "No simulated conversion entries yet"
      );
      expect(historySection).toContain("Preview a simulated conversion");
    });

    it("History tab displays simulation entries when present", () => {
      const viewModel = {
        ...baseViewModel,
        simulationHistory: {
          entries: [
            {
              id: "sim-1",
              sourceCurrency: "USD",
              targetCurrency: "EUR",
              sourceAmount: 2500,
              convertedAmount: 2252,
              rate: 0.901,
              date: "2024-08-23",
              kind: "simulation-history-entry" as const,
            },
          ],
        },
      };

      const html = renderToStaticMarkup(<DashboardApp viewModel={viewModel} />);

      expect(html).toContain('class="history-list"');
      expect(html).toContain("2,500");
      expect(html).toContain("USD");
      expect(html).toContain("2,252");
      expect(html).toContain("EUR");
      expect(html).toContain("2024-08-23");
    });

    it("History tab displays simulation history with correct structure", () => {
      const viewModel = {
        ...baseViewModel,
        simulationHistory: {
          entries: [
            {
              id: "sim-1",
              sourceCurrency: "USD",
              targetCurrency: "JPY",
              sourceAmount: 1000,
              convertedAmount: 144900,
              rate: 144.9,
              date: "2024-08-21",
              kind: "simulation-history-entry" as const,
            },
          ],
        },
      };

      const html = renderToStaticMarkup(<DashboardApp viewModel={viewModel} />);

      expect(html).toContain('class="history-list"');
      expect(html).toContain("1,000");
      expect(html).toContain("USD");
      expect(html).toContain("144,900");
      expect(html).toContain("JPY");
      expect(html).toContain("2024-08-21");
      expect(html).toContain("144.9");
    });
  });

  describe("Full Dashboard Structure Integrity", () => {
    it("Dashboard renders all four tabs correctly positioned", () => {
      const html = renderToStaticMarkup(<DashboardApp viewModel={baseViewModel} />);

      expect(html).toContain('id="overview"');
      expect(html).toContain('id="trend"');
      expect(html).toContain('id="simulation"');
      expect(html).toContain('id="history"');
    });

    it("Reference Rates History controls are in Trend tab, not History tab", () => {
      const html = renderToStaticMarkup(<DashboardApp viewModel={baseViewModel} />);

      const trendIndex = html.indexOf('id="trend"');
      const historyIndex = html.indexOf('id="history"');

      const trendSection = html.substring(trendIndex, historyIndex);
      const historySection = html.substring(historyIndex);

      expect(trendSection).toContain('data-history-chart="multi-currency"');
      expect(trendSection).toContain('aria-label="History base currency"');
      expect(historySection).not.toContain('data-history-chart="multi-currency"');
      expect(historySection).not.toContain(
        'aria-label="History base currency"'
      );
    });

    it("History tab maintains safety copy about historical reference data", () => {
      const html = renderToStaticMarkup(<DashboardApp viewModel={baseViewModel} />);

      expect(html).toContain("Historical reference only");
      expect(html).toContain("Daily reference rates");
      expect(html).toContain("No trades are executed");
    });
  });
});
