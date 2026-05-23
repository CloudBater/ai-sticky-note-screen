export type SimulatedConversionInput = {
  sourceCurrency: string;
  targetCurrency: string;
  amount: number;
  date: string;
  dailyReferenceRate: number;
};

export type SimulatedConversionPreview = {
  sourceCurrency: string;
  targetCurrency: string;
  sourceAmount: number;
  convertedAmount: number;
  rate: number;
  date: string;
  kind: "simulation-preview";
};

export function previewSimulatedConversion(
  input: SimulatedConversionInput,
): SimulatedConversionPreview {
  if (
    typeof input.amount !== "number" ||
    !Number.isFinite(input.amount) ||
    input.amount <= 0
  ) {
    throw new Error("Simulated conversion amount must be greater than 0");
  }

  const conversionDate = new Date(`${input.date}T00:00:00.000Z`);
  const today = new Date();
  const todayDateOnly = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );

  if (
    Number.isNaN(conversionDate.getTime()) ||
    conversionDate > todayDateOnly
  ) {
    throw new Error("Simulated conversion date cannot be in the future");
  }

  return {
    sourceCurrency: input.sourceCurrency.toUpperCase(),
    targetCurrency: input.targetCurrency.toUpperCase(),
    sourceAmount: input.amount,
    convertedAmount: input.amount * input.dailyReferenceRate,
    rate: input.dailyReferenceRate,
    date: input.date,
    kind: "simulation-preview",
  };
}
