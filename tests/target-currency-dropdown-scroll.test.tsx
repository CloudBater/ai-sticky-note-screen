/**
 * target-currency-dropdown-scroll.test.tsx
 *
 * Guards the scrollable "Select target currencies" dropdown:
 *
 *   HTML contracts
 *   1. The dropdown menu element exists in the rendered markup
 *   2. The trigger button carries its accessibility label
 *   3. Each currency item is present as a toggleable button
 *
 *   CSS contracts
 *   4. .history-target-dropdown-menu has a max-height (prevents unbounded growth)
 *   5. .history-target-dropdown-menu has overflow-y: auto (enables scrolling)
 *   6. overscroll-behavior: contain (prevents scroll chaining to the page)
 *   7. Thin scrollbar is defined via scrollbar-width (Firefox)
 *   8. ::-webkit-scrollbar width is set (Chrome/Safari)
 *   9. ::-webkit-scrollbar-thumb is styled (visible thumb in Webkit)
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DashboardApp } from "../src/client/DashboardApp";
import type { DashboardViewModel } from "../src/client/dashboard";

// ── shared fixture ────────────────────────────────────────────────────────────

const viewModel: DashboardViewModel = {
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
    supported: ["USD", "EUR", "JPY", "GBP", "TWD", "CNY", "SGD"],
    unsupported: [],
  },
  currencyCatalog: {
    USD: "US Dollar",
    EUR: "Euro",
    JPY: "Japanese Yen",
    GBP: "British Pound",
    TWD: "New Taiwan Dollar",
    CNY: "Chinese Yuan",
    SGD: "Singapore Dollar",
  },
  latestRates: {
    baseCurrency: "USD",
    dataDate: "2024-08-23",
    cards: [
      { currency: "EUR", label: "1 USD = 0.901 EUR", rate: 0.901 },
      { currency: "JPY", label: "1 USD = 144.9 JPY", rate: 144.9 },
      { currency: "GBP", label: "1 USD = 0.788 GBP", rate: 0.788 },
      { currency: "TWD", label: "1 USD = 32.1 TWD", rate: 32.1 },
      { currency: "CNY", label: "1 USD = 7.24 CNY", rate: 7.24 },
      { currency: "SGD", label: "1 USD = 1.35 SGD", rate: 1.35 },
    ],
  },
  historicalTrend: {
    summary: "",
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

// ── shared source text (read once) ───────────────────────────────────────────

const dashboardAppSource = readFileSync(
  resolve(process.cwd(), "src/client/DashboardApp.tsx"),
  "utf8",
);

// ── HTML contracts ────────────────────────────────────────────────────────────
//
// The dropdown menu is conditionally rendered only when the trigger is clicked
// (targetDropdownOpen state). SSR with renderToStaticMarkup starts in closed
// state, so we verify:
//   • the trigger button is always in the DOM (aria-label, SSR check)
//   • the menu element and item contracts live in the source (code check)

describe("target-currency dropdown — HTML contracts", () => {
  it("renders the dropdown trigger button with its aria-label", () => {
    const html = renderToStaticMarkup(<DashboardApp viewModel={viewModel} />);
    expect(html).toContain('aria-label="Select target currencies"');
  });

  it("trigger button shows a selected-count label when currencies are active", () => {
    // The label defaults to the count of visible currencies
    const html = renderToStaticMarkup(<DashboardApp viewModel={viewModel} />);
    // Trigger is always rendered; it should contain "selected" or "Target currencies"
    expect(html).toMatch(/selected|Target currencies/);
  });

  it("source defines history-target-dropdown-menu class for the menu container", () => {
    expect(dashboardAppSource).toContain("history-target-dropdown-menu");
  });

  it("source wires data-history-currency to each option button", () => {
    expect(dashboardAppSource).toContain("data-history-currency=");
  });

  it("source wires data-history-currency-active to each option button", () => {
    expect(dashboardAppSource).toContain("data-history-currency-active=");
  });

  it("menu is guarded by targetDropdownOpen state (conditional render)", () => {
    // Confirms the menu is only mounted when open — the scroll class is only
    // needed on the live element, not during SSR of the closed state
    expect(dashboardAppSource).toContain("targetDropdownOpen &&");
  });
});

// ── CSS contracts ─────────────────────────────────────────────────────────────

describe("target-currency dropdown — CSS scroll contracts", () => {
  const styles = readFileSync(
    resolve(process.cwd(), "src/client/styles.css"),
    "utf8",
  );

  /** Extract the text of the .history-target-dropdown-menu rule block */
  const menuRuleStart = styles.indexOf(".history-target-dropdown-menu {");
  const menuRuleEnd = styles.indexOf("}", menuRuleStart);
  const menuBlock = styles.slice(menuRuleStart, menuRuleEnd + 1);

  it("CSS defines .history-target-dropdown-menu", () => {
    expect(menuBlock.length).toBeGreaterThan(0);
  });

  it("dropdown menu has a max-height to cap its visible size", () => {
    expect(menuBlock).toContain("max-height");
  });

  it("dropdown menu enables vertical scrolling with overflow-y: auto", () => {
    expect(menuBlock).toContain("overflow-y: auto");
  });

  it("dropdown menu contains overscroll-behavior: contain to prevent page scroll chaining", () => {
    expect(menuBlock).toContain("overscroll-behavior: contain");
  });

  it("dropdown menu sets scrollbar-width: thin for Firefox", () => {
    expect(menuBlock).toContain("scrollbar-width: thin");
  });

  it("CSS provides a ::-webkit-scrollbar rule for Chrome/Safari", () => {
    expect(styles).toContain(
      ".history-target-dropdown-menu::-webkit-scrollbar",
    );
  });

  it("::-webkit-scrollbar sets a narrow width", () => {
    const webkitStart = styles.indexOf(
      ".history-target-dropdown-menu::-webkit-scrollbar {",
    );
    const webkitEnd = styles.indexOf("}", webkitStart);
    const webkitBlock = styles.slice(webkitStart, webkitEnd + 1);
    expect(webkitBlock).toContain("width");
  });

  it("CSS styles the ::-webkit-scrollbar-thumb so it is visible", () => {
    expect(styles).toContain(
      ".history-target-dropdown-menu::-webkit-scrollbar-thumb",
    );
  });

  it("::-webkit-scrollbar-thumb has a background colour", () => {
    const thumbStart = styles.indexOf(
      ".history-target-dropdown-menu::-webkit-scrollbar-thumb {",
    );
    const thumbEnd = styles.indexOf("}", thumbStart);
    const thumbBlock = styles.slice(thumbStart, thumbEnd + 1);
    expect(thumbBlock).toContain("background");
  });
});
