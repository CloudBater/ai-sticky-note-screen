import { describe, expect, it } from "vitest";

import {
  applySimulatedConversionToBalance,
  MAX_SIMULATION_BALANCE,
  MIN_SIMULATION_BALANCE,
  normalizeSimulatedConversionAmountInput,
  normalizeSimulationBalanceInput,
} from "../src/client/simulation-balance";

describe("simulation balance controls", () => {
  it("normalizes a user-entered hypothetical amount", () => {
    expect(normalizeSimulationBalanceInput("25000", 10_000)).toBe(25_000);
    expect(normalizeSimulationBalanceInput("12,500.75", 10_000)).toBe(12_500.75);
  });

  it("keeps the simulation amount within the supported preview range", () => {
    expect(normalizeSimulationBalanceInput("1", 10_000)).toBe(
      MIN_SIMULATION_BALANCE,
    );
    expect(normalizeSimulationBalanceInput("999999999", 10_000)).toBe(
      MAX_SIMULATION_BALANCE,
    );
  });

  it("keeps the previous simulation amount when input is invalid", () => {
    expect(normalizeSimulationBalanceInput("", 10_000)).toBe(10_000);
    expect(normalizeSimulationBalanceInput("not money", 10_000)).toBe(10_000);
  });

  it("keeps simulated conversion amounts within the available simulation balance", () => {
    expect(normalizeSimulatedConversionAmountInput("2500", 10_000, 100)).toBe(
      2500,
    );
    expect(normalizeSimulatedConversionAmountInput("12000", 10_000, 100)).toBe(
      10_000,
    );
    expect(normalizeSimulatedConversionAmountInput("0", 10_000, 100)).toBe(1);
    expect(
      normalizeSimulatedConversionAmountInput("not money", 10_000, 2500),
    ).toBe(2500);
    expect(normalizeSimulatedConversionAmountInput("100", 0, 100)).toBe(0);
  });

  it("deducts added simulated conversions from the simulation balance", () => {
    expect(applySimulatedConversionToBalance(10_000, 2500)).toBe(7500);
    expect(applySimulatedConversionToBalance(100, 200)).toBe(0);
    expect(applySimulatedConversionToBalance(100.55, 50.22)).toBe(50.33);
  });
});
