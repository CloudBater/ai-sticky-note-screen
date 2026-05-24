import type { LatestRateCard } from "./dashboard";

export type LiveConversionPreview = {
  convertedAmount: number;
  rate: number;
  sourceAmount: number;
  sourceCurrency: string;
  targetCurrency: string;
};

export function buildLiveConversionPreview({
  amount,
  baseCurrency,
  latestRates,
  sourceCurrency,
  targetCurrency,
}: {
  amount: number;
  baseCurrency: string;
  latestRates: LatestRateCard[];
  sourceCurrency: string;
  targetCurrency: string;
}): LiveConversionPreview | undefined {
  const normalizedBase = baseCurrency.toUpperCase();
  const normalizedSource = sourceCurrency.toUpperCase();
  const normalizedTarget = targetCurrency.toUpperCase();

  if (
    !Number.isFinite(amount) ||
    amount <= 0 ||
    normalizedSource === normalizedTarget
  ) {
    return undefined;
  }

  const ratesByCurrency = new Map<string, number>([[normalizedBase, 1]]);

  latestRates.forEach((rate) => {
    ratesByCurrency.set(rate.currency.toUpperCase(), rate.rate);
  });

  const sourcePerBase = ratesByCurrency.get(normalizedSource);
  const targetPerBase = ratesByCurrency.get(normalizedTarget);

  if (
    sourcePerBase === undefined ||
    targetPerBase === undefined ||
    sourcePerBase <= 0 ||
    targetPerBase <= 0
  ) {
    return undefined;
  }

  const rate = targetPerBase / sourcePerBase;

  return {
    convertedAmount: Math.floor(amount * rate + Number.EPSILON),
    rate,
    sourceAmount: amount,
    sourceCurrency: normalizedSource,
    targetCurrency: normalizedTarget,
  };
}
