import { cn } from "@/lib/utils";
import { TatiPose } from "./TatiPose";
import styles from "./TatiRider.module.css";

/**
 * The header thread and Tati riding it as scroll progress (DESIGN.md §1.3 G,
 * §9.4). Server component, zero JS: everything is scroll-driven CSS in
 * TatiRider.module.css. Render once, inside the site header.
 *
 * The global class names (`thread`, `tati-rider`) are kept from the §9.4
 * listing so print styles and page-level rules can find the elements; the
 * styling itself is module-scoped. Pages hide the rider with a `.page-404`
 * class on any element, and home hands over from the cover via `.cover`
 * and `.the-end`.
 */
export function TatiRider() {
  return (
    <>
      <div aria-hidden="true" className={cn(styles.thread, "thread")}>
        <span className={styles.taut} />
      </div>
      <div aria-hidden="true" className={cn(styles.rider, "tati-rider")} style={{ viewTransitionName: "tati" }}>
        <TatiPose pose="rolling" className={styles.body} />
      </div>
    </>
  );
}
