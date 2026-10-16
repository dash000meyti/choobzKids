import { cn } from "@/lib/utils";

/** Intrinsic size of one repeat of /endpaper.svg (tower · triangle · duck · bead · sprout). */
export const ENDPAPER_TILE = { width: 220, height: 48 } as const;

/**
 * The footer's top band (DESIGN.md §4.6): a 48 px kahgel strip printed with
 * tiny ply-cut toys, like a picture book's endpapers. Fixed scene colours, so
 * it looks the same in «لالایی». The repeat starts at the right edge (RTL).
 */
export function EndpaperPattern({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("h-12 bg-kahgel bg-repeat-x", className)}
      style={{
        backgroundImage: "url(/endpaper.svg)",
        backgroundSize: `${ENDPAPER_TILE.width}px ${ENDPAPER_TILE.height}px`,
        backgroundPosition: "right center",
      }}
    />
  );
}
