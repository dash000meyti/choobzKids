import clsx, { type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** Public URL for a media row's path (relative to UPLOAD_DIR). */
export function mediaUrl(relativePath: string): string {
  return `/media/${relativePath.split("/").map(encodeURIComponent).join("/")}`;
}

/** Static brand drawing generated from a manifest (scripts/illustrations/build.ts). */
export function illustrationUrl(key: string, view: "assembled" | "exploded" | "ortho" | "flat" = "assembled", finish?: string) {
  return `/illustrations/${key}-${view}${finish && finish !== "natural" ? `-${finish}` : ""}.svg`;
}

/** FNV-1a 32-bit hash — deterministic seeds for grain, tilts, etc. (never Math.random in render). */
export function fnv1a(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
