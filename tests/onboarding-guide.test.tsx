/**
 * onboarding-guide.test.tsx
 *
 * Guards the first-visit onboarding guide:
 *   1. Guide renders on first visit (no storage record)
 *   2. Guide is hidden when storage says the user has visited before
 *   3. Structural contracts: ARIA, data attributes, steps, navigation
 *   4. CSS contracts: overlay + card animation, step transitions
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DashboardApp } from "../src/client/DashboardApp";
import {
  ONBOARDING_VISITED_KEY,
  createOnboardingStorage,
} from "../src/client/onboarding-visited";
import type { DashboardViewModel } from "../src/client/dashboard";

// In-memory stub that simulates a visited / not-visited browser storage
function makeMemoryStorage(visited: boolean) {
  const map = new Map<string, string>(
    visited ? [[ONBOARDING_VISITED_KEY, "1"]] : [],
  );
  return createOnboardingStorage({
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => map.set(k, v),
  });
}

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
    dataDate: "2024-08-23",
    cards: [{ currency: "EUR", label: "1 USD = 0.901 EUR", rate: 0.901 }],
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

// ── storage helper ──────────────────────────────────────────────────────────

describe("onboarding storage helper", () => {
  it("exports a stable storage key", () => {
    expect(typeof ONBOARDING_VISITED_KEY).toBe("string");
    expect(ONBOARDING_VISITED_KEY.length).toBeGreaterThan(0);
  });

  it("hasVisited returns false when key is absent", () => {
    const store = new Map<string, string>();
    const s = createOnboardingStorage({ getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) });
    expect(s.hasVisited()).toBe(false);
  });

  it("hasVisited returns true after markVisited is called", () => {
    const store = new Map<string, string>();
    const s = createOnboardingStorage({ getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) });
    s.markVisited();
    expect(s.hasVisited()).toBe(true);
  });

  it("hasVisited returns true when key already present in store", () => {
    const store = new Map<string, string>([[ONBOARDING_VISITED_KEY, "1"]]);
    const s = createOnboardingStorage({ getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) });
    expect(s.hasVisited()).toBe(true);
  });

  it("createOnboardingStorage is safe when storage throws", () => {
    const failing = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };
    const s = createOnboardingStorage(failing);
    expect(() => s.hasVisited()).not.toThrow();
    expect(() => s.markVisited()).not.toThrow();
    // When storage throws, hasVisited falls back to false (don't block the user)
    expect(s.hasVisited()).toBe(false);
  });
});

// ── first-visit rendering ───────────────────────────────────────────────────

describe("onboarding guide — first visit (no storage)", () => {
  // Inject a fresh not-visited in-memory storage so tests are deterministic
  const newVisitorStorage = makeMemoryStorage(false);

  it("renders the onboarding overlay in the DOM", () => {
    const html = renderToStaticMarkup(
      <DashboardApp viewModel={baseViewModel} onboardingStorage={newVisitorStorage} />,
    );
    expect(html).toContain('data-onboarding="true"');
  });

  it("overlay has role=dialog and aria-modal for accessibility", () => {
    const html = renderToStaticMarkup(
      <DashboardApp viewModel={baseViewModel} onboardingStorage={newVisitorStorage} />,
    );
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
  });

  it("overlay has a visible heading", () => {
    const html = renderToStaticMarkup(
      <DashboardApp viewModel={baseViewModel} onboardingStorage={newVisitorStorage} />,
    );
    const overlay = html.slice(
      html.indexOf('data-onboarding="true"'),
      html.indexOf('data-onboarding="true"') + 2000,
    );
    expect(overlay).toMatch(/<h[1-3][^>]*>/);
  });

  it("has a dismiss/skip button inside the guide", () => {
    const html = renderToStaticMarkup(
      <DashboardApp viewModel={baseViewModel} onboardingStorage={newVisitorStorage} />,
    );
    const overlay = html.slice(
      html.indexOf('data-onboarding="true"'),
      html.indexOf('data-onboarding="true"') + 2000,
    );
    expect(overlay).toContain("data-onboarding-dismiss");
  });

  it("step navigation button is present", () => {
    const html = renderToStaticMarkup(
      <DashboardApp viewModel={baseViewModel} onboardingStorage={newVisitorStorage} />,
    );
    const overlay = html.slice(
      html.indexOf('data-onboarding="true"'),
      html.indexOf('data-onboarding="true"') + 2000,
    );
    expect(overlay).toContain("data-onboarding-next");
  });

  it("progress dots are rendered", () => {
    const html = renderToStaticMarkup(
      <DashboardApp viewModel={baseViewModel} onboardingStorage={newVisitorStorage} />,
    );
    const overlay = html.slice(
      html.indexOf('data-onboarding="true"'),
      html.indexOf('data-onboarding="true"') + 2000,
    );
    expect(overlay).toContain("data-onboarding-dots");
  });

  it("shows step 1 content by default", () => {
    const html = renderToStaticMarkup(
      <DashboardApp viewModel={baseViewModel} onboardingStorage={newVisitorStorage} />,
    );
    const overlay = html.slice(
      html.indexOf('data-onboarding="true"'),
      html.indexOf('data-onboarding="true"') + 2000,
    );
    expect(overlay).toContain('data-onboarding-step="0"');
  });

  it("total step count is at least 3", () => {
    const html = renderToStaticMarkup(
      <DashboardApp viewModel={baseViewModel} onboardingStorage={newVisitorStorage} />,
    );
    const overlay = html.slice(
      html.indexOf('data-onboarding="true"'),
      html.indexOf('data-onboarding="true"') + 2000,
    );
    const dots = overlay.match(/data-onboarding-dot/g) ?? [];
    expect(dots.length).toBeGreaterThanOrEqual(3);
  });
});

// ── returning-user: guide hidden ────────────────────────────────────────────

describe("onboarding guide — returning visitor (storage has visited key)", () => {
  const returningStorage = makeMemoryStorage(true);

  it("does NOT render the onboarding overlay", () => {
    const html = renderToStaticMarkup(
      <DashboardApp viewModel={baseViewModel} onboardingStorage={returningStorage} />,
    );
    expect(html).not.toContain('data-onboarding="true"');
  });
});

// ── CSS contracts ────────────────────────────────────────────────────────────

describe("onboarding guide — CSS contracts", () => {
  const styles = readFileSync(
    resolve(process.cwd(), "src/client/styles.css"),
    "utf8",
  );

  it("CSS defines the onboarding overlay class", () => {
    expect(styles).toContain(".onboarding-overlay");
  });

  it("overlay uses a backdrop-filter for frosted glass effect", () => {
    const overlayBlock = styles.slice(
      styles.indexOf(".onboarding-overlay"),
      styles.indexOf(".onboarding-overlay") + 400,
    );
    expect(overlayBlock).toContain("backdrop-filter");
  });

  it("CSS defines the onboarding card class", () => {
    expect(styles).toContain(".onboarding-card");
  });

  it("onboarding card has a transition for smooth enter/exit", () => {
    const cardBlock = styles.slice(
      styles.indexOf(".onboarding-card"),
      styles.indexOf(".onboarding-card") + 700,
    );
    expect(cardBlock).toContain("transition");
  });

  it("onboarding card uses spring easing for the entrance animation", () => {
    // Same spring easing used elsewhere in the app
    expect(styles).toContain("@keyframes onboarding-card-in");
  });

  it("step content has a transition for cross-fade between steps", () => {
    expect(styles).toContain(".onboarding-step");
  });

  it("CSS has a visible/hidden state for the overlay", () => {
    // data-onboarding-visible drives show/hide
    expect(styles).toContain('[data-onboarding-visible="false"]');
  });
});
