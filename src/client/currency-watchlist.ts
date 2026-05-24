export type CurrencyWatchlistEntry = {
  currency: string;
  label: string;
  supported: boolean;
};

export function normalizeCurrencyCodeInput(input: string): string | null {
  const normalizedCurrency = input.trim().toUpperCase();

  if (!/^[A-Z]{3}$/.test(normalizedCurrency)) {
    return null;
  }

  return normalizedCurrency;
}

export function addCurrencyToWatchlist(
  existingCurrencies: string[],
  input: string,
): string[] {
  const normalizedCurrency = normalizeCurrencyCodeInput(input);

  if (
    normalizedCurrency === null ||
    existingCurrencies.includes(normalizedCurrency)
  ) {
    return existingCurrencies;
  }

  return [...existingCurrencies, normalizedCurrency];
}

export function buildCurrencyWatchlistEntries(
  currencies: string[],
  currencyCatalog: Readonly<Record<string, string>>,
): CurrencyWatchlistEntry[] {
  return currencies.map((currency) => {
    const supported = Object.prototype.hasOwnProperty.call(
      currencyCatalog,
      currency,
    );

    return {
      currency,
      label: currencyCatalog[currency] ?? currency,
      supported,
    };
  });
}