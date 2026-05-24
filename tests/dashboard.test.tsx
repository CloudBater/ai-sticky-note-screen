import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DashboardApp } from "../src/client/DashboardApp";
import { mountDashboard } from "../src/client/dashboard-bootstrap";
import {
  buildDashboardViewModel,
  fetchDashboardReferenceData,
  fetchHistoricalReferenceRates,
  loadDashboardViewModel,
  type DashboardViewModel,
} from "../src/client/dashboard";
import {
  cardHoverMotion,
  chartSwitchTransition,
  currencyContentTransition,
  currencyTabTransition,
  numberTransition,
} from "../src/client/motion";

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
        { id: "simulation", label: "Simulate" },
        { id: "trend", label: "Trend" },
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
      historicalTrend: {
        summary:
          "Historical movement summary will appear after daily reference rates load.",
        baseCurrency: "USD",
        symbol: "",
        points: [],
        allSeries: [],
      },
      simulationHistory: {
        entries: [],
      },
    });
  });
});

describe("currency motion constants", () => {
  it("keeps dashboard motion aligned with the frontend spec", () => {
    expect(currencyTabTransition.durationMs).toBe(200);
    expect(currencyTabTransition.easing).toBe("cubic-bezier(.2,.8,.2,1)");
    expect(currencyContentTransition.exitMs).toBe(200);
    expect(currencyContentTransition.enterMs).toBe(200);
    expect(numberTransition.durationMs).toBe(200);
    expect(chartSwitchTransition.durationMs).toBe(600);
    expect(cardHoverMotion.durationMs).toBe(120);
    expect(cardHoverMotion.translateY).toBe(0);
  });
});

describe("fetchDashboardReferenceData", () => {
  it("loads currencies and latest rates from the backend API", async () => {
    const requestedUrls: string[] = [];
    const fetchJson = async (url: string): Promise<unknown> => {
      requestedUrls.push(url);

      if (url === "/api/currencies") {
        return {
          currencies: {
            USD: "US Dollar",
            EUR: "Euro",
            JPY: "Japanese Yen",
          },
        };
      }

      if (url === "/api/rates/latest?base=USD&symbols=EUR%2CJPY") {
        return {
          base: "USD",
          date: "2024-08-23",
          rates: {
            EUR: 0.901,
            JPY: 144.9,
          },
        };
      }

      throw new Error(`Unexpected URL: ${url}`);
    };

    await expect(
      fetchDashboardReferenceData({
        baseCurrency: "usd",
        symbols: ["eur", "jpy", "twd"],
        fetchJson,
      }),
    ).resolves.toEqual({
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
    });
    expect(requestedUrls).toEqual([
      "/api/currencies",
      "/api/rates/latest?base=USD&symbols=EUR%2CJPY",
    ]);
  });

  it("skips latest rates when no requested target symbols are supported", async () => {
    const requestedUrls: string[] = [];
    const fetchJson = async (url: string): Promise<unknown> => {
      requestedUrls.push(url);

      if (url === "/api/currencies") {
        return {
          currencies: {
            USD: "US Dollar",
          },
        };
      }

      throw new Error(`Unexpected URL: ${url}`);
    };

    await expect(
      fetchDashboardReferenceData({
        baseCurrency: "usd",
        symbols: ["twd"],
        fetchJson,
      }),
    ).resolves.toEqual({
      currencies: {
        USD: "US Dollar",
      },
      latestRates: {
        base: "USD",
        date: "Unavailable",
        rates: {},
      },
    });
    expect(requestedUrls).toEqual(["/api/currencies"]);
  });
});

