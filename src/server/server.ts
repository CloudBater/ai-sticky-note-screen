import { createServer } from "node:http";

import { createApp } from "./app";

type FetchFrankfurter = (url: string | URL) => Promise<Response>;

export type CreateBackendServerOptions = {
  fetchFrankfurter?: FetchFrankfurter;
  frankfurterBaseUrl?: string;
};

export function createBackendServer(options: CreateBackendServerOptions = {}) {
  return createServer(createApp(options));
}
