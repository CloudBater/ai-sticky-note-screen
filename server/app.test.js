import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

import { createApp } from "./app.js";

describe("MarketMage API", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects unsupported currency codes instead of silently dropping them", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => ({
        EUR: "Euro",
        GBP: "British Pound",
        JPY: "Japanese Yen",
        SGD: "Singapore Dollar",
        CNY: "Chinese Renminbi Yuan",
        USD: "United States Dollar"
      })
    })));

    const response = await request(createApp()).get("/api/latest?base=USD&symbols=TWD");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: "Unsupported currency: TWD",
      unsupported: ["TWD"]
    });
  });
});
