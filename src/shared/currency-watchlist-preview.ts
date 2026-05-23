export type CurrencyWatchlistPreviewInput = {
  baseCurrency: string;
  watchedCurrencies: string[];
  referenceRatesByDate: Record<string, Record<string, number>>;
};

export type CurrencyWatchlistPoint = {
  date: string;
  rate: number;
};

export type CurrencyWatchlistSeries = {
  currency: string;
  points: CurrencyWatchlistPoint[];
};

export type CurrencyWatchlistPreview = {
  baseCurrency: string;
  watchedCurrencies: string[];
  kind: "currency-watchlist-preview";
  series: CurrencyWatchlistSeries[];
};

export function previewCurrencyWatchlist(
  input: CurrencyWatchlistPreviewInput,
): CurrencyWatchlistPreview {
  const watchedCurrencies = input.watchedCurrencies.map((currency) =>
    currency.toUpperCase(),
  );
  const sortedDates = Object.keys(input.referenceRatesByDate).sort();

  const series = watchedCurrencies.map((currency) => {
    const points = sortedDates.map((date) => {
      const dailyRates = input.referenceRatesByDate[date];
      const rate = dailyRates?.[currency];

      if (typeof rate !== "number" || !Number.isFinite(rate)) {
        throw new Error(
          "Historical reference rate is missing for watchlist currency",
        );
      }

      return { date, rate };
    });

    return {
      currency,
      points,
    };
  });

  return {
    baseCurrency: input.baseCurrency.toUpperCase(),
    watchedCurrencies,
    kind: "currency-watchlist-preview",
    series,
  };
}
