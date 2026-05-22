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
