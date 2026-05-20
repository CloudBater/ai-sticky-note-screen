import type { IncomingMessage, ServerResponse } from "node:http";

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
