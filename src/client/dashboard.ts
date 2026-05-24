import { splitRequestedCurrenciesBySupport } from "../shared/currency-support";
import { previewPortfolioAllocation } from "../shared/portfolio-preview";
import { summarizeHistoricalTrend } from "./historical-trend-summary";
import type { SimulationHistoryEntry } from "./simulation-history";

export type HistoricalTrendChartPoint = {
  date: string;
  rate: number;
};

export type HistoricalTrendChartSeries = {
  symbol: string;
  points: HistoricalTrendChartPoint[];
};

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
  currencyCatalog?: Record<string, string>;
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
    baseCurrency: string;
    symbol: string;
    points: HistoricalTrendChartPoint[];
    allSeries: HistoricalTrendChartSeries[];
  };
  allocationPreview: DashboardAllocationPreview;
  simulationHistory: {
    entries: SimulationHistoryEntry[];
  };
};

export type LatestRateCard = {
  currency: string;
  label: string;
  rate: number;
};

export type DashboardAllocationPreview = {
  baseCurrency: string;
  startingAmount: number;
  status: "pending" | "ready";
  summary: string;
  currencyOptions: DashboardAllocationPreviewCurrencyOption[];
  referenceRatesByDate: Record<string, Record<string, number>>;
  allocations: DashboardAllocationPreviewAllocation[];
  points: DashboardAllocationPreviewPoint[];
};

export type DashboardAllocationPreviewCurrencyOption = {
  currency: string;
  label: string;
};

export type DashboardAllocationPreviewAllocation = {
  currency: string;
  percent: number;
  label: string;
};

export type DashboardAllocationPreviewPoint = {
  date: string;
  value: number;
  label: string;
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
      baseCurrency,
      symbol: "",
      points: [],
      allSeries: [],
    },
    allocationPreview: buildPendingAllocationPreview(
      baseCurrency,
      input.simulationBalance,
    ),
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
  fetchHistoricalRates?: FetchHistoricalRates;
};

type FetchReferenceData = (input: {
  baseCurrency: string;
  symbols: string[];
}) => Promise<DashboardReferenceData>;

type FetchHistoricalRates = (input: HistoricalReferenceRatesInput) => Promise<
  HistoricalReferenceRatesResponse
>;

