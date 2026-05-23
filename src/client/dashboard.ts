import { splitRequestedCurrenciesBySupport } from "../shared/currency-support";
import type { SimulationHistoryEntry } from "./simulation-history";

type FetchJson = (url: string) => Promise<unknown>;

export type DashboardViewModelInput = {
  simulationBalance: number;
  baseCurrency: string;
  dataDate: string;
  requestedCurrencies: string[];
  supportedCurrencies: Record<string, string>;
  latestRates: Record<string, number>;
};

export type DashboardViewModel = {
  title: "MarketMage";
  simulationBalanceLabel: "Hypothetical starting balance";
  simulationBalance: {
    amount: number;
    currency: string;
  };
  trustMessages: string[];
  navigationItems: NavigationItem[];
  currencySupport: {
    supported: string[];
    unsupported: string[];
  };
  latestRates: {
    baseCurrency: string;
    dataDate: string;
    cards: LatestRateCard[];
  };
  historicalTrend: {
    summary: string;
  };
  simulationHistory: {
    entries: SimulationHistoryEntry[];
  };
};

export type LatestRateCard = {
  currency: string;
  label: string;
  rate: number;
};

export type NavigationItem = {
  id: "overview" | "trend" | "simulation" | "history";
  label: string;
};

export function buildDashboardViewModel(
  input: DashboardViewModelInput,
): DashboardViewModel {
  const baseCurrency = input.baseCurrency.toUpperCase();
  const currencySupport = splitRequestedCurrenciesBySupport(
    input.requestedCurrencies,
    input.supportedCurrencies,
  );
  const cards = Object.entries(input.latestRates)
    .sort(([leftCurrency], [rightCurrency]) =>
      leftCurrency.localeCompare(rightCurrency),
    )
    .map(([currency, rate]) => {
      const normalizedCurrency = currency.toUpperCase();

      return {
        currency: normalizedCurrency,
        label: `1 ${baseCurrency} = ${rate} ${normalizedCurrency}`,
        rate,
      };
    });

  return {
    title: "MarketMage",
    simulationBalanceLabel: "Hypothetical starting balance",
    simulationBalance: {
      amount: input.simulationBalance,
      currency: baseCurrency,
    },
    trustMessages: [
      "Daily reference rates, not real-time quotes.",
      "Historical reference only.",
      "Not investment advice.",
      "No deposits, withdrawals, or trades.",
      "No trades are executed.",
    ],
    navigationItems: [
      { id: "overview", label: "Overview" },
      { id: "simulation", label: "Simulate" },
      { id: "trend", label: "Trend" },
      { id: "history", label: "History" },
    ],
    currencySupport,
    latestRates: {
      baseCurrency,
      dataDate: input.dataDate,
      cards,
    },
    historicalTrend: {
      summary:
        "Historical movement summary will appear after daily reference rates load.",
    },
    simulationHistory: {
      entries: [],
    },
  };
}

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

  if (symbols.length === 0) {
    return {
      currencies,
      latestRates: {
        base: baseCurrency,
        date: "Unavailable",
        rates: {},
      },
    };
  }

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

export type LoadDashboardViewModelInput = {
  simulationBalance: number;
  requestedCurrencies: string[];
  fetchReferenceData?: FetchReferenceData;
};

type FetchReferenceData = (input: {
  baseCurrency: string;
  symbols: string[];
}) => Promise<DashboardReferenceData>;

export async function loadDashboardViewModel(
  input: LoadDashboardViewModelInput,
): Promise<DashboardViewModel> {
  const baseCurrency = "USD";
  const symbols = input.requestedCurrencies
    .map((currency) => currency.toUpperCase())
    .filter((currency) => currency !== baseCurrency);
  const fetchReferenceData =
    input.fetchReferenceData ?? fetchDashboardReferenceData;
  const referenceData = await fetchReferenceData({
    baseCurrency,
    symbols,
  });

  return buildDashboardViewModel({
    simulationBalance: input.simulationBalance,
    baseCurrency: referenceData.latestRates.base,
    dataDate: referenceData.latestRates.date,
    requestedCurrencies: input.requestedCurrencies,
    supportedCurrencies: referenceData.currencies,
    latestRates: referenceData.latestRates.rates,
  });
}

export type HistoricalReferenceRatesInput = {
  baseCurrency: string;
  symbol: string;
  startDate: string;
  endDate: string;
  fetchJson?: FetchJson;
};

export type HistoricalReferenceRatesResponse = {
  base: string;
  symbol: string;
  startDate: string;
  endDate: string;
  points: HistoricalReferenceRatePoint[];
};

export type HistoricalReferenceRatePoint = {
  date: string;
  rate: number;
};

export async function fetchHistoricalReferenceRates(
  input: HistoricalReferenceRatesInput,
): Promise<HistoricalReferenceRatesResponse> {
  const fetchJson = input.fetchJson ?? defaultFetchJson;
  const url = new URL("/api/rates/history", "http://localhost");

  url.searchParams.set("base", input.baseCurrency.toUpperCase());
  url.searchParams.set("symbol", input.symbol.toUpperCase());
  url.searchParams.set("start", input.startDate);
  url.searchParams.set("end", input.endDate);

  return readHistoricalRatesBody(
    await fetchJson(`${url.pathname}${url.search}`),
  );
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

function readHistoricalRatesBody(
  body: unknown,
): HistoricalReferenceRatesResponse {
  if (typeof body !== "object" || body === null) {
    throw new Error("Invalid historical rates response");
  }

  const candidate = body as Partial<HistoricalReferenceRatesResponse>;

  if (
    typeof candidate.base !== "string" ||
    typeof candidate.symbol !== "string" ||
    typeof candidate.startDate !== "string" ||
    typeof candidate.endDate !== "string" ||
    !Array.isArray(candidate.points)
  ) {
    throw new Error("Invalid historical rates response");
  }

  return {
    base: candidate.base,
    symbol: candidate.symbol,
    startDate: candidate.startDate,
    endDate: candidate.endDate,
    points: candidate.points,
  };
}
