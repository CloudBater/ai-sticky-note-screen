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
