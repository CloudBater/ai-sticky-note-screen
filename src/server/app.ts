import type { IncomingMessage, ServerResponse } from "node:http";

import { previewSimulatedConversion } from "../shared/conversion-preview";

type FetchFrankfurter = (url: string | URL) => Promise<Response>;

type CreateAppOptions = {
  fetchFrankfurter?: FetchFrankfurter;
  frankfurterBaseUrl?: string;
};

type FrankfurterLatestResponse = {
  base: string;
  date: string;
  rates: Record<string, number>;
};

type FrankfurterHistoryResponse = {
  base: string;
  start_date: string;
  end_date: string;
  rates: Record<string, Record<string, number>>;
};

type FrankfurterCurrenciesResponse = Record<string, string>;

type ConversionPreviewRequest = {
  sourceCurrency: string;
  targetCurrency: string;
  amount: number;
  date: string;
};

const DEFAULT_FRANKFURTER_BASE_URL = "https://api.frankfurter.app";

export function createApp(options: CreateAppOptions = {}) {
  const fetchFrankfurter = options.fetchFrankfurter ?? fetch;
  const frankfurterBaseUrl =
    options.frankfurterBaseUrl ?? DEFAULT_FRANKFURTER_BASE_URL;
  const responseCache = new Map<string, Record<string, unknown>>();

  return async (request: IncomingMessage, response: ServerResponse) => {
    if (request.method === "GET" && request.url === "/api/health") {
      sendJson(response, 200, { status: "ok" });
      return;
    }

    if (request.method === "GET" && request.url === "/api/currencies") {
      const cacheKey = "currencies";
      const cachedBody = responseCache.get(cacheKey);

      if (cachedBody !== undefined) {
        sendJson(response, 200, cachedBody);
        return;
      }

      const upstreamUrl = new URL("/currencies", frankfurterBaseUrl);
      const upstreamResponse = await fetchFrankfurter(upstreamUrl);

      if (!upstreamResponse.ok) {
        sendJson(response, 502, {
          error: "Unable to fetch supported currencies",
        });
        return;
      }

      const currencies = await readUpstreamJson<FrankfurterCurrenciesResponse>(
        upstreamResponse,
        response,
        "Unable to fetch supported currencies",
      );

      if (currencies === undefined) {
        return;
      }

      const responseBody = { currencies };

      responseCache.set(cacheKey, responseBody);
      sendJson(response, 200, responseBody);
      return;
    }

    if (
      request.method === "POST" &&
      request.url === "/api/simulations/conversion-preview"
    ) {
      let requestBody: unknown;

      try {
        requestBody = await readJsonBody(request);
      } catch {
        sendJson(response, 400, {
          error: "Invalid conversion preview request",
        });
        return;
      }

      if (!isConversionPreviewRequest(requestBody)) {
        sendJson(response, 400, {
          error: "Invalid conversion preview request",
        });
        return;
      }

      const sourceCurrency = requestBody.sourceCurrency.toUpperCase();
      const targetCurrency = requestBody.targetCurrency.toUpperCase();

      const cacheKey = `conversion-rate:${requestBody.date}:${sourceCurrency}:${targetCurrency}`;
      const cachedBody = responseCache.get(cacheKey) as
        | { date: string; dailyReferenceRate: number }
        | undefined;
      let rateDate = cachedBody?.date;
      let dailyReferenceRate = cachedBody?.dailyReferenceRate;

      if (cachedBody === undefined) {
        const upstreamUrl = new URL(`/${requestBody.date}`, frankfurterBaseUrl);
        upstreamUrl.searchParams.set("from", sourceCurrency);
        upstreamUrl.searchParams.set("to", targetCurrency);

        const upstreamResponse = await fetchFrankfurter(upstreamUrl);
        const upstreamBody = await readUpstreamJson<FrankfurterLatestResponse>(
          upstreamResponse,
          response,
          "Unable to fetch conversion reference rate",
        );

        if (upstreamBody === undefined) {
          return;
        }

        rateDate = upstreamBody.date;
        dailyReferenceRate = upstreamBody.rates[targetCurrency];
      }

      if (
        typeof dailyReferenceRate !== "number" ||
        !Number.isFinite(dailyReferenceRate) ||
        typeof rateDate !== "string"
      ) {
        sendJson(response, 502, {
          error: "Unable to fetch conversion reference rate",
        });
        return;
      }

      responseCache.set(cacheKey, {
        date: rateDate,
        dailyReferenceRate,
      });

      sendJson(response, 200, {
        preview: previewSimulatedConversion({
          sourceCurrency,
          targetCurrency,
          amount: requestBody.amount,
          date: rateDate,
          dailyReferenceRate,
        }),
      });
      return;
    }

    if (
      request.method === "GET" &&
      request.url?.startsWith("/api/rates/history")
    ) {
      const requestUrl = new URL(request.url, "http://localhost");
      const base = requestUrl.searchParams.get("base")?.toUpperCase() ?? "USD";
      const symbol = requestUrl.searchParams.get("symbol")?.toUpperCase() ?? "";
      const start = requestUrl.searchParams.get("start") ?? "";
      const end = requestUrl.searchParams.get("end") ?? "";

      if (
        !isCurrencyCode(base) ||
        !isCurrencyCode(symbol) ||
        !isDateOnly(start) ||
        !isDateOnly(end) ||
        start > end
      ) {
        sendJson(response, 400, {
          error: "Invalid historical rates request",
        });
        return;
      }

      const upstreamUrl = new URL(`/${start}..${end}`, frankfurterBaseUrl);
      upstreamUrl.searchParams.set("from", base);
      upstreamUrl.searchParams.set("to", symbol);

      const cacheKey = `history:${base}:${symbol}:${start}:${end}`;
      const cachedBody = responseCache.get(cacheKey);

      if (cachedBody !== undefined) {
        sendJson(response, 200, cachedBody);
        return;
      }

      const upstreamResponse = await fetchFrankfurter(upstreamUrl);

      if (!upstreamResponse.ok) {
        sendJson(response, 502, {
          error: "Unable to fetch historical reference rates",
        });
        return;
      }

      const upstreamBody = await readUpstreamJson<FrankfurterHistoryResponse>(
        upstreamResponse,
        response,
        "Unable to fetch historical reference rates",
      );

      if (upstreamBody === undefined) {
        return;
      }

      const points = Object.entries(upstreamBody.rates)
        .sort(([leftDate], [rightDate]) => leftDate.localeCompare(rightDate))
        .map(([date, dailyRates]) => ({
          date,
          rate: dailyRates[symbol],
        }));

      if (
        points.some(
          (point) =>
            typeof point.rate !== "number" || !Number.isFinite(point.rate),
        )
      ) {
        sendJson(response, 502, {
          error: "Unable to fetch historical reference rates",
        });
        return;
      }

      const responseBody = {
        base: upstreamBody.base,
        symbol,
        startDate: upstreamBody.start_date,
        endDate: upstreamBody.end_date,
        points,
      };

      responseCache.set(cacheKey, responseBody);
      sendJson(response, 200, responseBody);
      return;
    }

    if (request.method === "GET" && request.url?.startsWith("/api/rates/latest")) {
      const requestUrl = new URL(request.url, "http://localhost");
      const base = requestUrl.searchParams.get("base")?.toUpperCase() ?? "USD";
      const symbols =
        requestUrl.searchParams
          .get("symbols")
          ?.split(",")
          .map((symbol) => symbol.trim().toUpperCase())
          .filter(Boolean) ?? [];

      if (
        !isCurrencyCode(base) ||
        symbols.length === 0 ||
        symbols.some((symbol) => !isCurrencyCode(symbol))
      ) {
        sendJson(response, 400, {
          error: "Invalid latest rates request",
        });
        return;
      }

      const upstreamUrl = new URL("/latest", frankfurterBaseUrl);
      upstreamUrl.searchParams.set("from", base);
      upstreamUrl.searchParams.set("to", symbols.join(","));

      const cacheKey = `latest:${base}:${symbols.join(",")}`;
      const cachedBody = responseCache.get(cacheKey);

      if (cachedBody !== undefined) {
        sendJson(response, 200, cachedBody);
        return;
      }

      const upstreamResponse = await fetchFrankfurter(upstreamUrl);

      if (!upstreamResponse.ok) {
        sendJson(response, 502, {
          error: "Unable to fetch latest reference rates",
        });
        return;
      }

      const upstreamBody = await readUpstreamJson<FrankfurterLatestResponse>(
        upstreamResponse,
        response,
        "Unable to fetch latest reference rates",
      );

      if (upstreamBody === undefined) {
        return;
      }

      const responseBody = {
        base: upstreamBody.base,
        date: upstreamBody.date,
        rates: upstreamBody.rates,
      };

      responseCache.set(cacheKey, responseBody);
      sendJson(response, 200, responseBody);
      return;
    }

    sendJson(response, 404, { error: "Not found" });
  };
}

function sendJson(
  response: ServerResponse,
  statusCode: number,
  body: Record<string, unknown>,
) {
  response.writeHead(statusCode, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
}

async function readUpstreamJson<T>(
  upstreamResponse: Response,
  response: ServerResponse,
  error: string,
): Promise<T | undefined> {
  try {
    return (await upstreamResponse.json()) as T;
  } catch {
    sendJson(response, 502, { error });
    return undefined;
  }
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  let rawBody = "";

  for await (const chunk of request) {
    rawBody += chunk;
  }

  return JSON.parse(rawBody);
}

function isConversionPreviewRequest(
  value: unknown,
): value is ConversionPreviewRequest {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.sourceCurrency === "string" &&
    candidate.sourceCurrency.length > 0 &&
    typeof candidate.targetCurrency === "string" &&
    candidate.targetCurrency.length > 0 &&
    typeof candidate.amount === "number" &&
    Number.isFinite(candidate.amount) &&
    candidate.amount > 0 &&
    typeof candidate.date === "string" &&
    candidate.date.length > 0
  );
}

function isCurrencyCode(value: string): boolean {
  return /^[A-Z]{3}$/.test(value);
}

function isDateOnly(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}
