/**
 * cross-currency-balance.test.tsx
 *
 * Guards the cross-currency ("multi-hop") conversion UX contract:
 *   - When the user's balance is in USD (10 000 USD) but they want to
 *     simulate CAD→BRL, the system must first derive how much CAD they
 *     have (USD→CAD), then cap the form amount to that derived value.
 *   - The UI must show the intermediate step ("from balance" note).
 *   - When source === balance currency no intermediate step is shown.
 *
 * These are static-markup contracts — no network calls.
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DashboardApp } from "../src/client/DashboardApp";
import type { DashboardViewModel } from "../src/client/dashboard";

/** Base model: balance is 10 000 USD, rates include CAD and BRL */
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
  currencySupport: {
    supported: ["USD", "EUR", "CAD", "BRL"],
    unsupported: [],
  },
  currencyCatalog: {
    USD: "US Dollar",
    EUR: "Euro",
    CAD: "Canadian Dollar",
    BRL: "Brazilian Real",
  },
  latestRates: {
    baseCurrency: "USD",
    dataDate: "2024-08-23",
    cards: [
      { currency: "EUR", label: "1 USD = 0.901 EUR", rate: 0.901 },
      { currency: "CAD", label: "1 USD = 1.35 CAD", rate: 1.35 },
      { currency: "BRL", label: "1 USD = 5.0 BRL", rate: 5.0 },
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

describe("cross-currency balance — utility", () => {
  it("available balance in source currency is exposed via data attribute when source !== balance currency", () => {
    const html = renderToStaticMarkup(
      <DashboardApp viewModel={baseViewModel} />,
    );

    // The simulation panel should expose available source balance somewhere
    // so the user knows how much CAD they can spend
    // Default forward source is USD (== balance currency), so for the reverse
    // card the source is EUR by default — check that a derived-balance note appears
    // We look for the data attribute marker that the UI renders to communicate
    // the cross-currency max amount
    expect(html).toContain("data-derived-balance");
  });

  it("when source currency equals balance currency, derived balance equals simulation balance", () => {
    const html = renderToStaticMarkup(
      <DashboardApp viewModel={baseViewModel} />,
    );

    // Forward card: source defaults to USD (== balance currency)
    // The derived balance should equal the raw simulation balance (10 000)
    const forwardCard = html.slice(
      html.indexOf('data-layout-slot="forward-preview-right"'),
      html.indexOf('data-layout-slot="reverse-chart-left"'),
    );

    // data-derived-balance="10000" (or similar numeric form)
    expect(forwardCard).toMatch(/data-derived-balance="10[,\s]?000"|data-derived-balance="10000"/);
  });
});

describe("cross-currency balance — UI note for intermediate step", () => {
  it("renders a from-balance note when source differs from balance currency", () => {
    const html = renderToStaticMarkup(
      <DashboardApp viewModel={baseViewModel} />,
    );

    // Reverse card: source defaults to EUR (≠ USD balance currency)
    const reverseCard = html.slice(
      html.indexOf('data-layout-slot="reverse-preview-right"'),
      html.indexOf('data-layout-slot="amount-bottom"'),
    );

    // Should contain a note explaining where the source currency comes from
    expect(reverseCard).toContain("data-from-balance-note");
  });

  it("from-balance note references the balance currency", () => {
    const html = renderToStaticMarkup(
      <DashboardApp viewModel={baseViewModel} />,
    );

    const reverseCard = html.slice(
      html.indexOf('data-layout-slot="reverse-preview-right"'),
      html.indexOf('data-layout-slot="amount-bottom"'),
    );

    const noteStart = reverseCard.indexOf("data-from-balance-note");
    const noteSnippet = reverseCard.slice(noteStart, noteStart + 400);

    // Should mention both the balance currency (USD) and the source currency (EUR)
    expect(noteSnippet).toContain("USD");
    expect(noteSnippet).toContain("EUR");
  });

  it("from-balance note shows how many source-currency units the balance converts to", () => {
    const html = renderToStaticMarkup(
      <DashboardApp viewModel={baseViewModel} />,
    );

    const reverseCard = html.slice(
      html.indexOf('data-layout-slot="reverse-preview-right"'),
      html.indexOf('data-layout-slot="amount-bottom"'),
    );

    const noteStart = reverseCard.indexOf("data-from-balance-note");
    const noteSnippet = reverseCard.slice(noteStart, noteStart + 400);

    // 10 000 USD × 0.901 (EUR/USD rate) = 9 010 EUR available
    // The note must show a derived amount in EUR (approximately 9010)
    expect(noteSnippet).toMatch(/9[,\s]?010|9010/);
  });

  it("no from-balance note on forward card when source matches balance currency", () => {
    const html = renderToStaticMarkup(
      <DashboardApp viewModel={baseViewModel} />,
    );

    // Forward card: source defaults to USD == balance currency
    const forwardCard = html.slice(
      html.indexOf('data-layout-slot="forward-preview-right"'),
      html.indexOf('data-layout-slot="reverse-chart-left"'),
    );

    // No intermediate conversion note needed — they already have USD
    expect(forwardCard).not.toContain("data-from-balance-note");
  });
});

describe("cross-currency balance — max amount constraint", () => {
  it("amount input max reflects derived source-currency balance", () => {
    const html = renderToStaticMarkup(
      <DashboardApp viewModel={baseViewModel} />,
    );

    const reverseCard = html.slice(
      html.indexOf('data-layout-slot="reverse-preview-right"'),
      html.indexOf('data-layout-slot="amount-bottom"'),
    );

    // 10 000 USD × 0.901 EUR/USD = 9010 EUR available
    // The amount input max should be constrained to ~9010
    expect(reverseCard).toMatch(/max="9[,\s]?0[0-9]{2}"|max="9010"/);
  });

  it("amount input max equals simulation balance when source === balance currency", () => {
    const html = renderToStaticMarkup(
      <DashboardApp viewModel={baseViewModel} />,
    );

    const forwardCard = html.slice(
      html.indexOf('data-layout-slot="forward-preview-right"'),
      html.indexOf('data-layout-slot="reverse-chart-left"'),
    );

    // Forward source is USD == balance currency; max is the raw balance (10 000)
    expect(forwardCard).toContain('max="10000"');
  });
});
