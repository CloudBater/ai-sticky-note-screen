import type { SimulatedConversionPreview } from "../shared/conversion-preview";

type FetchJson = (url: string, init?: RequestInit) => Promise<unknown>;

export type SimulatedConversionBackendPreviewInput = {
  sourceCurrency: string;
  targetCurrency: string;
  amount: number;
  date: string;
  fetchJson?: FetchJson;
};

export async function previewSimulatedConversionViaBackend(
  input: SimulatedConversionBackendPreviewInput,
): Promise<SimulatedConversionPreview> {
  const fetchJson = input.fetchJson ?? defaultFetchJson;
  const body = {
    sourceCurrency: input.sourceCurrency.toUpperCase(),
    targetCurrency: input.targetCurrency.toUpperCase(),
    amount: input.amount,
    date: input.date,
  };
  const responseBody = await fetchJson("/api/simulations/conversion-preview", {
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  return readPreviewBody(responseBody);
}

async function defaultFetchJson(
  url: string,
  init?: RequestInit,
): Promise<unknown> {
  const response = await fetch(url, init);

  if (!response.ok) {
    throw new Error("Unable to preview simulated conversion");
  }

  return response.json();
}

function readPreviewBody(body: unknown): SimulatedConversionPreview {
  if (typeof body !== "object" || body === null) {
    throw new Error("Invalid simulated conversion preview response");
  }

  const preview = (body as { preview?: unknown }).preview;

  if (typeof preview !== "object" || preview === null) {
    throw new Error("Invalid simulated conversion preview response");
  }

  return preview as SimulatedConversionPreview;
}
