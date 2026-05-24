import { readFileSync } from "node:fs";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  Card,
  Code,
  DisclaimerPanel,
  Eyebrow,
  Num,
  RateCard,
  Slider,
  Tab,
} from "../src/client/components";

describe("MarketMage frontend design system", () => {
  it("loads design tokens from the React entry", () => {
    const mainSource = readFileSync("src/client/main.tsx", "utf8");
    const tokensSource = readFileSync("src/styles/tokens.css", "utf8");

    expect(mainSource).toContain("../styles/tokens.css");
    expect(tokensSource).toContain(":root {");
    expect(tokensSource).toContain("--surface-0: #0A0B0D;");
    expect(tokensSource).toContain("--font-mono: 'JetBrains Mono'");
  });

  it("renders the required presentational primitives", () => {
    const html = renderToStaticMarkup(
      <>
        <Eyebrow>Daily reference</Eyebrow>
        <Num value="6.7953" />
        <Code>USD</Code>
        <Card eyebrow="Watchlist" title="Selected currencies">
          <p>Reference only.</p>
        </Card>
        <RateCard
          code="EUR"
          label="1 USD = 0.901 EUR"
          selected
          value="0.9010"
        />
        <Tab active>Overview</Tab>
        <Slider ariaLabel="First allocation percent" value={50} />
      </>,
    );

    expect(html).toContain('class="eyebrow"');
    expect(html).toContain('class="num num-m"');
    expect(html).toContain('class="code"');
    expect(html).toContain('class="card"');
    expect(html).toContain('class="rate-card"');
    expect(html).toContain('data-active="true"');
    expect(html).toContain('class="tab"');
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('class="slider"');
  });

  it("keeps the disclaimer as a top-level exact-copy safety panel", () => {
    const html = renderToStaticMarkup(<DisclaimerPanel />);

    expect(html).toContain("Reference &amp; safety");
    expect(html).toContain("What this product is, and isn&#x27;t.");
    expect(html).toContain("Daily reference rates, not real-time quotes.");
    expect(html).toContain("Historical reference only — not a forecast.");
    expect(html).toContain("Not investment advice.");
    expect(html).toContain("No deposits, withdrawals, or trades.");
    expect(html).toContain("No trades are executed.");
  });

  it("uses tokenized tabs, cards, charts, and custom slider styling", () => {
    const styles = readFileSync("src/client/styles.css", "utf8");

    expect(styles).toContain(".tabs {");
    expect(styles).toContain("border-bottom: 1px solid var(--border-subtle);");
    expect(styles).toContain(".tab[aria-current=\"page\"]::after");
    expect(styles).not.toContain(".bottom-nav");
    expect(styles).not.toContain("bg-[");
    expect(styles).toContain(".slider::-webkit-slider-thumb");
    expect(styles).toContain("background-image: linear-gradient(var(--accent-dim), var(--accent-dim));");
    expect(styles).toContain(".chart-line");
    expect(styles).toContain("stroke: var(--accent-dim);");
    expect(styles).toContain('.currency-watchlist-form {');
    expect(styles).toContain('.currency-pill-unsupported,');
    expect(styles).toContain('opacity: 0.6;');
    expect(styles).toContain('text-decoration: line-through;');
  });
});
