import type { HistoricalReferenceRatePoint } from "./dashboard-history-api";

export type HistoricalTrendSummaryInput = {
  baseCurrency: string;
  symbol: string;
  points: HistoricalReferenceRatePoint[];
};

export type HistoricalTrendSummary = {
  baseCurrency: string;
  symbol: string;
  startDate: string;
  endDate: string;
  startRate: number;
  endRate: number;
  percentChange: number;
  direction: "up" | "down" | "flat";
  summary: string;
};

export function summarizeHistoricalTrend(
  input: HistoricalTrendSummaryInput,
): HistoricalTrendSummary {
  if (input.points.length < 2) {
    throw new Error("At least two historical reference points are required");
  }

  const sortedPoints = [...input.points].sort((leftPoint, rightPoint) =>
    leftPoint.date.localeCompare(rightPoint.date),
  );
  const startPoint = sortedPoints[0];
  const endPoint = sortedPoints[sortedPoints.length - 1];

  if (startPoint === undefined || endPoint === undefined) {
    throw new Error("At least two historical reference points are required");
  }

  const percentChange = roundPercentChange(
    ((endPoint.rate - startPoint.rate) / startPoint.rate) * 100,
  );
  const direction = readDirection(percentChange);
  const baseCurrency = input.baseCurrency.toUpperCase();
  const symbol = input.symbol.toUpperCase();

  return {
    baseCurrency,
    symbol,
    startDate: startPoint.date,
    endDate: endPoint.date,
    startRate: startPoint.rate,
    endRate: endPoint.rate,
    percentChange,
    direction,
    summary: `${symbol} moved ${direction} ${Math.abs(
      percentChange,
    )}% against ${baseCurrency} from ${startPoint.date} to ${
      endPoint.date
    }. Historical reference only, not a forecast.`,
  };
}

function readDirection(percentChange: number): HistoricalTrendSummary["direction"] {
  if (percentChange > 0) {
    return "up";
  }

  if (percentChange < 0) {
    return "down";
  }

  return "flat";
}

function roundPercentChange(value: number): number {
  return Math.round(value * 100) / 100;
}