export async function loadDashboardViewModel(
  input: LoadDashboardViewModelInput,
): Promise<DashboardViewModel> {
  const baseCurrency = "USD";
  const symbols = input.requestedCurrencies
    .map((currency) => currency.toUpperCase())
    .filter((currency) => currency !== baseCurrency);
  const fetchReferenceData =
    input.fetchReferenceData ?? fetchDashboardReferenceData;
  const fetchHistoricalRates =
    input.fetchHistoricalRates ?? fetchHistoricalReferenceRates;
  const referenceData = await fetchReferenceData({
    baseCurrency,
    symbols,
  });
  const viewModel = buildDashboardViewModel({
    simulationBalance: input.simulationBalance,
    baseCurrency: referenceData.latestRates.base,
    dataDate: referenceData.latestRates.date,
    requestedCurrencies: input.requestedCurrencies,
    supportedCurrencies: referenceData.currencies,
    latestRates: referenceData.latestRates.rates,
  });
  viewModel.currencyCatalog = referenceData.currencies;
  const historicalSymbols = Object.keys(referenceData.latestRates.rates).sort();
  const historicalSymbol = historicalSymbols[0];
  const historicalWindow = getHistoricalWindow(referenceData.latestRates.date);

  if (historicalSymbol !== undefined && historicalWindow !== undefined) {
    try {
      const historicalRatesResponses = await Promise.all(
        historicalSymbols.map((symbol) =>
          fetchHistoricalRates({
            baseCurrency: referenceData.latestRates.base,
            symbol,
            startDate: historicalWindow.startDate,
            endDate: historicalWindow.endDate,
          }),
        ),
      );
      const historicalRates = historicalRatesResponses[0];

      if (historicalRates === undefined) {
        return viewModel;
      }

      const summary = summarizeHistoricalTrend({
        baseCurrency: historicalRates.base,
        symbol: historicalRates.symbol,
        points: historicalRates.points,
      });

      const allSeries = historicalRatesResponses.map((response) => ({
        symbol: response.symbol.toUpperCase(),
        points: response.points.map((point) => ({
          date: point.date,
          rate: point.rate,
        })),
      }));

      viewModel.historicalTrend = {
        summary: summary.summary,
        baseCurrency: historicalRates.base,
        symbol: historicalRates.symbol.toUpperCase(),
        points: historicalRates.points.map((point) => ({
          date: point.date,
          rate: point.rate,
        })),
        allSeries,
      };
      viewModel.allocationPreview = buildManualAllocationPreview({
        baseCurrency: historicalRates.base,
        startingAmount: input.simulationBalance,
        histories: historicalRatesResponses,
      });
    } catch {
      viewModel.historicalTrend = {
        summary:
          "Historical movement summary will appear after daily reference rates load.",
        baseCurrency: referenceData.latestRates.base,
        symbol: "",
        points: [],
        allSeries: [],
      };
      viewModel.allocationPreview = buildPendingAllocationPreview(
        referenceData.latestRates.base,
        input.simulationBalance,
      );
    }
  }

  return viewModel;
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

function getHistoricalWindow(
  endDate: string,
): { startDate: string; endDate: string } | undefined {
  const parsedEndDate = new Date(`${endDate}T00:00:00.000Z`);

  if (Number.isNaN(parsedEndDate.getTime())) {
    return undefined;
  }

  const parsedStartDate = new Date(parsedEndDate);

  parsedStartDate.setUTCDate(parsedStartDate.getUTCDate() - 30);

  return {
    startDate: formatIsoDate(parsedStartDate),
    endDate,
  };
}

function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function buildPendingAllocationPreview(
  baseCurrency: string,
  startingAmount: number,
): DashboardAllocationPreview {
  return {
    baseCurrency,
    startingAmount,
    status: "pending",
    summary:
      "Manual allocation historical preview will appear after daily history loads.",
    currencyOptions: [{ currency: baseCurrency, label: baseCurrency }],
    referenceRatesByDate: {},
    allocations: [],
    points: [],
  };
}

function buildManualAllocationPreview(input: {
  baseCurrency: string;
  startingAmount: number;
  histories: HistoricalReferenceRatesResponse[];
}): DashboardAllocationPreview {
  const baseCurrency = input.baseCurrency.toUpperCase();
  const primaryHistory = input.histories[0];

  if (primaryHistory === undefined) {
    return buildPendingAllocationPreview(baseCurrency, input.startingAmount);
  }

  const primarySymbol = primaryHistory.symbol.toUpperCase();
  const referenceRatesByDate = mergeHistoricalReferenceRates(input.histories);
  const preview = previewPortfolioAllocation({
    baseCurrency,
    startingAmount: input.startingAmount,
    allocations: [
      { currency: baseCurrency, percent: 50 },
      { currency: primarySymbol, percent: 50 },
    ],
    referenceRatesByDate,
  });
  const points = preview.points.map((point) => {
    const value = roundDisplayAmount(point.value);

    return {
      date: point.date,
      value,
      label: formatDisplayAmount(value, baseCurrency),
    };
  });
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];

  return {
    baseCurrency,
    startingAmount: input.startingAmount,
    status: "ready",
    summary:
      firstPoint !== undefined && lastPoint !== undefined
        ? `Manual 50% ${baseCurrency} / 50% ${primarySymbol} allocation moved from ${firstPoint.label} to ${lastPoint.label}. Historical reference only.`
        : "Manual allocation historical preview will appear after daily history loads.",
    currencyOptions: [
      { currency: baseCurrency, label: baseCurrency },
      ...input.histories.map((history) => {
        const symbol = history.symbol.toUpperCase();

        return { currency: symbol, label: symbol };
      }),
    ],
    referenceRatesByDate,
    allocations: [
      { currency: baseCurrency, percent: 50, label: `50% ${baseCurrency}` },
      { currency: primarySymbol, percent: 50, label: `50% ${primarySymbol}` },
    ],
    points,
  };
}

function mergeHistoricalReferenceRates(
  histories: HistoricalReferenceRatesResponse[],
): Record<string, Record<string, number>> {
  return histories.reduce<Record<string, Record<string, number>>>(
    (referenceRatesByDate, history) => {
      const symbol = history.symbol.toUpperCase();

      history.points.forEach((point) => {
        referenceRatesByDate[point.date] = {
          ...referenceRatesByDate[point.date],
          [symbol]: point.rate,
        };
      });

      return referenceRatesByDate;
    },
    {},
  );
}

function roundDisplayAmount(value: number): number {
  return Math.round(value * 10) / 10;
}

function formatDisplayAmount(value: number, currency: string): string {
  return `${value.toLocaleString("en-US", {
    maximumFractionDigits: 1,
  })} ${currency}`;
}
