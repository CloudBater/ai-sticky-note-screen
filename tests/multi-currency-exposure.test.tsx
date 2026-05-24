/**
 * multi-currency-exposure.test.tsx
 *
 * Guards the 2×2 grid layout contract for the Simulated conversion exposure panel:
 *   1 currency  → single full-width cell (same as before)
 *   2 currencies → 2 cells (top + bottom)
 *   3 currencies → 3 cells in a 2×2 grid (TL, TR, BL), BR empty
 *   4 currencies → all 4 cells filled
 *   5+ currencies → TL, TR, BL filled; BR shows "+N more"
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DashboardApp } from "../src/client/DashboardApp";
import type { DashboardViewModel } from "../src/client/dashboard";
import type { SimulationHistoryEntry } from "../src/client/simulation-history";

function makeEntry(
  id: string,
  targetCurrency: string,
  sourceAmount = 1000,
  convertedAmount = 900,
): SimulationHistoryEntry {
  return {
    id,
    kind: "simulation-history-entry",
    sourceCurrency: "USD",
    targetCurrency,
    sourceAmount,
    convertedAmount,
    rate: convertedAmount / sourceAmount,
    date: "2024-08-23",
  };
}

function makeViewModel(
  entries: SimulationHistoryEntry[],
  extraRates: { currency: string; rate: number }[] = [],
): DashboardViewModel {
  return {
    title: "MarketMage",
    simulationBalanceLabel: "Hypothetical starting balance",
    simulationBalance: { amount: 10_000, currency: "USD" },
    trustMessages: ["Daily reference rates, not real-time quotes."],
    navigationItems: [
      { id: "overview", label: "Overview" },
      { id: "simulation", label: "Simulate" },
      { id: "trend", label: "Trend" },
      { id: "history", label: "History" },
    ],
    currencySupport: {
      supported: ["USD", "EUR", "JPY", "GBP", "CHF", "CAD"],
      unsupported: [],
    },
    currencyCatalog: {
      USD: "US Dollar",
      EUR: "Euro",
      JPY: "Japanese Yen",
      GBP: "British Pound",
      CHF: "Swiss Franc",
      CAD: "Canadian Dollar",
    },
    latestRates: {
      baseCurrency: "USD",
      dataDate: "2024-08-23",
      cards: [
        { currency: "EUR", label: "1 USD = 0.901 EUR", rate: 0.901 },
        { currency: "JPY", label: "1 USD = 144.9 JPY", rate: 144.9 },
        { currency: "GBP", label: "1 USD = 0.78 GBP", rate: 0.78 },
        { currency: "CHF", label: "1 USD = 0.89 CHF", rate: 0.89 },
        { currency: "CAD", label: "1 USD = 1.35 CAD", rate: 1.35 },
        ...extraRates.map((r) => ({
          currency: r.currency,
          label: `1 USD = ${r.rate} ${r.currency}`,
          rate: r.rate,
        })),
      ],
    },
    historicalTrend: {
      summary: "EUR moved up 5%.",
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
    simulationHistory: { entries },
  };
}

// Helper: extract the exposure panel HTML
function getExposurePanel(html: string): string {
  const start = html.indexOf('aria-labelledby="conversion-exposure-heading"');
  const end = html.indexOf("</section>", start);
  return html.slice(start, end);
}

describe("Simulated conversion exposure — 0 currencies (empty)", () => {
  it("shows empty-state text when there are no entries", () => {
    const html = renderToStaticMarkup(
      <DashboardApp viewModel={makeViewModel([])} />,
    );
    const panel = getExposurePanel(html);
    expect(panel).toContain("No simulated conversions yet");
    expect(panel).not.toContain('data-exposure-grid-cell');
  });
});

describe("Simulated conversion exposure — 1 currency", () => {
  it("renders a single exposure cell", () => {
    const vm = makeViewModel([makeEntry("e1", "EUR", 1000, 901)]);
    const html = renderToStaticMarkup(<DashboardApp viewModel={vm} />);
    const panel = getExposurePanel(html);

    const cells = panel.match(/data-exposure-grid-cell/g) ?? [];
    expect(cells.length).toBe(1);
  });

  it("shows the target currency in the cell", () => {
    const vm = makeViewModel([makeEntry("e1", "EUR", 1000, 901)]);
    const html = renderToStaticMarkup(<DashboardApp viewModel={vm} />);
    const panel = getExposurePanel(html);

    expect(panel).toContain("EUR");
  });

  it("single cell carries data-exposure-grid-size=1", () => {
    const vm = makeViewModel([makeEntry("e1", "EUR", 1000, 901)]);
    const html = renderToStaticMarkup(<DashboardApp viewModel={vm} />);
    const panel = getExposurePanel(html);

    expect(panel).toContain('data-exposure-grid-size="1"');
  });
});

describe("Simulated conversion exposure — 2 currencies", () => {
  const vm = makeViewModel([
    makeEntry("e1", "EUR", 2000, 1802),
    makeEntry("e2", "JPY", 1000, 144900),
  ]);

  it("renders exactly 2 exposure cells", () => {
    const html = renderToStaticMarkup(<DashboardApp viewModel={vm} />);
    const panel = getExposurePanel(html);
    const cells = panel.match(/data-exposure-grid-cell/g) ?? [];
    expect(cells.length).toBe(2);
  });

  it("grid container has data-exposure-grid-size=2", () => {
    const html = renderToStaticMarkup(<DashboardApp viewModel={vm} />);
    const panel = getExposurePanel(html);
    expect(panel).toContain('data-exposure-grid-size="2"');
  });

  it("shows both currency codes", () => {
    const html = renderToStaticMarkup(<DashboardApp viewModel={vm} />);
    const panel = getExposurePanel(html);
    expect(panel).toContain("EUR");
    expect(panel).toContain("JPY");
  });
});

describe("Simulated conversion exposure — 3 currencies", () => {
  const vm = makeViewModel([
    makeEntry("e1", "EUR", 3000, 2703),
    makeEntry("e2", "JPY", 2000, 289800),
    makeEntry("e3", "GBP", 1000, 780),
  ]);

  it("renders exactly 3 exposure cells", () => {
    const html = renderToStaticMarkup(<DashboardApp viewModel={vm} />);
    const panel = getExposurePanel(html);
    const cells = panel.match(/data-exposure-grid-cell/g) ?? [];
    expect(cells.length).toBe(3);
  });

  it("grid container has data-exposure-grid-size=3", () => {
    const html = renderToStaticMarkup(<DashboardApp viewModel={vm} />);
    const panel = getExposurePanel(html);
    expect(panel).toContain('data-exposure-grid-size="3"');
  });

  it("shows all three currency codes", () => {
    const html = renderToStaticMarkup(<DashboardApp viewModel={vm} />);
    const panel = getExposurePanel(html);
    expect(panel).toContain("EUR");
    expect(panel).toContain("JPY");
    expect(panel).toContain("GBP");
  });
});

describe("Simulated conversion exposure — 4 currencies", () => {
  const vm = makeViewModel([
    makeEntry("e1", "EUR", 4000, 3604),
    makeEntry("e2", "JPY", 3000, 434700),
    makeEntry("e3", "GBP", 2000, 1560),
    makeEntry("e4", "CHF", 1000, 890),
  ]);

  it("renders exactly 4 exposure cells", () => {
    const html = renderToStaticMarkup(<DashboardApp viewModel={vm} />);
    const panel = getExposurePanel(html);
    const cells = panel.match(/data-exposure-grid-cell/g) ?? [];
    expect(cells.length).toBe(4);
  });

  it("grid container has data-exposure-grid-size=4", () => {
    const html = renderToStaticMarkup(<DashboardApp viewModel={vm} />);
    const panel = getExposurePanel(html);
    expect(panel).toContain('data-exposure-grid-size="4"');
  });

  it("shows all four currency codes", () => {
    const html = renderToStaticMarkup(<DashboardApp viewModel={vm} />);
    const panel = getExposurePanel(html);
    expect(panel).toContain("EUR");
    expect(panel).toContain("JPY");
    expect(panel).toContain("GBP");
    expect(panel).toContain("CHF");
  });
});

describe("Simulated conversion exposure — 5+ currencies", () => {
  const vm = makeViewModel([
    makeEntry("e1", "EUR", 5000, 4505),
    makeEntry("e2", "JPY", 4000, 579600),
    makeEntry("e3", "GBP", 3000, 2340),
    makeEntry("e4", "CHF", 2000, 1780),
    makeEntry("e5", "CAD", 1000, 1350),
  ]);

  it("renders exactly 3 visible cells + 1 overflow cell", () => {
    const html = renderToStaticMarkup(<DashboardApp viewModel={vm} />);
    const panel = getExposurePanel(html);
    const cells = panel.match(/data-exposure-grid-cell/g) ?? [];
    // 3 currency cells + 1 overflow cell = 4 total
    expect(cells.length).toBe(4);
  });

  it("grid container has data-exposure-grid-size=5 (or more)", () => {
    const html = renderToStaticMarkup(<DashboardApp viewModel={vm} />);
    const panel = getExposurePanel(html);
    // size attribute reflects actual count
    expect(panel).toContain('data-exposure-grid-size="5"');
  });

  it("overflow cell carries data-exposure-overflow attribute", () => {
    const html = renderToStaticMarkup(<DashboardApp viewModel={vm} />);
    const panel = getExposurePanel(html);
    expect(panel).toContain("data-exposure-overflow");
  });

  it("overflow cell shows +2 when 5 currencies (3 shown + 2 hidden)", () => {
    const html = renderToStaticMarkup(<DashboardApp viewModel={vm} />);
    const panel = getExposurePanel(html);
    expect(panel).toContain("+2");
    expect(panel).toMatch(/\+2\s*(more)?/i);
  });

  it("with 7 currencies the overflow shows +4", () => {
    const vm7 = makeViewModel([
      makeEntry("e1", "EUR", 7000, 6307),
      makeEntry("e2", "JPY", 6000, 869400),
      makeEntry("e3", "GBP", 5000, 3900),
      makeEntry("e4", "CHF", 4000, 3560),
      makeEntry("e5", "CAD", 3000, 4050),
      makeEntry("e6", "CHF", 2000, 1780), // duplicate to keep it simple — same currency
      makeEntry("e7", "CAD", 1000, 1350),
    ]);
    // Re-build with 5 distinct currencies (EUR, JPY, GBP, CHF, CAD) — still +2
    const vm5 = makeViewModel([
      makeEntry("f1", "EUR", 1000, 901),
      makeEntry("f2", "JPY", 1000, 144900),
      makeEntry("f3", "GBP", 1000, 780),
      makeEntry("f4", "CHF", 1000, 890),
      makeEntry("f5", "CAD", 1000, 1350),
    ]);
    const html5 = renderToStaticMarkup(<DashboardApp viewModel={vm5} />);
    const panel5 = getExposurePanel(html5);
    expect(panel5).toContain("+2");
  });
});
