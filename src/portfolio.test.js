import { describe, expect, it } from "vitest";

import { buildPortfolioCurve, buildSignal } from "./portfolio.js";

describe("buildPortfolioCurve", () => {
  it("simulates a read-only USD portfolio against historical FX rates", () => {
    const curve = buildPortfolioCurve({
      "2026-05-20": { EUR: 0.9 },
      "2026-05-21": { EUR: 0.81 }
    }, "EUR", 10000);

    expect(curve).toEqual([
      { date: "2026-05-20", value: 10000, pnl: 0, pnlPercent: 0 },
      { date: "2026-05-21", value: 11111.11, pnl: 1111.11, pnlPercent: 11.11 }
    ]);
  });
});

describe("buildSignal", () => {
  it("labels the signal as historical momentum instead of a prediction", () => {
    const signal = buildSignal({ changePercent: 1.2, symbol: "EUR" });

    expect(signal.label).toBe("USD stronger");
    expect(signal.reason).toContain("historical momentum, not a forecast");
  });
});
