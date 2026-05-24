import type { AddressInfo } from "node:net";
import { createServer } from "node:http";

import { describe, expect, it } from "vitest";

import { createApp } from "../src/server/app";

type FetchFrankfurter = (url: string | URL) => Promise<Response>;
type CreateConfiguredApp = (options: {
  fetchFrankfurter: FetchFrankfurter;
  frankfurterBaseUrl: string;
}) => ReturnType<typeof createApp>;

describe("GET /api/currencies", () => {
  it("proxies Frankfurter supported currencies", async () => {
    const upstreamRequests: string[] = [];
    const fetchFrankfurter: FetchFrankfurter = async (url) => {
      upstreamRequests.push(String(url));

      return new Response(
        JSON.stringify({
          USD: "US Dollar",
          EUR: "Euro",
          JPY: "Japanese Yen",
          GBP: "Pound Sterling",
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
      const response = await fetch(`http://127.0.0.1:${port}/api/currencies`);

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        currencies: {
          USD: "US Dollar",
          EUR: "Euro",
          JPY: "Japanese Yen",
          GBP: "Pound Sterling",
        },
      });
      expect(upstreamRequests).toEqual([
        "https://api.frankfurter.test/currencies",
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

  it("returns a clear error response when Frankfurter currencies fail", async () => {
    const fetchFrankfurter: FetchFrankfurter = async () =>
      new Response(JSON.stringify({ message: "upstream unavailable" }), {
        headers: { "Content-Type": "application/json" },
        status: 503,
      });

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
      const response = await fetch(`http://127.0.0.1:${port}/api/currencies`);

      expect(response.status).toBe(502);
      await expect(response.json()).resolves.toEqual({
        error: "Unable to fetch supported currencies",
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

  it("caches supported currencies during the app lifetime", async () => {
    const upstreamRequests: string[] = [];
    const fetchFrankfurter: FetchFrankfurter = async (url) => {
      upstreamRequests.push(String(url));

      return new Response(
        JSON.stringify({
          USD: "US Dollar",
          EUR: "Euro",
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
      const url = `http://127.0.0.1:${port}/api/currencies`;

      const firstResponse = await fetch(url);
      const secondResponse = await fetch(url);

      expect(firstResponse.status).toBe(200);
      expect(secondResponse.status).toBe(200);
      await expect(firstResponse.json()).resolves.toEqual({
        currencies: {
          USD: "US Dollar",
          EUR: "Euro",
        },
      });
      await expect(secondResponse.json()).resolves.toEqual({
        currencies: {
          USD: "US Dollar",
          EUR: "Euro",
        },
      });
      expect(upstreamRequests).toEqual([
        "https://api.frankfurter.test/currencies",
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
});
