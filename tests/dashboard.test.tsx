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
    });
  });

  it("loads a manual allocation historical preview from historical rates", async () => {
    await expect(
      loadDashboardViewModel({
        simulationBalance: 10_000,
        requestedCurrencies: ["usd", "eur"],
        fetchReferenceData: async () => ({
          currencies: {
            USD: "US Dollar",
            EUR: "Euro",
          },
          latestRates: {
            base: "USD",
            date: "2024-08-23",
            rates: {
              EUR: 0.945,
            },
          },
        }),
        fetchHistoricalRates: async (request) => ({
          base: request.baseCurrency,
          symbol: request.symbol,
          startDate: request.startDate,
          endDate: request.endDate,
          points: [
            { date: "2024-08-21", rate: 0.9 },
            { date: "2024-08-23", rate: 0.945 },
          ],
        }),
      }),
    ).resolves.toMatchObject({
      allocationPreview: {
        baseCurrency: "USD",
        startingAmount: 10_000,
        status: "ready",
        summary:
          "Manual 50% USD / 50% EUR allocation moved from 10,000 USD to 9,761.9 USD. Historical reference only.",
        currencyOptions: [
          { currency: "USD", label: "USD" },
          { currency: "EUR", label: "EUR" },
        ],
        referenceRatesByDate: {
          "2024-08-21": { EUR: 0.9 },
          "2024-08-23": { EUR: 0.945 },
        },
        allocations: [
          { currency: "USD", percent: 50, label: "50% USD" },
          { currency: "EUR", percent: 50, label: "50% EUR" },
        ],
        points: [
          { date: "2024-08-21", value: 10_000, label: "10,000 USD" },
          { date: "2024-08-23", value: 9_761.9, label: "9,761.9 USD" },
        ],
      },
    });
  });
});

