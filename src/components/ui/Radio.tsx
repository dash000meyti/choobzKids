import { PegChoice, type PegChoiceProps } from "./PegChoice";

/*
 * Radio: the same hole with a round peg (DESIGN.md §4.9). Group several with one `name` inside a
 * <fieldset> whose <legend> names the choice.
 */
export function Radio(props: PegChoiceProps) {
  return <PegChoice {...props} type="radio" />;
}