describe("fetchHistoricalReferenceRates", () => {
  it("loads daily historical reference rates from the backend API", async () => {
    const requestedUrls: string[] = [];
    const fetchJson = async (url: string): Promise<unknown> => {
      requestedUrls.push(url);

      if (
        url ===
        "/api/rates/history?base=USD&symbol=EUR&start=2024-08-21&end=2024-08-23"
      ) {
        return {
          base: "USD",
          symbol: "EUR",
          startDate: "2024-08-21",
          endDate: "2024-08-23",
          points: [
            { date: "2024-08-21", rate: 0.899 },
            { date: "2024-08-22", rate: 0.902 },
            { date: "2024-08-23", rate: 0.901 },
          ],
        };
      }

      throw new Error(`Unexpected URL: ${url}`);
    };

    await expect(
      fetchHistoricalReferenceRates({
        baseCurrency: "usd",
        symbols: ["eur"],
        startDate: "2024-08-21",
        endDate: "2024-08-23",
        fetchJson,
      }),
    ).resolves.toEqual({
      base: "USD",
      symbol: "EUR",
      startDate: "2024-08-21",
      endDate: "2024-08-23",
      points: [
        { date: "2024-08-21", rate: 0.899 },
        { date: "2024-08-22", rate: 0.902 },
        { date: "2024-08-23", rate: 0.901 },
      ],
    });
    expect(requestedUrls).toEqual([
      "/api/rates/history?base=USD&symbol=EUR&start=2024-08-21&end=2024-08-23",
    ]);
  });
});

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

  it("loads dashboard reference data with a user-selected base currency", async () => {
    const referenceRequests: Array<{
      baseCurrency: string;
      symbols: string[];
    }> = [];
    const historicalRequests: Array<{
      baseCurrency: string;
      symbols: string[];
      startDate: string;
      endDate: string;
    }> = [];

    await expect(
      loadDashboardViewModel({
        baseCurrency: "eur",
        simulationBalance: 10_000,
        requestedCurrencies: ["usd", "eur", "jpy"],
        fetchReferenceData: async (request) => {
          referenceRequests.push(request);

          return {
            currencies: {
              USD: "US Dollar",
              EUR: "Euro",
              JPY: "Japanese Yen",
            },
            latestRates: {
              base: "EUR",
              date: "2024-08-23",
              rates: {
                USD: 1.08,
                JPY: 156.3,
              },
            },
          };
        },
        fetchHistoricalRates: async (request) => {
          historicalRequests.push(request);

          return {
            base: request.baseCurrency,
            symbol: request.symbols[0],
            startDate: request.startDate,
            endDate: request.endDate,
            points: [
              { date: "2024-08-21", rate: 1 },
              { date: "2024-08-23", rate: 1.08 },
            ],
          };
        },
      }),
    ).resolves.toMatchObject({
      latestRates: {
        baseCurrency: "EUR",
        cards: [
          { currency: "JPY", label: "1 EUR = 156.3 JPY" },
          { currency: "USD", label: "1 EUR = 1.08 USD" },
        ],
      },
      historicalTrend: {
        baseCurrency: "EUR",
      },
    });

    expect(referenceRequests).toEqual([
      {
        baseCurrency: "EUR",
        symbols: ["USD", "JPY"],
      },
    ]);
    expect(historicalRequests).toEqual([
      {
        baseCurrency: "EUR",
        symbols: ["JPY"],
        startDate: "2023-08-24",
        endDate: "2024-08-23",
      },
      {
        baseCurrency: "EUR",
        symbols: ["USD"],
        startDate: "2023-08-24",
        endDate: "2024-08-23",
      },
    ]);
  });

  it("loads a historical trend summary for the first supported target currency", async () => {
    const historicalRequests: Array<{
      baseCurrency: string;
      symbols: string[];
      startDate: string;
      endDate: string;
    }> = [];

    await expect(
      loadDashboardViewModel({
        simulationBalance: 10_000,
        requestedCurrencies: ["usd", "eur", "jpy"],
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
              EUR: 0.945,
              JPY: 144.9,
            },
          },
        }),
        fetchHistoricalRates: async (request) => {
          historicalRequests.push(request);

          return {
            base: request.baseCurrency,
            symbol: request.symbols[0],
            startDate: request.startDate,
            endDate: request.endDate,
            points: [
              { date: "2024-08-21", rate: 0.9 },
              { date: "2024-08-23", rate: 0.945 },
            ],
          };
        },
      }),
    ).resolves.toMatchObject({
      historicalTrend: {
        summary:
          "EUR moved up 5% against USD from 2024-08-21 to 2024-08-23. Historical reference only, not a forecast.",
      },
    });
    expect(historicalRequests).toEqual([
      {
        baseCurrency: "USD",
        symbols: ["EUR"],
        startDate: "2023-08-24",
        endDate: "2024-08-23",
      },
      {
        baseCurrency: "USD",
        symbols: ["JPY"],
        startDate: "2023-08-24",
        endDate: "2024-08-23",
      },
    ]);
  });

});

