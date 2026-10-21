"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Field } from "@/components/ui/Field";
import { TextInput } from "@/components/ui/TextInput";
import { toEnDigits, toFaDigits } from "@/lib/format";
import { CABINET_CM, CHILD_CM, adviceSentence, recommendLevel, type PlatformLevel } from "./scale-advice";

/*
 * The scale tool's own inputs (DESIGN.md §6.3 block 11): «قد بچهٔ خودم (سانتی‌متر)» and, for
 * products with an adjustable platform, «ارتفاع کابینت شما» (۹۰ by default) with the
 * recommendation sentence. A typed height is written inline as --child-cm on the tool's root (it
 * beats the radios' :has() rules) and the age radios are cleared; picking an age again clears
 * the typed height. The values stay in this component: nothing is stored or sent anywhere.
 */

type HeightInputsProps = {
  /** id of the ScaleCompare section. */
  rootId: string;
  /** name of the age radios inside it. */
  ageInputName: string;
  /** Platform heights; empty = no cabinet input and no recommendation. */
  levels: PlatformLevel[];
  defaultCabinetCm: number;
};

/** «۸۸»، «88»، «۸۷٫۵» → 87.5, or null outside [min, max]. */
function parseCm(value: string, bounds: { min: number; max: number }): number | null {
  const text = toEnDigits(value).replace(/[٫,]/g, ".").trim();
  if (!text) return null;
  const n = Number(text);
  return Number.isFinite(n) && n >= bounds.min && n <= bounds.max ? n : null;
}

const rangeHint = (bounds: { min: number; max: number }) => `بین ${toFaDigits(bounds.min)} تا ${toFaDigits(bounds.max)}`;

function checkedAge(rootId: string, name: string): HTMLInputElement | null {
  return document.getElementById(rootId)?.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`) ?? null;
}

export function HeightInputs({ rootId, ageInputName, levels, defaultCabinetCm }: HeightInputsProps) {
  const [own, setOwn] = useState("");
  const [cabinet, setCabinet] = useState(() => toFaDigits(defaultCabinetCm));
  // The age radio to restore when the typed height is cleared.
  const lastPreset = useRef<HTMLInputElement | null>(null);

  // The checked age radio (the radios work before and without this island). Null on the server.
  const presetCm = useSyncExternalStore(
    (notify) => {
      const root = document.getElementById(rootId);
      root?.addEventListener("change", notify);
      return () => root?.removeEventListener("change", notify);
    },
    () => {
      const checked = checkedAge(rootId, ageInputName);
      return checked ? Number(checked.value) : null;
    },
    () => null,
  );

  const ownCm = parseCm(own, CHILD_CM);
  const cabinetCm = parseCm(cabinet, CABINET_CM) ?? defaultCabinetCm;
  const childCm = ownCm ?? presetCm;
  const custom = levels.length > 0 && (ownCm !== null || cabinetCm !== defaultCabinetCm);
  const level = childCm !== null ? recommendLevel(childCm, cabinetCm, levels) : null;

  // Picking an age again clears the typed height.
  useEffect(() => {
    const root = document.getElementById(rootId);
    if (!root) return;
    lastPreset.current = checkedAge(rootId, ageInputName);
    const onChange = (event: Event) => {
      const input = event.target as HTMLInputElement | null;
      if (input?.name !== ageInputName) return;
      lastPreset.current = input;
      setOwn("");
    };
    root.addEventListener("change", onChange);
    return () => root.removeEventListener("change", onChange);
  }, [rootId, ageInputName]);

  // A typed height drives the doll; clearing it brings the last age back. While a number is
  // still being typed (too short to be valid) the doll keeps its last height.
  const ownEmpty = own.trim() === "";
  useEffect(() => {
    const root = document.getElementById(rootId);
    if (!root) return;
    if (ownCm !== null) {
      root.style.setProperty("--child-cm", String(ownCm));
      root.querySelectorAll<HTMLInputElement>(`input[name="${ageInputName}"]`).forEach((input) => {
        input.checked = false;
      });
    } else if (ownEmpty) {
      root.style.removeProperty("--child-cm");
      const previous = lastPreset.current;
      if (previous && !checkedAge(rootId, ageInputName)) {
        previous.checked = true;
        // Let the :has() rules and the store above see it, as if it had been tapped.
        previous.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
  }, [ownCm, ownEmpty, rootId, ageInputName]);

  useEffect(() => {
    document.getElementById(rootId)?.toggleAttribute("data-custom", custom);
  }, [custom, rootId]);

  const ownError = own.trim() && ownCm === null ? `قد را ${rangeHint(CHILD_CM)} سانتی‌متر بنویس.` : undefined;
  const cabinetError =
    cabinet.trim() && parseCm(cabinet, CABINET_CM) === null ? `ارتفاع را ${rangeHint(CABINET_CM)} سانتی‌متر بنویس.` : undefined;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field id="scale-own-height" label="قد بچهٔ خودم (سانتی‌متر)" error={ownError}>
        {(control) => (
          <TextInput
            {...control}
            numeric
            autoComplete="off"
            placeholder={`مثلاً ${toFaDigits(88)}`}
            value={own}
            onChange={(event) => setOwn(event.target.value)}
          />
        )}
      </Field>
      {levels.length ? (
        <Field id="scale-cabinet" label="ارتفاع کابینت شما (سانتی‌متر)" error={cabinetError}>
          {(control) => (
            <TextInput
              {...control}
              numeric
              autoComplete="off"
              value={cabinet}
              onChange={(event) => setCabinet(event.target.value)}
            />
          )}
        </Field>
      ) : null}
      <p aria-live="polite" className={custom && level && childCm !== null ? "rounded-bit bg-bubble px-4 py-3.5 text-base font-semibold text-ink sm:col-span-2" : "sr-only"}>
        {custom && level && childCm !== null ? adviceSentence(childCm, cabinetCm, level) : ""}
      </p>
    </div>
  );
}
