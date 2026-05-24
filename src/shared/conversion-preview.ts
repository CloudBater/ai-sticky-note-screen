export type SimulatedConversionInput = {
  sourceCurrency: string;
  targetCurrency: string;
  amount: number;
  date: string;
  dailyReferenceRate: number;
  supportedCurrencies?: readonly string[];
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

  const sourceCurrency = input.sourceCurrency.toUpperCase();
  const targetCurrency = input.targetCurrency.toUpperCase();
  const supportedCurrencies =
    input.supportedCurrencies?.map((currency) => currency.toUpperCase()) ?? [];

  if (
    supportedCurrencies.length > 0 &&
    (!supportedCurrencies.includes(sourceCurrency) ||
      !supportedCurrencies.includes(targetCurrency))
  ) {
    throw new Error("Simulated conversion currency is not supported");
  }

  return {
    sourceCurrency,
    targetCurrency,
    sourceAmount: input.amount,
    convertedAmount: floorTargetUnits(input.amount * input.dailyReferenceRate),
    rate: input.dailyReferenceRate,
    date: input.date,
    kind: "simulation-preview",
  };
}

function floorTargetUnits(value: number): number {
  return Math.floor(value + Number.EPSILON);
}
