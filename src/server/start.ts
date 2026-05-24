import type { Server } from "node:http";

import type { ServerConfigEnv } from "./config";
import { readServerConfig } from "./config";
import { createBackendServer } from "./server";

type FetchFrankfurter = (url: string | URL) => Promise<Response>;

export type StartBackendServerOptions = {
  env?: ServerConfigEnv;
  fetchFrankfurter?: FetchFrankfurter;
  hostname?: string;
};

export async function startBackendServer(
  options: StartBackendServerOptions = {},
): Promise<Server> {
  const config = readServerConfig(options.env ?? process.env);
  const server = createBackendServer({
    fetchFrankfurter: options.fetchFrankfurter,
    frankfurterBaseUrl: config.frankfurterBaseUrl,
  });

  await new Promise<void>((resolve) => {
    server.listen(config.port, options.hostname, resolve);
  });

  return server;
}
