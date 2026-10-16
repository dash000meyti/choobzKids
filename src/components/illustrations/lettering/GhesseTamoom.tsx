import { LETTERING, Lettering, type LetteringProps } from "./Lettering";

/** «قصهٔ ما به سر رسید…» — TheEnd, above the closing H2. */
export function GhesseTamoom({ className }: LetteringProps) {
  return <Lettering className={className}>{LETTERING.ghesseTamoom}</Lettering>;
}
