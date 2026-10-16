import { LETTERING, Lettering, type LetteringProps } from "./Lettering";

/** «یکی بود، یکی نبود…» — the cover, engraved on the birch sheet. */
export function YekiBud({ className }: LetteringProps) {
  return <Lettering className={className}>{LETTERING.yekiBud}</Lettering>;
}
