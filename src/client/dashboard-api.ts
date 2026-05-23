export type DashboardReferenceDataInput = {
  baseCurrency: string;
  symbols: string[];
  fetchJson?: FetchJson;
};

export type DashboardReferenceData = {
  currencies: Record<string, string>;
  latestRates: LatestRatesResponse;
};

export type LatestRatesResponse = {
  base: string;
  date: string;
  rates: Record<string, number>;
};

type FetchJson = (url: string) => Promise<unknown>;

export async function fetchDashboardReferenceData(
  input: DashboardReferenceDataInput,
): Promise<DashboardReferenceData> {
  const fetchJson = input.fetchJson ?? defaultFetchJson;
  const baseCurrency = input.baseCurrency.toUpperCase();
  const currenciesBody = await fetchJson("/api/currencies");
  const currencies = readCurrenciesBody(currenciesBody);
  const supportedCurrencyCodes = new Set(Object.keys(currencies));
  const symbols = input.symbols
    .map((symbol) => symbol.toUpperCase())
    .filter((symbol) => supportedCurrencyCodes.has(symbol));
  const latestRatesUrl = new URL("/api/rates/latest", "http://localhost");

  latestRatesUrl.searchParams.set("base", baseCurrency);
  latestRatesUrl.searchParams.set("symbols", symbols.join(","));

  const latestRatesBody = await fetchJson(
    `${latestRatesUrl.pathname}${latestRatesUrl.search}`,
  );

  return {
    currencies,
    latestRates: readLatestRatesBody(latestRatesBody),
  };
}

async function defaultFetchJson(url: string): Promise<unknown> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Unable to load dashboard reference data");
  }

  return response.json();
}

function readCurrenciesBody(body: unknown): Record<string, string> {
  if (typeof body !== "object" || body === null) {
    throw new Error("Invalid currencies response");
  }

  const currencies = (body as { currencies?: unknown }).currencies;

  if (typeof currencies !== "object" || currencies === null) {
    throw new Error("Invalid currencies response");
  }

  return currencies as Record<string, string>;
}

function readLatestRatesBody(body: unknown): LatestRatesResponse {
  if (typeof body !== "object" || body === null) {
    throw new Error("Invalid latest rates response");
  }

  const candidate = body as Partial<LatestRatesResponse>;

  if (
    typeof candidate.base !== "string" ||
    typeof candidate.date !== "string" ||
    typeof candidate.rates !== "object" ||
    candidate.rates === null
  ) {
    throw new Error("Invalid latest rates response");
  }

  return {
    base: candidate.base,
    date: candidate.date,
    rates: candidate.rates,
  };
}
