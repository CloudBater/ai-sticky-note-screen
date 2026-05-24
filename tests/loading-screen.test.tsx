/**
 * loading-screen.test.tsx
 *
 * Guards the loading / error overlay:
 *   1. DashboardApp with loadingState="loading" renders the loading overlay
 *   2. DashboardApp with loadingState="error"   renders the error overlay
 *   3. DashboardApp without loadingState (or "ready") does NOT show the overlay
 *   4. Structural contracts: ARIA, data attributes, animation marker
 *   5. CSS contracts: keyframes, overlay class, animation property
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DashboardApp } from "../src/client/DashboardApp";
import type { DashboardViewModel } from "../src/client/dashboard";

const baseViewModel: DashboardViewModel = {
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
  currencySupport: { supported: ["USD", "EUR"], unsupported: [] },
  currencyCatalog: { USD: "US Dollar", EUR: "Euro" },
  latestRates: {
    baseCurrency: "USD",
    dataDate: "Loading...",
    cards: [],
  },
  historicalTrend: {
    summary: "",
    baseCurrency: "USD",
    symbol: "EUR",
    points: [],
    allSeries: [],
  },
  simulationHistory: { entries: [] },
};

const readyViewModel: DashboardViewModel = {
  ...baseViewModel,
  latestRates: {
    baseCurrency: "USD",
    dataDate: "2024-08-23",
    cards: [{ currency: "EUR", label: "1 USD = 0.901 EUR", rate: 0.901 }],
  },
  historicalTrend: {
    ...baseViewModel.historicalTrend,
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
};

// ── loading state ─────────────────────────────────────────────────────────────

describe("loading overlay — loadingState='loading'", () => {
  it("renders the loading screen overlay", () => {
    const html = renderToStaticMarkup(
      <DashboardApp viewModel={baseViewModel} loadingState="loading" />,
    );
    expect(html).toContain('data-loading-screen="loading"');
  });

  it("overlay has role=status for live-region accessibility", () => {
    const html = renderToStaticMarkup(
      <DashboardApp viewModel={baseViewModel} loadingState="loading" />,
    );
    expect(html).toContain('role="status"');
  });

  it("overlay carries an aria-label describing the wait", () => {
    const html = renderToStaticMarkup(
      <DashboardApp viewModel={baseViewModel} loadingState="loading" />,
    );
    // aria-label sits on the same element as data-loading-screen; search full HTML
    expect(html).toContain('aria-label="Loading daily reference rates"');
  });

  it("contains an animated element marked data-loading-animation", () => {
    const html = renderToStaticMarkup(
      <DashboardApp viewModel={baseViewModel} loadingState="loading" />,
    );
    expect(html).toContain("data-loading-animation");
  });

  it("shows a human-readable loading message", () => {
    const html = renderToStaticMarkup(
      <DashboardApp viewModel={baseViewModel} loadingState="loading" />,
    );
    const screen = html.slice(
      html.indexOf('data-loading-screen="loading"'),
      html.indexOf('data-loading-screen="loading"') + 600,
    );
    // Some text that tells the user what is happening
    expect(screen).toMatch(/[Ll]oad|[Ff]etch|[Rr]ates/);
  });
});

// ── error state ───────────────────────────────────────────────────────────────

describe("loading overlay — loadingState='error'", () => {
  it("renders the error screen overlay", () => {
    const html = renderToStaticMarkup(
      <DashboardApp viewModel={baseViewModel} loadingState="error" />,
    );
    expect(html).toContain('data-loading-screen="error"');
  });

  it("error screen has role=alert", () => {
    const html = renderToStaticMarkup(
      <DashboardApp viewModel={baseViewModel} loadingState="error" />,
    );
    expect(html).toContain('role="alert"');
  });

  it("error screen contains a human-readable error message", () => {
    const html = renderToStaticMarkup(
      <DashboardApp viewModel={baseViewModel} loadingState="error" />,
    );
    const screen = html.slice(
      html.indexOf('data-loading-screen="error"'),
      html.indexOf('data-loading-screen="error"') + 600,
    );
    expect(screen).toMatch(/[Uu]nable|[Ee]rror|[Ff]ail|[Rr]etry/);
  });

  it("error screen still carries data-loading-animation element", () => {
    const html = renderToStaticMarkup(
      <DashboardApp viewModel={baseViewModel} loadingState="error" />,
    );
    expect(html).toContain("data-loading-animation");
  });
});

// ── ready / no overlay ────────────────────────────────────────────────────────

describe("loading overlay — no loadingState (ready)", () => {
  it("does not show loading screen when loadingState is omitted", () => {
    const html = renderToStaticMarkup(
      <DashboardApp viewModel={readyViewModel} />,
    );
    expect(html).not.toContain("data-loading-screen");
  });

  it("does not show loading screen when loadingState='ready'", () => {
    const html = renderToStaticMarkup(
      <DashboardApp viewModel={readyViewModel} loadingState="ready" />,
    );
    expect(html).not.toContain("data-loading-screen");
  });
});

// ── bootstrap source contract ─────────────────────────────────────────────────

describe("dashboard-bootstrap — loadingState wiring", () => {
  const bootstrap = readFileSync(
    resolve(process.cwd(), "src/client/dashboard-bootstrap.tsx"),
    "utf8",
  );

  it("bootstrap passes loadingState to DashboardApp", () => {
    expect(bootstrap).toContain("loadingState");
  });

  it("bootstrap uses loading state during initial fetch", () => {
    expect(bootstrap).toMatch(/loadingState[=:]["']?loading/);
  });

  it("bootstrap uses error state on fetch failure", () => {
    expect(bootstrap).toMatch(/loadingState[=:]["']?error/);
  });
});

// ── CSS contracts ─────────────────────────────────────────────────────────────

describe("loading overlay — CSS contracts", () => {
  const styles = readFileSync(
    resolve(process.cwd(), "src/client/styles.css"),
    "utf8",
  );

  it("CSS defines the loading-screen overlay class", () => {
    expect(styles).toContain(".loading-screen");
  });

  it("loading-screen is full-page fixed overlay", () => {
    const block = styles.slice(
      styles.indexOf(".loading-screen"),
      styles.indexOf(".loading-screen") + 300,
    );
    expect(block).toContain("position: fixed");
  });

  it("CSS defines @keyframes for the loading animation", () => {
    expect(styles).toContain("@keyframes loading-spin");
  });

  it("loading animation element uses the spin keyframes", () => {
    expect(styles).toContain(".loading-ring");
  });

  it("loading screen has a fade-out transition for smooth dismiss", () => {
    const block = styles.slice(
      styles.indexOf(".loading-screen"),
      styles.indexOf(".loading-screen") + 400,
    );
    expect(block).toContain("transition");
  });
});
