import { PegChoice, type PegChoiceProps } from "./PegChoice";

/* Checkbox: a wooden peg with a check glyph drops into its hole (DESIGN.md §4.9). */
export function Checkbox(props: PegChoiceProps) {
  return <PegChoice {...props} type="checkbox" />;
}
