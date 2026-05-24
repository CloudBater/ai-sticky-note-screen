export type ServerConfigEnv = {
  PORT?: string;
  FRANKFURTER_BASE_URL?: string;
};

export type ServerConfig = {
  port: number;
  frankfurterBaseUrl: string;
};

const DEFAULT_PORT = 3000;
const DEFAULT_FRANKFURTER_BASE_URL = "https://api.frankfurter.app";

export function readServerConfig(env: ServerConfigEnv): ServerConfig {
  return {
    port: readPort(env.PORT),
    frankfurterBaseUrl:
      env.FRANKFURTER_BASE_URL ?? DEFAULT_FRANKFURTER_BASE_URL,
  };
}

function readPort(value: string | undefined): number {
  if (value === undefined) {
    return DEFAULT_PORT;
  }

  return Number(value);
}
