import type { SimulatedConversionPreview } from "../shared/conversion-preview";

export type SimulationHistoryEntry = Omit<
  SimulatedConversionPreview,
  "kind"
> & {
  id: string;
  kind: "simulation-history-entry";
};

export type AddSimulatedConversionToHistoryInput = {
  existingEntries: SimulationHistoryEntry[];
  preview: SimulatedConversionPreview;
};

export function addSimulatedConversionToHistory({
  existingEntries,
  preview,
}: AddSimulatedConversionToHistoryInput): SimulationHistoryEntry[] {
  return [
    ...existingEntries,
    {
      id: `sim-${existingEntries.length + 1}`,
      sourceCurrency: preview.sourceCurrency,
      targetCurrency: preview.targetCurrency,
      sourceAmount: preview.sourceAmount,
      convertedAmount: preview.convertedAmount,
      rate: preview.rate,
      date: preview.date,
      kind: "simulation-history-entry",
    },
  ];
}