const fallbackViewModel: DashboardViewModel = {
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
    supported: [],
    unsupported: ["USD", "EUR", "JPY", "TWD", "GBP", "CNY", "SGD"],
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
  simulationHistory: {
    entries: [],
  },
};

const loadedViewModel: DashboardViewModel = {
  ...fallbackViewModel,
  currencySupport: {
    supported: ["USD", "EUR", "JPY"],
    unsupported: ["TWD"],
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
      { date: "2024-08-21", rate: 0.9 },
      { date: "2024-08-23", rate: 0.945 },
    ],
    allSeries: [
      {
        symbols: ["EUR"],
        points: [
          { date: "2024-08-21", rate: 0.9 },
          { date: "2024-08-23", rate: 0.945 },
        ],
      },
    ],
  },
  simulationHistory: {
    entries: [],
  },
};

describe("mountDashboard", () => {
  it("renders an honest fallback before replacing it with backend data", async () => {
    const renderedViewModels: DashboardViewModel[] = [];

    await mountDashboard({
      render: (node: ReactNode) => {
        const props = (node as { props: { viewModel: DashboardViewModel } })
          .props;
        renderedViewModels.push(props.viewModel);
      },
      loadViewModel: async () => loadedViewModel,
    });

    expect(renderedViewModels).toEqual([fallbackViewModel, loadedViewModel]);
  });

  it("renders a clear backend loading error when reference data fails", async () => {
    const renderedNodes: ReactNode[] = [];

    await mountDashboard({
      render: (node: ReactNode) => {
        renderedNodes.push(node);
      },
      loadViewModel: async () => {
        throw new Error("upstream unavailable");
      },
    });

    const errorNode = renderedNodes[1] as {
      props: {
        children: string;
      };
    };

    expect(errorNode.props.children).toBe(
      "Unable to load backend reference data.",
    );
  });
});

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
            { id: "simulation", label: "Simulate" },
            { id: "trend", label: "Trend" },
            { id: "history", label: "History" },
          ],
          currencySupport: {
            supported: ["USD", "EUR", "JPY", "CNY"],
            unsupported: ["TWD"],
          },
          latestRates: {
            baseCurrency: "USD",
            dataDate: "2024-08-23",
            cards: [
              { currency: "EUR", label: "1 USD = 0.901 EUR", rate: 0.901 },
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
            ],
          },
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
                kind: "simulation-history-entry",
              },
            ],
          },
        }}
      />,
    );

    expect(html).toContain("MarketMage");
    expect(html).toContain('aria-label="MarketMage brand"');
    expect(html).toContain('class="brand-icon-frame"');
    expect(html).toContain('class="brand-icon"');
    expect(html).toContain('src="/src/resources/MarketMage-icon.jpg"');
    expect(html).not.toContain('aria-label="Toggle dashboard theme"');
    expect(html).toContain('class="app-header"');
    expect(html).toContain("Simulation balance");
    expect(html).toContain('class="num num-m"');
    expect(html).toContain('class="code"');
    expect(html).toContain("simulation-balance-editor");
    expect(html).toContain("Adjust simulation amount");
    expect(html).toContain('aria-label="Adjust simulation amount"');
    expect(html).toContain('name="simulation-balance-amount"');
    expect(html).toContain("Hypothetical amount only");
    expect(html).toContain('class="disclaimer-panel"');
    expect(html).toContain("Daily reference rates, not real-time quotes.");
    expect(html).toContain("No deposits, withdrawals, or trades.");
    expect(html).not.toContain("Reference coverage");
    expect(html).not.toContain('aria-label="Quick actions"');
    expect(html).not.toContain('class="quick-action-strip"');
    expect(html).not.toContain("View trend");
    expect(html).not.toContain("Preview conversion</button>");
    expect(html).not.toContain("Review history");
    expect(html).not.toContain("Frankfurter ECB reference");
    expect(html).toContain("Simulated conversion exposure");
    expect(html).toContain("Reference P/L");
    expect(html).toContain('class="currency-pill currency-pill-supported"');
    expect(html).toContain('class="currency-pill currency-pill-unsupported"');
    expect(html).toContain('aria-label="TWD unsupported"');
    expect(html).not.toContain('class="panel support-panel"');
    expect(html).not.toContain("Unsupported requested currencies");
    expect(html).toContain("Latest daily reference rates");
    expect(html).toContain('data-selected-currency="EUR"');
    expect(html).toContain('data-overview-trend="EUR"');
    expect(html).toContain('aria-label="Overview daily rate trend chart"');
    expect(html).toContain('aria-label="Historical trend range"');
    expect(html).toContain('value="30" selected=""');
    expect(html).toContain("Last 30 daily points");
    expect(html).toContain("0.945");
    expect(html).toContain("2024-08-23");
    expect(html).toContain("1 USD = 0.901 EUR");
    expect(html).toContain("Historical reference only");
    expect(html).toContain("Reference rates trend");
    expect(html).toContain('data-history-chart="multi-currency"');
    expect(html).toContain('aria-label="History base currency"');
    expect(html).toContain('data-history-base-currency="USD"');
    expect(html).toContain("High:");
    expect(html).toContain("Low:");
    expect(html).toContain('aria-label="Select target currencies"');
    expect(html).toContain("Target currencies");
    expect(html).toContain("1Y");
    expect(html).toContain("6M");
    expect(html).toContain("3M");
    expect(html).toContain("1M");
    expect(html).toContain("2W");
    expect(html).toContain("1W");
    expect(html).toContain('aria-label="History start date"');
    expect(html).toContain('aria-label="History end date"');
    expect(html).toContain("Range movement");
    expect(html).toContain("+1.57%");
    expect(html).toContain("USD/CNY");
    expect(html).not.toContain("Allocation history preview");
    expect(html).toContain('class="simulation-stack"');
    expect(html).toContain('data-conversion-direction="forward"');
    expect(html).toContain('data-conversion-direction="reverse"');
    expect(html).toContain('data-layout-slot="forward-chart-left"');
    expect(html).toContain('data-layout-slot="forward-preview-right"');
    expect(html).toContain('data-layout-slot="reverse-chart-left"');
    expect(html).toContain('data-layout-slot="reverse-preview-right"');
    expect(html).toContain('data-layout-slot="amount-bottom"');
    expect(html).not.toContain('data-layout-slot="amount-left"');
    expect(html).toContain("Forward simulated conversion");
    expect(html).toContain("Reverse simulated conversion");
    expect(html).toContain("Source vs target curve");
    expect(html).toContain("Simulation balance");
    expect(html).toContain("Adjust simulation amount");
    expect(html).not.toContain("Choose currencies and allocation");
    expect(html).not.toContain('aria-label="First allocation currency"');
    expect(html).not.toContain('aria-label="Second allocation currency"');
    expect(html).not.toContain('aria-label="First allocation percent"');
    expect(html).not.toContain('name="first-allocation-percent"');
    expect(html).toContain('aria-label="Simulated conversion source currency"');
    expect(html).toContain('aria-label="Simulated conversion target currency"');
    expect(html).toContain('aria-label="Simulated conversion amount"');
    expect(html).toContain('max="10000"');
    expect(html).toContain('step="1"');
    expect(html).toContain('aria-label="Simulated conversion reference date"');
    expect(html).toContain('aria-label="Preview simulated conversion form"');
    expect(html).toContain('type="submit"');
    expect(html).toContain("Preview simulated conversion");
    expect(html).toContain("Add to simulation history");
    expect(html).toContain('class="conversion-result-source"');
    expect(html).toContain('class="conversion-result-target"');
    expect(html).toContain('class="conversion-result-rate"');
    expect(html).toContain('data-live-preview="true"');
    expect(html).toContain("No trades are executed.");
    expect(html).toContain("Available simulation balance only.");
    expect(html).not.toContain("Manual 50% USD / 50% EUR allocation moved");
    expect(html).not.toContain('data-chart-type="allocation-history-line"');
    expect(html).not.toContain('aria-label="Historical allocation value line chart"');
    expect(html).not.toContain("Latest simulated value");
    expect(html).toContain("2,500 USD");
    expect(html).toContain("2,252 EUR");
    expect(html).not.toContain('class="allocation-points"');
    expect(html).not.toContain("Trade");
    expect(html).not.toContain("Buy");
    expect(html).not.toContain("Sell");
    expect(html).not.toContain("Deposit");
    expect(html).not.toContain("Withdraw");
    expect(html).not.toContain("account balance");
    expect(html).not.toContain("Account balance");
    expect(html).not.toContain("Rebalance Now");
  });

  it("renders a user-addable selected currencies watchlist", () => {
    const html = renderToStaticMarkup(
      <DashboardApp
        viewModel={{
          ...loadedViewModel,
          currencyCatalog: {
            USD: "US Dollar",
            EUR: "Euro",
            JPY: "Japanese Yen",
            TWD: "New Taiwan Dollar",
            GBP: "British Pound",
          },
        }}
      />,
    );

    expect(html).toContain('class="currency-watchlist-form"');
    expect(html).toContain('aria-label="Add currency to selected currencies"');
    expect(html).toContain('placeholder="e.g. CAD"');
    expect(html).toContain('class="currency-pill currency-pill-supported"');
    expect(html).toContain('class="currency-pill currency-pill-unsupported"');
    expect(html).toContain('aria-label="TWD unsupported"');
    expect(html).toContain('Available currencies');
    expect(html).toContain('class="dropdown-list-item"');
    expect(html).toContain('British Pound');
  });

  it("renders supported selected currencies as global base currency controls", () => {
    const html = renderToStaticMarkup(<DashboardApp viewModel={loadedViewModel} />);
    const source = readFileSync(
      resolve(process.cwd(), "src/client/DashboardApp.tsx"),
      "utf8",
    );

    expect(html).toContain('aria-label="Set EUR as base currency"');
    expect(html).toContain('data-base-currency="USD"');
    expect(source).toContain("onBaseCurrencyChange?.(entry.currency");
  });

  it("summarizes simulated conversion exposure from history in the overview grid", () => {
    const html = renderToStaticMarkup(
      <DashboardApp
        viewModel={{
          ...loadedViewModel,
          latestRates: {
            ...loadedViewModel.latestRates,
            cards: [
              { currency: "EUR", label: "1 USD = 0.9000 EUR", rate: 0.9 },
            ],
          },
          simulationHistory: {
            entries: [
              {
                id: "sim-1",
                sourceCurrency: "USD",
                targetCurrency: "EUR",
                sourceAmount: 1800,
                convertedAmount: 1800,
                rate: 1,
                date: "2024-08-21",
                kind: "simulation-history-entry",
              },
              {
                id: "sim-2",
                sourceCurrency: "USD",
                targetCurrency: "EUR",
                sourceAmount: 900,
                convertedAmount: 900,
                rate: 1,
                date: "2024-08-22",
                kind: "simulation-history-entry",
              },
            ],
          },
        }}
      />,
    );

    expect(html).toContain('aria-labelledby="conversion-exposure-heading"');
    expect(html).toContain("Simulated conversion exposure");
    expect(html).toContain("2 simulated entries");
    expect(html).toContain("Amount");
    expect(html).toContain("2,700");
    expect(html).toContain("Avg cost");
    expect(html).toContain("1.0000");
    expect(html).toContain("Reference P/L");
    expect(html).toContain("+300");
    expect(html).toContain('class="code"');
    expect(html).toContain('class="num num-s"');
    expect(html).not.toContain("Currently purchased");
  });

  it("wires dropdown currency selections through the watchlist refresh callback", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/client/DashboardApp.tsx"),
      "utf8",
    );

    expect(source).toContain("const commitWatchlistCurrency =");
    expect(source).toContain("commitWatchlistCurrency(code);");
    expect(source).toContain("currencyCatalog[currency]");
    expect(source).toContain("setSelectedCurrency(normalizedCurrency);");
  });

  it("keeps simulated conversion source currency user-selectable", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/client/DashboardApp.tsx"),
      "utf8",
    );

    expect(source).toContain(
      "const [forwardSourceCurrency, setForwardSourceCurrency]",
    );
    expect(source).toContain(
      "const [reverseSourceCurrency, setReverseSourceCurrency]",
    );
    expect(source).toContain("sourceCurrency={forwardSourceCurrency}");
    expect(source).toContain("sourceCurrency={reverseSourceCurrency}");
    expect(source).toContain("onChange={(event) => {");
    expect(source).not.toContain("sourceCurrency: baseCurrency");
    expect(source).not.toContain("defaultValue={baseCurrency}");
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
          historicalTrend: {
            summary:
              "Historical movement summary will appear after daily reference rates load.",
            baseCurrency: "USD",
            symbol: "",
            points: [],
            allSeries: [],
          },
          simulationHistory: {
            entries: [],
          },
        }}
      />,
    );

    expect(html).toContain("No latest reference rates are available.");
    expect(html).toContain('aria-label="TWD unsupported"');
    expect(html).not.toContain("Unsupported requested currencies");
  });

  it("renders tab navigation without duplicate quick actions", () => {
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
            dataDate: "Unavailable",
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
          simulationHistory: {
            entries: [],
          },
        }}
      />,
    );

    expect(html).not.toContain('aria-label="Quick actions"');
    expect(html).not.toContain('class="quick-action-strip"');
    expect(html).not.toContain('aria-label="Main actions"');
    expect(html).toContain('data-section-target="trend"');
    expect(html).toContain('data-section-target="simulation"');
    expect(html).toContain('data-section-target="history"');
    expect(html).toContain('data-top-nav-shell="true"');
    expect(html).not.toContain('data-bottom-nav-shell');
    expect(html).toContain(">Simulate</button>");
    expect(html).toContain(">Trend</button>");
    expect(html).toContain('aria-current="page"');
    expect(html).not.toContain(String.fromCharCode(0xfffd));
  });

  it("uses top underline tabs instead of sticky or bottom navigation", () => {
    const styles = readFileSync(
      resolve(process.cwd(), "src/client/styles.css"),
      "utf8",
    );

    expect(styles).toContain(".tabs {");
    expect(styles).toContain("border-bottom: 1px solid var(--border-subtle);");
    expect(styles).toContain(".tab[aria-current=\"page\"]::after");
    expect(styles).not.toContain("position: sticky;");
    expect(styles).not.toContain(".bottom-nav {\n  position: fixed;");
  });

  it("uses the frontend spec layout rules instead of landing-page scale", () => {
    const styles = readFileSync(
      resolve(process.cwd(), "src/client/styles.css"),
      "utf8",
    );

    expect(styles).toContain(".app-shell {");
    expect(styles).toContain("max-width: 1180px;");
    expect(styles).toContain("padding: var(--space-8) var(--space-6) var(--space-7);");
    expect(styles).toContain(".app-header {\n  display: flex;");
    expect(styles).toContain(".brand-lockup h1 {");
    expect(styles).toContain("font-family: var(--font-serif);");
    expect(styles).toContain(".disclaimer-panel {");
    expect(styles).toContain("border-left: 2px solid var(--info-bar);");
    expect(styles).toContain(".dashboard-grid {");
    expect(styles).toContain("grid-template-columns: repeat(12, minmax(0, 1fr));");
    expect(styles).toContain("border-radius: var(--radius-pill);");
    expect(styles).toContain("background: var(--surface-2);");
    expect(styles).toContain(".currency-pill-unsupported,");
    expect(styles).not.toContain(".quick-action-strip {");
    expect(styles).not.toContain("font-size: clamp(3rem, 7.5vw, 5.6rem);");
  });

  it("keeps color and type tokens in the root token file", () => {
    const tokens = readFileSync(
      resolve(process.cwd(), "src/styles/tokens.css"),
      "utf8",
    );

    expect(tokens).toContain(":root {");
    expect(tokens).toContain("--surface-0: #0A0B0D;");
    expect(tokens).toContain("--accent: #7DD3C0;");
    expect(tokens).toContain("--font-serif:");
    expect(tokens).toContain("--font-mono:");
  });

  it("keeps simulation controls as the complete simulate page layout", () => {
    const styles = readFileSync(
      resolve(process.cwd(), "src/client/styles.css"),
      "utf8",
    );

    expect(styles).toContain(".simulation-stack {");
    expect(styles).toContain(".simulation-conversion-row {");
    expect(styles).toContain(
      "grid-template-columns: minmax(0, 1fr) minmax(320px, 0.9fr);",
    );
    expect(styles).toContain(".simulation-rate-chart,");
    expect(styles).toContain(".simulation-balance-editor,");
    expect(styles).toContain(".conversion-preview-card {");
    expect(styles).not.toContain(".allocation-preview-card");
    expect(styles).not.toContain(".allocation-chart-tooltip");
  });

  it("uses full-width layout for the history panel", () => {
    const styles = readFileSync(
      resolve(process.cwd(), "src/client/styles.css"),
      "utf8",
    );

    expect(styles).toContain(".history-panel {");
    expect(styles).toContain("grid-column: span 12;");
  });

  it("shows add-to-history button and reserves confirmation slot on initial render", () => {
    const html = renderToStaticMarkup(
      <DashboardApp viewModel={loadedViewModel} />,
    );

    expect(html).toContain("Add to simulation history");
    expect(html).toContain('class="conversion-added-confirm"');
    expect(html).toContain("View simulation history");
    expect(html).toContain('class="history-link-button"');
    expect(html).toContain('data-section-target="history"');
  });

  it("renders disclaimer panel with eyebrow and structured safety title", () => {
    const html = renderToStaticMarkup(
      <DashboardApp viewModel={loadedViewModel} />,
    );

    expect(html).toContain('aria-label="Reference and safety notes"');
    expect(html).toContain('class="disclaimer-panel"');
    expect(html).toContain("Reference &amp; safety");
    expect(html).toContain("What this product is");
    expect(html).toContain("Daily reference rates, not real-time quotes.");
    expect(html).not.toContain('class="trust-strip"');
  });

  it("defines monospace and serif font family tokens in tokens.css", () => {
    const tokens = readFileSync(
      resolve(process.cwd(), "src/styles/tokens.css"),
      "utf8",
    );
    const styles = readFileSync(
      resolve(process.cwd(), "src/client/styles.css"),
      "utf8",
    );

    expect(tokens).toContain("--font-mono:");
    expect(tokens).toContain("--font-serif:");
    expect(styles).toContain("font-family: var(--font-mono);");
    expect(styles).toContain("font-family: var(--font-serif);");
  });
});
