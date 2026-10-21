import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

/*
 * Medical disclaimer for YMYL articles (DESIGN.md §7.3 #8, SEO.md §8.7): small and calm, flat on
 * the paper above the FAQ, never alarming.
 */

export const MEDICAL_NOTE = "این مطلب جایگزین مشاورهٔ پزشک نیست.";

export function MedicalNote({ className }: { className?: string }) {
  return (
    <aside role="note" aria-label="یادداشت پزشکی" className={cn("flex items-start gap-2.5 border-s-2 border-line-strong ps-3 text-sm text-muted", className)}>
      <Icon name="info" className="mt-0.5 size-4 shrink-0" />
      <p>
        {MEDICAL_NOTE} اگر دربارهٔ رشد یا سلامت فرزندتان نگرانی دارید، با پزشک کودک مشورت کنید.
      </p>
    </aside>
  );
}
