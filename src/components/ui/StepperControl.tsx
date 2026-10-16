"use client";

import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { Stepper, type StepperProps } from "./Stepper";

/*
 * The interactive Stepper (DESIGN.md §4.9): click/keyboard steps once; holding a key repeats
 * after a short delay. Controlled (`value` + `onChange`) or uncontrolled (`defaultValue`).
 */

type StepperControlProps = Omit<StepperProps, "value" | "decrementProps" | "incrementProps"> & {
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
};

const REPEAT_DELAY = 420;
const REPEAT_EVERY = 90;

type RepeatState = { delay?: number; repeat?: number; repeated: boolean };

function stopRepeat(state: RepeatState) {
  window.clearTimeout(state.delay);
  window.clearInterval(state.repeat);
}

export function StepperControl({ value, defaultValue = 1, onChange, min = 1, max = 99, ...rest }: StepperControlProps) {
  const [inner, setInner] = useState(defaultValue);
  const current = value ?? inner;
  // The repeat timer outlives the render that started it, so it reads the latest value from here.
  const latest = useRef(current);
  const repeat = useRef<RepeatState>({ repeated: false });

  useEffect(() => {
    latest.current = current;
  }, [current]);

  useEffect(() => {
    const state = repeat.current;
    return () => stopRepeat(state);
  }, []);

  const step = (delta: number) => {
    const next = Math.min(max, Math.max(min, latest.current + delta));
    // At a bound the key disables itself and may never see pointerup, so stop repeating here.
    if (next === min || next === max) stopRepeat(repeat.current);
    if (next === latest.current) return;
    latest.current = next;
    if (value === undefined) setInner(next);
    onChange?.(next);
  };

  const press = (delta: number, event: MouseEvent<HTMLButtonElement>) => {
    // A long press already stepped; swallow the pointer click that ends it (keyboard clicks have detail 0).
    if (repeat.current.repeated && event.detail > 0) {
      repeat.current.repeated = false;
      return;
    }
    step(delta);
  };

  const hold = (delta: number, event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    const state = repeat.current;
    stopRepeat(state);
    state.repeated = false;
    state.delay = window.setTimeout(() => {
      state.repeat = window.setInterval(() => {
        state.repeated = true;
        step(delta);
      }, REPEAT_EVERY);
    }, REPEAT_DELAY);
  };

  const release = () => stopRepeat(repeat.current);

  return (
    <Stepper
      {...rest}
      value={current}
      min={min}
      max={max}
      decrementProps={{
        onClick: (event) => press(-1, event),
        onPointerDown: (event) => hold(-1, event),
        onPointerUp: release,
        onPointerLeave: release,
        onPointerCancel: release,
        onContextMenu: (event) => event.preventDefault(),
      }}
      incrementProps={{
        onClick: (event) => press(1, event),
        onPointerDown: (event) => hold(1, event),
        onPointerUp: release,
        onPointerLeave: release,
        onPointerCancel: release,
        onContextMenu: (event) => event.preventDefault(),
      }}
    />
  );
}
