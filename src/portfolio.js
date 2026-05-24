export const STARTING_BALANCE = 10000;

export function buildPortfolioCurve(rates, symbol, startingBalance = STARTING_BALANCE) {
  const entries = Object.entries(rates || {}).sort();

  if (entries.length === 0) {
    return [];
  }

  const firstRate = entries[0][1][symbol];
  const startingUnits = startingBalance * firstRate;

  return entries.map(([date, dailyRates]) => {
    const rate = dailyRates[symbol];
    const value = startingUnits / rate;
    const pnl = value - startingBalance;

    return {
      date,
      value: Number(value.toFixed(2)),
      pnl: Number(pnl.toFixed(2)),
      pnlPercent: Number(((pnl / startingBalance) * 100).toFixed(2))
    };
  });
}

export function buildSignal(summary) {
  if (!summary) {
    return {
      label: "Waiting for data",
      tone: "neutral",
      reason: "No historical series is loaded yet."
    };
  }

  if (summary.changePercent > 0.75) {
    return {
      label: "USD stronger",
      tone: "up",
      reason: `USD bought more ${summary.symbol || "selected currency"} over this window. This is historical momentum, not a forecast.`
    };
  }

  if (summary.changePercent < -0.75) {
    return {
      label: "USD weaker",
      tone: "down",
      reason: `USD bought less ${summary.symbol || "selected currency"} over this window. This is historical momentum, not a forecast.`
    };
  }

  return {
    label: "Range-bound",
    tone: "neutral",
    reason: "Recent movement is small, so this view should not imply a directional trade."
  };
}
