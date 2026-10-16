import { LETTERING, Lettering, type LetteringProps } from "./Lettering";

/** «نخ از دستمون در رفت!» — the 404 page, beside Tati's slipped pose. */
export function NakhDarRaft({ className }: LetteringProps) {
  return <Lettering className={className}>{LETTERING.nakhDarRaft}</Lettering>;
}
