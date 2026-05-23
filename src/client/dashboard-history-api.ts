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

type FetchJson = (url: string) => Promise<unknown>;

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
    throw new Error("Unable to load historical reference rates");
  }

  return response.json();
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
