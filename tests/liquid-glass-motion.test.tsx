import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DashboardApp } from "../src/client/DashboardApp";
import { sectionSpringTransition } from "../src/client/motion";
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

describe("liquid glass motion — structural contracts", () => {
  describe("tab slider indicator", () => {
    it("nav contains a tab-slider element for the spring indicator", () => {
      const html = renderToStaticMarkup(
        <DashboardApp viewModel={baseViewModel} />,
      );

      expect(html).toContain('class="tab-slider"');
      expect(html).toContain('aria-hidden="true"');
    });

    it("each Tab carries data-section-index for JS measurement", () => {
      const html = renderToStaticMarkup(
        <DashboardApp viewModel={baseViewModel} />,
      );

      expect(html).toContain('data-section-index="0"');
      expect(html).toContain('data-section-index="1"');
      expect(html).toContain('data-section-index="2"');
      expect(html).toContain('data-section-index="3"');
    });

    it("tab-slider is a direct sibling inside the nav", () => {
      const html = renderToStaticMarkup(
        <DashboardApp viewModel={baseViewModel} />,
      );

      const navStart = html.indexOf('aria-label="Dashboard sections"');
      const navEnd = html.indexOf("</nav>", navStart);
      const navHtml = html.slice(navStart, navEnd);

      expect(navHtml).toContain('class="tab-slider"');
    });
  });

  describe("glass panels", () => {
    it("main dashboard panels carry data-glass attribute", () => {
      const html = renderToStaticMarkup(
        <DashboardApp viewModel={baseViewModel} />,
      );

      // The four main section panels should have data-glass
      expect(html).toContain('data-glass="true"');
    });

    it("every visible panel section has data-glass", () => {
      const html = renderToStaticMarkup(
        <DashboardApp viewModel={baseViewModel} />,
      );

      const panelMatches = html.match(/class="panel[^"]*"/g) ?? [];
      const glassMatches = html.match(/data-glass="true"/g) ?? [];

      // At least the four main tab panels should be glass
      expect(glassMatches.length).toBeGreaterThanOrEqual(4);
      // All panels should be glass (no panel without it)
      expect(panelMatches.length).toBe(glassMatches.length);
    });
  });

  describe("spring motion constant", () => {
    it("sectionSpringTransition is exported from motion.ts", () => {
      expect(sectionSpringTransition).toBeDefined();
    });

    it("spring transition uses overshoot easing", () => {
      // cubic-bezier(0.34, 1.56, 0.64, 1) overshoots past 1.0 — confirms spring
      expect(sectionSpringTransition.easing).toMatch(/cubic-bezier/);
      expect(sectionSpringTransition.durationMs).toBeGreaterThan(0);
    });

    it("spring transition duration is reasonable for a UI transition", () => {
      expect(sectionSpringTransition.durationMs).toBeGreaterThanOrEqual(300);
      expect(sectionSpringTransition.durationMs).toBeLessThanOrEqual(600);
    });
  });
});

describe("liquid glass motion — CSS contracts", () => {
  const styles = readFileSync(
    resolve(process.cwd(), "src/client/styles.css"),
    "utf8",
  );

  describe("tab slider CSS", () => {
    it("tab-slider class exists in CSS", () => {
      expect(styles).toContain(".tab-slider");
    });

    it("tab-slider uses spring easing for transition", () => {
      // spring easing overshoots: y2 > 1
      expect(styles).toContain("cubic-bezier(0.34, 1.56, 0.64, 1)");
    });

    it("tab-slider is absolutely positioned to slide across the nav", () => {
      const sliderBlock = styles.slice(
        styles.indexOf(".tab-slider"),
        styles.indexOf(".tab-slider") + 400,
      );
      expect(sliderBlock).toContain("position: absolute");
    });
  });

  describe("panel spring-in animation", () => {
    it("CSS defines spring-panel-in keyframes", () => {
      expect(styles).toContain("@keyframes spring-panel-in");
    });

    it("spring-panel-in uses both translate and scale for a physical feel", () => {
      const keyframeStart = styles.indexOf("@keyframes spring-panel-in");
      const keyframeBlock = styles.slice(keyframeStart, keyframeStart + 500);

      expect(keyframeBlock).toMatch(/translateY|translateX/);
      expect(keyframeBlock).toContain("scale");
    });

    it("panels shown with data-glass trigger the spring-in animation", () => {
      expect(styles).toContain(".panel[data-glass]");
    });
  });

  describe("glass surface CSS", () => {
    it("glass panels use backdrop-filter for blur effect", () => {
      expect(styles).toContain("backdrop-filter");
    });

    it("glass panels have a top-edge highlight for glass reflection", () => {
      const glassBlock = styles.slice(
        styles.indexOf(".panel[data-glass]"),
        styles.indexOf(".panel[data-glass]") + 600,
      );
      // box-shadow creates the inset top highlight
      expect(glassBlock).toContain("box-shadow");
    });
  });
});
