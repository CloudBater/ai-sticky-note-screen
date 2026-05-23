import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { createServer } from "node:http";

import { describe, expect, it } from "vitest";

import { createApp } from "../src/server/app";
import { previewSimulatedConversion } from "../src/shared/conversion-preview";

type FetchFrankfurter = (url: string | URL) => Promise<Response>;
type CreateConfiguredApp = (options: {
  fetchFrankfurter: FetchFrankfurter;
  frankfurterBaseUrl: string;
}) => ReturnType<typeof createApp>;

async function closeServer(server: Server): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    server.close((error: Error | undefined) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

async function startConversionPreviewServer(
  fetchFrankfurter: FetchFrankfurter,
): Promise<Server> {
  const server = createServer(
    (createApp as CreateConfiguredApp)({
      fetchFrankfurter,
      frankfurterBaseUrl: "https://api.frankfurter.test",
    }),
  );

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });

  return server;
}

function conversionPreviewUrl(server: Server): string {
  const address = server.address() as AddressInfo;
  const port = address.port;

  return `http://127.0.0.1:${port}/api/simulations/conversion-preview`;
}

function postConversionPreview(
  server: Server,
  body: Record<string, unknown>,
): Promise<Response> {
  return fetch(conversionPreviewUrl(server), {
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}

describe("previewSimulatedConversion", () => {
  it("calculates a non-executing simulated conversion from a daily reference rate", () => {
    expect(
      previewSimulatedConversion({
        sourceCurrency: "usd",
        targetCurrency: "eur",
        amount: 2500,
        date: "2024-08-23",
        dailyReferenceRate: 0.901,
      }),
    ).toEqual({
      sourceCurrency: "USD",
      targetCurrency: "EUR",
      sourceAmount: 2500,
      convertedAmount: 2252.5,
      rate: 0.901,
      date: "2024-08-23",
      kind: "simulation-preview",
    });
  });

  it("rejects non-positive simulated conversion amounts", () => {
    expect(() =>
      previewSimulatedConversion({
        sourceCurrency: "usd",
        targetCurrency: "eur",
        amount: -100,
        date: "2025-08-23",
        dailyReferenceRate: 0.901,
      }),
    ).toThrow("Simulated conversion amount must be greater than 0");
  });

  it("rejects future simulated conversion dates", () => {
    expect(() =>
      previewSimulatedConversion({
        sourceCurrency: "usd",
        targetCurrency: "eur",
        amount: 100,
        date: "2999-01-01",
        dailyReferenceRate: 0.901,
      }),
    ).toThrow("Simulated conversion date cannot be in the future");
  });

  it("rejects simulated conversions with currencies outside the supported set", () => {
    expect(() =>
      previewSimulatedConversion({
        sourceCurrency: "usd",
        targetCurrency: "twd",
        amount: 100,
        date: "2024-08-23",
        dailyReferenceRate: 32,
        supportedCurrencies: ["USD", "EUR", "JPY"],
      }),
    ).toThrow("Simulated conversion currency is not supported");
  });
});

describe("POST /api/simulations/conversion-preview", () => {
  it("returns a non-executing simulated conversion preview from a daily reference rate", async () => {
    const upstreamRequests: string[] = [];
    const fetchFrankfurter: FetchFrankfurter = async (url) => {
      upstreamRequests.push(String(url));

      return new Response(
        JSON.stringify({
          amount: 1,
          base: "USD",
          date: "2024-08-23",
          rates: {
            EUR: 0.901,
          },
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 200,
        },
      );
    };

    const server = await startConversionPreviewServer(fetchFrankfurter);

    try {
      const response = await postConversionPreview(server, {
        sourceCurrency: "usd",
        targetCurrency: "eur",
        amount: 2500,
        date: "2024-08-23",
      });

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        preview: {
          sourceCurrency: "USD",
          targetCurrency: "EUR",
          sourceAmount: 2500,
          convertedAmount: 2252.5,
          rate: 0.901,
          date: "2024-08-23",
          kind: "simulation-preview",
        },
      });
      expect(upstreamRequests).toEqual([
        "https://api.frankfurter.test/2024-08-23?from=USD&to=EUR",
      ]);
    } finally {
      await closeServer(server);
    }
  });

  it("rejects invalid request bodies before calling Frankfurter", async () => {
    const upstreamRequests: string[] = [];
    const fetchFrankfurter: FetchFrankfurter = async (url) => {
      upstreamRequests.push(String(url));

      return new Response(
        JSON.stringify({
          amount: 1,
          base: "USD",
          date: "2024-08-23",
          rates: {
            EUR: 0.901,
          },
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 200,
        },
      );
    };

    const server = await startConversionPreviewServer(fetchFrankfurter);

    try {
      const response = await postConversionPreview(server, {
        sourceCurrency: "usd",
        targetCurrency: "eur",
        amount: 2500,
        date: "",
      });

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: "Invalid conversion preview request",
      });
      expect(upstreamRequests).toEqual([]);
    } finally {
      await closeServer(server);
    }
  });

  it("returns a clear error response when Frankfurter cannot provide the reference rate", async () => {
    const fetchFrankfurter: FetchFrankfurter = async () =>
      new Response(
        JSON.stringify({
          amount: 1,
          base: "USD",
          date: "2024-08-23",
          rates: {},
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 200,
        },
      );

    const server = await startConversionPreviewServer(fetchFrankfurter);

    try {
      const response = await postConversionPreview(server, {
        sourceCurrency: "usd",
        targetCurrency: "eur",
        amount: 2500,
        date: "2024-08-23",
      });

      expect(response.status).toBe(502);
      await expect(response.json()).resolves.toEqual({
        error: "Unable to fetch conversion reference rate",
      });
    } finally {
      await closeServer(server);
    }
  });
});