describe("currency motion constants", () => {
  it("keeps premium dashboard motion restrained and reusable", () => {
    expect(currencyTabTransition.durationMs).toBeGreaterThanOrEqual(350);
    expect(currencyTabTransition.durationMs).toBeLessThanOrEqual(500);
    expect(currencyTabTransition.easing).toBe("cubic-bezier(0.22, 1, 0.36, 1)");
    expect(currencyContentTransition.exitMs).toBeGreaterThanOrEqual(180);
    expect(currencyContentTransition.enterMs).toBeGreaterThanOrEqual(400);
    expect(numberTransition.durationMs).toBeGreaterThanOrEqual(500);
    expect(numberTransition.durationMs).toBeLessThanOrEqual(900);
    expect(chartSwitchTransition.durationMs).toBeGreaterThanOrEqual(400);
    expect(cardHoverMotion.translateY).toBe(-4);
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
        symbol: "eur",
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

  it("loads a historical trend summary for the first supported target currency", async () => {
    const historicalRequests: Array<{
      baseCurrency: string;
      symbol: string;
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
            symbol: request.symbol,
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
        symbol: "EUR",
        startDate: "2024-07-24",
        endDate: "2024-08-23",
      },
      {
        baseCurrency: "USD",
        symbol: "JPY",
        startDate: "2024-07-24",
        endDate: "2024-08-23",
      },
    ]);
  });

  it("loads allocation preview histories for every supported target currency", async () => {
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
        fetchHistoricalRates: async (request) => ({
          base: request.baseCurrency,
          symbol: request.symbol,
          startDate: request.startDate,
          endDate: request.endDate,
          points:
            request.symbol === "EUR"
              ? [
                  { date: "2024-08-21", rate: 0.9 },
                  { date: "2024-08-23", rate: 0.945 },
                ]
              : [
                  { date: "2024-08-21", rate: 140 },
                  { date: "2024-08-23", rate: 144.9 },
                ],
        }),
      }),
    ).resolves.toMatchObject({
      allocationPreview: {
        currencyOptions: [
          { currency: "USD", label: "USD" },
          { currency: "EUR", label: "EUR" },
          { currency: "JPY", label: "JPY" },
        ],
        referenceRatesByDate: {
          "2024-08-21": {
            EUR: 0.9,
            JPY: 140,
          },
          "2024-08-23": {
            EUR: 0.945,
            JPY: 144.9,
          },
        },
      },
    });
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
          historicalTrend: {
            summary:
              "EUR moved up 5% against USD from 2024-08-21 to 2024-08-23. Historical reference only, not a forecast.",
          },
          allocationPreview: {
            baseCurrency: "USD",
            startingAmount: 10_000,
            status: "ready",
            summary:
              "Manual 50% USD / 50% EUR allocation moved from 10,000 USD to 9,761.9 USD. Historical reference only.",
            currencyOptions: [
              { currency: "USD", label: "USD" },
              { currency: "EUR", label: "EUR" },
            ],
            referenceRatesByDate: {
              "2024-08-21": { EUR: 0.9 },
              "2024-08-23": { EUR: 0.945 },
            },
            allocations: [
              { currency: "USD", percent: 50, label: "50% USD" },
              { currency: "EUR", percent: 50, label: "50% EUR" },
            ],
            points: [
              { date: "2024-08-21", value: 10_000, label: "10,000 USD" },
              { date: "2024-08-23", value: 9_761.9, label: "9,761.9 USD" },
            ],
          },
          simulationHistory: {
            entries: [
              {
                id: "sim-1",
                sourceCurrency: "USD",
                targetCurrency: "EUR",
                sourceAmount: 2500,
                convertedAmount: 2252.5,
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
    expect(html).toContain('class="brand-icon"');
    expect(html).toContain('data-theme="light"');
    expect(html).toContain('aria-label="Toggle dashboard theme"');
    expect(html).toContain('aria-pressed="false"');
    expect(html).toContain("Dark mode");
    expect(html).toContain("Hypothetical starting balance");
    expect(html).toContain("10,000 USD");
    expect(html).toContain("Daily reference rates, not real-time quotes.");
    expect(html).toContain("No deposits, withdrawals, or trades.");
    expect(html).toContain("Supported currencies");
    expect(html).toContain("USD");
    expect(html).toContain("Unsupported requested currencies");
    expect(html).toContain("TWD");
    expect(html).toContain("Latest daily reference rates");
    expect(html).toContain('data-currency-selector="true"');
    expect(html).toContain('data-motion-role="active-currency-indicator"');
    expect(html).toContain('data-selected-currency="EUR"');
    expect(html).toContain('data-currency-detail="EUR"');
    expect(html).toContain('data-rate-value="0.901"');
    expect(html).toContain("2024-08-23");
    expect(html).toContain("1 USD = 0.901 EUR");
    expect(html).toContain("Historical line chart");
    expect(html).toContain("Historical reference only, not a forecast.");
    expect(html).toContain("Manual allocation historical preview");
    expect(html).toContain("Choose currencies and allocation");
    expect(html).toContain('aria-label="First allocation currency"');
    expect(html).toContain('aria-label="Second allocation currency"');
    expect(html).toContain('aria-label="First allocation percent"');
    expect(html).toContain('name="first-allocation-percent"');
    expect(html).toContain('type="range"');
    expect(html).toContain("Manual 50% USD / 50% EUR allocation moved");
    expect(html).toContain("50% USD");
    expect(html).toContain("50% EUR");
    expect(html).toContain("9,761.9 USD");
    expect(html).toContain("2,500 USD");
    expect(html).toContain("2,252.5 EUR");
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
          historicalTrend: {
            summary:
              "Historical movement summary will appear after daily reference rates load.",
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
        }}
      />,
    );

    expect(html).toContain("No latest reference rates are available.");
    expect(html).toContain("Unsupported requested currencies");
    expect(html).toContain("TWD");
  });

  it("renders bottom navigation as the only section navigation", () => {
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
        }}
      />,
    );

    expect(html).not.toContain('aria-label="Main actions"');
    expect(html).not.toContain('class="action-strip"');
    expect(html).toContain('data-section-target="trend"');
    expect(html).toContain('data-section-target="simulation"');
    expect(html).toContain('data-section-target="history"');
    expect(html).toContain('data-bottom-nav-shell="true"');
    expect(html).toContain(">Simulate</button>");
    expect(html).toContain(">Trend</button>");
    expect(html).toContain('aria-current="page"');
    expect(html).not.toContain("繚");
  });

  it("keeps bottom navigation fixed to the viewport bottom", () => {
    const styles = readFileSync(
      resolve(process.cwd(), "src/client/styles.css"),
      "utf8",
    );

    expect(styles).toContain(".bottom-nav {\n  position: fixed;");
    expect(styles).toContain("left: 50%;");
    expect(styles).toContain("transform: translateX(-50%);");
    expect(styles).not.toContain(".bottom-nav {\n  position: sticky;");
  });

  it("defines readable light and dark theme tokens", () => {
    const styles = readFileSync(
      resolve(process.cwd(), "src/client/styles.css"),
      "utf8",
    );
    const requiredThemeTokens = [
      "--page-bg:",
      "--card-bg:",
      "--elevated-surface:",
      "--text-primary:",
      "--text-secondary:",
      "--text-muted:",
      "--text-accent:",
      "--border:",
      "--button-bg:",
      "--button-hover-bg:",
      "--active-nav-bg:",
    ];
    const lightThemeBlock =
      styles.match(/\.app-shell\[data-theme="light"\]\s*\{[^}]+\}/s)?.[0] ??
      "";
    const darkThemeBlock =
      styles.match(/\.app-shell\[data-theme="dark"\]\s*\{[^}]+\}/s)?.[0] ??
      "";

    expect(lightThemeBlock).toContain('.app-shell[data-theme="light"]');
    expect(darkThemeBlock).toContain('.app-shell[data-theme="dark"]');

    for (const token of requiredThemeTokens) {
      expect(lightThemeBlock).toContain(token);
      expect(darkThemeBlock).toContain(token);
    }
  });
});
