import type { AddressInfo } from "node:net";
import { createServer } from "node:http";

import { describe, expect, it } from "vitest";

import { createApp } from "../src/server/app";

describe("GET /api/health", () => {
  it("returns an OK response when the backend is running", async () => {
    const server = createServer(createApp());

    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", resolve);
    });

    try {
      const { port } = server.address() as AddressInfo;
      const response = await fetch(`http://127.0.0.1:${port}/api/health`);

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({ status: "ok" });
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
