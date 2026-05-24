export const MIN_SIMULATION_BALANCE = 100;
export const MAX_SIMULATION_BALANCE = 1_000_000;

export function normalizeSimulationBalanceInput(
  input: string,
  fallbackAmount: number,
): number {
  const amount = Number(input.replaceAll(",", "").trim());

  if (!Number.isFinite(amount) || amount <= 0) {
    return fallbackAmount;
  }

  return Math.min(
    MAX_SIMULATION_BALANCE,
    Math.max(MIN_SIMULATION_BALANCE, Math.round(amount * 100) / 100),
  );
}

export function normalizeSimulatedConversionAmountInput(
  input: string,
  availableSimulationBalance: number,
  fallbackAmount: number,
): number {
  const amount = Number(input.replaceAll(",", "").trim());
  const maxAmount = Math.max(0, roundCents(availableSimulationBalance));

  if (maxAmount === 0) {
    return 0;
  }

  if (!Number.isFinite(amount)) {
    return Math.min(fallbackAmount, maxAmount);
  }

  return Math.min(maxAmount, Math.max(1, roundCents(amount)));
}

export function applySimulatedConversionToBalance(
  currentSimulationBalance: number,
  sourceAmount: number,
): number {
  if (!Number.isFinite(sourceAmount) || sourceAmount <= 0) {
    return roundCents(currentSimulationBalance);
  }

  return Math.max(0, roundCents(currentSimulationBalance - sourceAmount));
}

function roundCents(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
