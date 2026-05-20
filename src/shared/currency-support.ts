export type CurrencySupportResult = {
  supported: string[];
  unsupported: string[];
};

export function splitRequestedCurrenciesBySupport(
  requestedCurrencies: readonly string[],
  supportedCurrencies: Readonly<Record<string, string>>,
): CurrencySupportResult {
  const supportedCurrencyCodes = new Set(Object.keys(supportedCurrencies));

  return requestedCurrencies.reduce<CurrencySupportResult>(
    (result, currencyCode) => {
      const normalizedCurrencyCode = currencyCode.toUpperCase();

      if (supportedCurrencyCodes.has(normalizedCurrencyCode)) {
        result.supported.push(normalizedCurrencyCode);
      } else {
        result.unsupported.push(normalizedCurrencyCode);
      }

      return result;
    },
    { supported: [], unsupported: [] },
  );
}
