export type PortfolioAllocationInput = {
  baseCurrency: string;
  startingAmount: number;
  allocations: PortfolioAllocation[];
  referenceRatesByDate: Record<string, Record<string, number>>;
};

export type PortfolioAllocation = {
  currency: string;
  percent: number;
};

export type PortfolioPreviewPoint = {
  date: string;
  value: number;
};

export type PortfolioAllocationPreview = {
  baseCurrency: string;
  startingAmount: number;
  kind: "portfolio-allocation-preview";
  allocations: PortfolioAllocation[];
  points: PortfolioPreviewPoint[];
};

export function previewPortfolioAllocation(
  input: PortfolioAllocationInput,
): PortfolioAllocationPreview {
  if (
    typeof input.startingAmount !== "number" ||
    !Number.isFinite(input.startingAmount) ||
    input.startingAmount <= 0
  ) {
    throw new Error("Simulation starting amount must be greater than 0");
  }

  if (input.allocations.length === 0) {
    throw new Error("Manual portfolio allocations are required");
  }

  const baseCurrency = input.baseCurrency.toUpperCase();
  const allocations = input.allocations.map((allocation) => ({
    currency: allocation.currency.toUpperCase(),
    percent: allocation.percent,
  }));
  const totalPercent = allocations.reduce(
    (sum, allocation) => sum + allocation.percent,
    0,
  );

  if (!Number.isFinite(totalPercent) || Math.abs(totalPercent - 100) > 0.0001) {
    throw new Error("Manual portfolio allocations must total 100 percent");
  }

  const sortedDates = Object.keys(input.referenceRatesByDate).sort();
  const startDate = sortedDates[0];

  if (startDate === undefined) {
    throw new Error("Historical reference rates are required");
  }

  const startingPositions = allocations.map((allocation) => {
    const startingBaseValue = input.startingAmount * (allocation.percent / 100);

    if (allocation.currency === baseCurrency) {
      return {
        currency: allocation.currency,
        startingBaseValue,
        units: startingBaseValue,
      };
    }

    const startRate = readReferenceRate(
      input.referenceRatesByDate,
      startDate,
      allocation.currency,
    );

    return {
      currency: allocation.currency,
      startingBaseValue,
      units: startingBaseValue * startRate,
    };
  });

  const points = sortedDates.map((date) => {
    const value = startingPositions.reduce((totalValue, position) => {
      if (position.currency === baseCurrency) {
        return totalValue + position.startingBaseValue;
      }

      const rate = readReferenceRate(
        input.referenceRatesByDate,
        date,
        position.currency,
      );

      return totalValue + position.units / rate;
    }, 0);

    return {
      date,
      value,
    };
  });

  return {
    baseCurrency,
    startingAmount: input.startingAmount,
    kind: "portfolio-allocation-preview",
    allocations,
    points,
  };
}

function readReferenceRate(
  referenceRatesByDate: Record<string, Record<string, number>>,
  date: string,
  currency: string,
): number {
  const rate = referenceRatesByDate[date]?.[currency];

  if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
    throw new Error("Historical reference rate is missing for allocated currency");
  }

  return rate;
}