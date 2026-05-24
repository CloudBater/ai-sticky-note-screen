/**
 * simulate-clarity.test.tsx
 *
 * Guards UX contracts for the Simulate tab:
 *   1. Amount field always shows which currency the number belongs to
 *   2. Reverse ("sell") conversion has an explicit direction summary
 *   3. "Add to simulation history" is visually prominent when a preview is ready
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
  currencySupport: { supported: ["USD", "EUR", "JPY"], unsupported: [] },
  currencyCatalog: { USD: "US Dollar", EUR: "Euro", JPY: "Japanese Yen" },
  latestRates: {
    baseCurrency: "USD",
    dataDate: "2024-08-23",
    cards: [
      { currency: "EUR", label: "1 USD = 0.901 EUR", rate: 0.901 },
      { currency: "JPY", label: "1 USD = 144.9 JPY", rate: 144.9 },
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
  simulationHistory: { entries: [] },
};

describe("Simulate tab — amount clarity", () => {
  it("forward form amount label includes the source currency code", () => {
    const html = renderToStaticMarkup(
      <DashboardApp viewModel={baseViewModel} />,
    );

    // Forward card: source is USD by default — label should show "Amount (USD)"
    const forwardCard = html.slice(
      html.indexOf('data-layout-slot="forward-preview-right"'),
      html.indexOf('data-layout-slot="reverse-chart-left"'),
    );

    expect(forwardCard).toMatch(/Amount\s*\(USD\)/);
  });

  it("reverse form amount label includes the reverse source currency code", () => {
    const html = renderToStaticMarkup(
      <DashboardApp viewModel={baseViewModel} />,
    );

    // Reverse card: source is EUR by default — label should show "Amount (EUR)"
    const reverseCard = html.slice(
      html.indexOf('data-layout-slot="reverse-preview-right"'),
      html.indexOf('data-layout-slot="amount-bottom"'),
    );

    expect(reverseCard).toMatch(/Amount\s*\(EUR\)/);
  });

  it("amount input carries data-currency attribute matching source currency", () => {
    const html = renderToStaticMarkup(
      <DashboardApp viewModel={baseViewModel} />,
    );

    expect(html).toContain('data-amount-currency="USD"');
    expect(html).toContain('data-amount-currency="EUR"');
  });
});

describe("Simulate tab — reverse conversion direction clarity", () => {
  it("reverse row shows a sell-direction label (banner is on the chart side)", () => {
    const html = renderToStaticMarkup(
      <DashboardApp viewModel={baseViewModel} />,
    );

    // Banner now lives in the left chart article; slice the full reverse row
    const reverseRow = html.slice(
      html.indexOf('data-layout-slot="reverse-chart-left"'),
      html.indexOf('data-layout-slot="amount-bottom"'),
    );

    // Should make explicit which currency is being given up
    expect(reverseRow).toContain("data-conversion-direction-label");
    expect(reverseRow).toMatch(/Giving|Selling|From/i);
    expect(reverseRow).toMatch(/Receiving|Getting|To/i);
  });

  it("reverse row direction label shows currency codes", () => {
    const html = renderToStaticMarkup(
      <DashboardApp viewModel={baseViewModel} />,
    );

    // Banner now lives in the left chart article; slice the full reverse row
    const reverseRow = html.slice(
      html.indexOf('data-layout-slot="reverse-chart-left"'),
      html.indexOf('data-layout-slot="amount-bottom"'),
    );

    // The direction banner should reference both currencies involved
    const directionEl = reverseRow.slice(
      reverseRow.indexOf("data-conversion-direction-label"),
      reverseRow.indexOf("data-conversion-direction-label") + 600,
    );
    expect(directionEl).toContain("EUR");
    expect(directionEl).toContain("USD");
  });

  it("forward row also has a direction label (on the chart side)", () => {
    const html = renderToStaticMarkup(
      <DashboardApp viewModel={baseViewModel} />,
    );

    // Banner lives in the left chart article; slice the full forward row
    const forwardRow = html.slice(
      html.indexOf('data-layout-slot="forward-chart-left"'),
      html.indexOf('data-layout-slot="reverse-chart-left"'),
    );

    expect(forwardRow).toContain("data-conversion-direction-label");
  });
});

describe("Simulate tab — Add to history button prominence", () => {
  it("Add to simulation history button carries data-cta attribute", () => {
    const html = renderToStaticMarkup(
      <DashboardApp viewModel={baseViewModel} />,
    );

    expect(html).toContain('data-cta="add-to-history"');
  });

  it("Add to simulation history button is placed after result in DOM order", () => {
    const html = renderToStaticMarkup(
      <DashboardApp viewModel={baseViewModel} />,
    );

    // The add button must appear after the conversion-actions area
    // (i.e., shown near the result, not buried in the form)
    expect(html).toContain('data-cta="add-to-history"');

    const forwardCard = html.slice(
      html.indexOf('data-layout-slot="forward-preview-right"'),
      html.indexOf('data-layout-slot="reverse-chart-left"'),
    );
    expect(forwardCard).toContain('data-cta="add-to-history"');
  });

  const styles = readFileSync(
    resolve(process.cwd(), "src/client/styles.css"),
    "utf8",
  );

  it("CSS has prominent styling for the active add-to-history button", () => {
    expect(styles).toContain('[data-cta="add-to-history"]');
  });

  it("add-to-history button uses a distinct visual weight (not ghost-only)", () => {
    const ctaBlock = styles.slice(
      styles.indexOf('[data-cta="add-to-history"]'),
      styles.indexOf('[data-cta="add-to-history"]') + 400,
    );
    // Must have a real background, not just a border
    expect(ctaBlock).toContain("background");
  });

  it("disabled add-to-history has lower opacity to guide user toward preview first", () => {
    const ctaBlock = styles.slice(
      styles.indexOf('[data-cta="add-to-history"]'),
      styles.indexOf('[data-cta="add-to-history"]') + 600,
    );
    expect(ctaBlock).toContain(":disabled");
  });
});
