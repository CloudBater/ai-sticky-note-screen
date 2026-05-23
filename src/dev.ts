import react from "@vitejs/plugin-react";
import { createServer as createViteServer } from "vite";

import { startBackendServer } from "./server/start";

const BACKEND_HOST = "127.0.0.1";
const BACKEND_PORT = "3000";
const FRONTEND_HOST = "127.0.0.1";
const FRONTEND_PORT = 5173;

async function startFullstackDevServer(): Promise<void> {
  const backendServer = startBackendServer({
    env: {
      ...process.env,
      PORT: process.env.PORT ?? BACKEND_PORT,
    },
    hostname: BACKEND_HOST,
  });

  await backendServer;

  const viteServer = await createViteServer({
    plugins: [react()],
    server: {
      host: FRONTEND_HOST,
      port: FRONTEND_PORT,
      proxy: {
        "/api": `http://${BACKEND_HOST}:${BACKEND_PORT}`,
      },
    },
  });

  await viteServer.listen();

  console.log(`Backend API ready at http://${BACKEND_HOST}:${BACKEND_PORT}`);
  viteServer.printUrls();
}

void startFullstackDevServer();
