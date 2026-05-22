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

  return async (request: IncomingMessage, response: ServerResponse) => {
    if (request.method === "GET" && request.url === "/api/health") {
      sendJson(response, 200, { status: "ok" });
      return;
    }

    if (request.method === "GET" && request.url === "/api/currencies") {
      const upstreamUrl = new URL("/currencies", frankfurterBaseUrl);
      const upstreamResponse = await fetchFrankfurter(upstreamUrl);
      const currencies =
        (await upstreamResponse.json()) as FrankfurterCurrenciesResponse;

      sendJson(response, 200, { currencies });
      return;
    }

    if (
      request.method === "POST" &&
      request.url === "/api/simulations/conversion-preview"
    ) {
      const requestBody =
        (await readJsonBody(request)) as ConversionPreviewRequest;
      const sourceCurrency = requestBody.sourceCurrency.toUpperCase();
      const targetCurrency = requestBody.targetCurrency.toUpperCase();

      const upstreamUrl = new URL(`/${requestBody.date}`, frankfurterBaseUrl);
      upstreamUrl.searchParams.set("from", sourceCurrency);
      upstreamUrl.searchParams.set("to", targetCurrency);

      const upstreamResponse = await fetchFrankfurter(upstreamUrl);
      const upstreamBody =
        (await upstreamResponse.json()) as FrankfurterLatestResponse;
      const dailyReferenceRate = upstreamBody.rates[targetCurrency];

      sendJson(response, 200, {
        preview: previewSimulatedConversion({
          sourceCurrency,
          targetCurrency,
          amount: requestBody.amount,
          date: upstreamBody.date,
          dailyReferenceRate,
        }),
      });
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

      const upstreamUrl = new URL("/latest", frankfurterBaseUrl);
      upstreamUrl.searchParams.set("from", base);
      upstreamUrl.searchParams.set("to", symbols.join(","));

      const upstreamResponse = await fetchFrankfurter(upstreamUrl);

      if (!upstreamResponse.ok) {
        sendJson(response, 502, {
          error: "Unable to fetch latest reference rates",
        });
        return;
      }

      const upstreamBody =
        (await upstreamResponse.json()) as FrankfurterLatestResponse;

      sendJson(response, 200, {
        base: upstreamBody.base,
        date: upstreamBody.date,
        rates: upstreamBody.rates,
      });
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

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  let rawBody = "";

  for await (const chunk of request) {
    rawBody += chunk;
  }

  return JSON.parse(rawBody);
}
