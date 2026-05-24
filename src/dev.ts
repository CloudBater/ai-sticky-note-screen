import type { AddressInfo } from "node:net";

import react from "@vitejs/plugin-react";
import { createServer as createViteServer } from "vite";

import { readFullstackDevConfig } from "./dev-config";
import { startBackendServer } from "./server/start";

async function startFullstackDevServer(): Promise<void> {
  const config = readFullstackDevConfig();
  const backendServer = await startBackendServer({
    env: {
      ...process.env,
      PORT: config.backendPort,
    },
    hostname: config.backendHost,
  });
  const address = backendServer.address() as AddressInfo | string | null;
  const actualBackendPort =
    typeof address === "object" && address !== null
      ? String(address.port)
      : config.backendPort;

  const viteServer = await createViteServer({
    plugins: [react()],
    server: {
      host: config.frontendHost,
      port: config.frontendPort,
      proxy: {
        "/api": `http://${config.backendHost}:${actualBackendPort}`,
      },
    },
  });

  await viteServer.listen();

  console.log(
    `Backend API ready at http://${config.backendHost}:${actualBackendPort}`,
  );
  viteServer.printUrls();
}

void startFullstackDevServer();
