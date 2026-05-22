import type { AddressInfo } from "node:net";
import { createServer } from "node:http";

import { describe, expect, it } from "vitest";

import { createApp } from "../src/server/app";

type FetchFrankfurter = (url: string | URL) => Promise<Response>;
type CreateConfiguredApp = (options: {
  fetchFrankfurter: FetchFrankfurter;
  frankfurterBaseUrl: string;
}) => ReturnType<typeof createApp>;

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

    const server = createServer(
      (createApp as CreateConfiguredApp)({
        fetchFrankfurter,
        frankfurterBaseUrl: "https://api.frankfurter.test",
      }),
    );

    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", resolve);
    });

    try {
      const { port } = server.address() as AddressInfo;
      const response = await fetch(
        `http://127.0.0.1:${port}/api/simulations/conversion-preview`,
        {
          body: JSON.stringify({
            sourceCurrency: "usd",
            targetCurrency: "eur",
            amount: 2500,
            date: "2024-08-23",
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        },
      );

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

    const server = createServer(
      (createApp as CreateConfiguredApp)({
        fetchFrankfurter,
        frankfurterBaseUrl: "https://api.frankfurter.test",
      }),
    );

    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", resolve);
    });

    try {
      const { port } = server.address() as AddressInfo;
      const response = await fetch(
        `http://127.0.0.1:${port}/api/simulations/conversion-preview`,
        {
          body: JSON.stringify({
            sourceCurrency: "usd",
            targetCurrency: "eur",
            amount: 2500,
            date: "",
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        },
      );

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: "Invalid conversion preview request",
      });
      expect(upstreamRequests).toEqual([]);
    } finally {
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

    const server = createServer(
      (createApp as CreateConfiguredApp)({
        fetchFrankfurter,
        frankfurterBaseUrl: "https://api.frankfurter.test",
      }),
    );

    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", resolve);
    });

    try {
      const { port } = server.address() as AddressInfo;
      const response = await fetch(
        `http://127.0.0.1:${port}/api/simulations/conversion-preview`,
        {
          body: JSON.stringify({
            sourceCurrency: "usd",
            targetCurrency: "eur",
            amount: 2500,
            date: "2024-08-23",
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        },
      );

      expect(response.status).toBe(502);
      await expect(response.json()).resolves.toEqual({
        error: "Unable to fetch conversion reference rate",
      });
    } finally {
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
  });
});
