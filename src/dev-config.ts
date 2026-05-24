export type FullstackDevEnv = {
  PORT?: string;
};

export type FullstackDevConfig = {
  backendHost: string;
  backendPort: string;
  frontendHost: string;
  frontendPort: number;
};

const DEFAULT_BACKEND_HOST = "127.0.0.1";
const DEFAULT_BACKEND_PORT = "3000";
const DEFAULT_FRONTEND_HOST = "127.0.0.1";
const DEFAULT_FRONTEND_PORT = 5173;

export function readFullstackDevConfig(
  env: FullstackDevEnv = process.env,
): FullstackDevConfig {
  return {
    backendHost: DEFAULT_BACKEND_HOST,
    backendPort: env.PORT ?? DEFAULT_BACKEND_PORT,
    frontendHost: DEFAULT_FRONTEND_HOST,
    frontendPort: DEFAULT_FRONTEND_PORT,
  };
}
