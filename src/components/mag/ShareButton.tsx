"use client";

import { useSyncExternalStore } from "react";
import { toast } from "@/components/layout/Toaster";
import { Button } from "@/components/ui/Button";

/*
 * Share island (DESIGN.md §7.3 #14, §10.2 — ≈0.4 KB): `share` opens the system share sheet
 * (Web Share API) and only appears where the browser has one; `copy` puts the canonical link on
 * the clipboard and confirms with the toast «لینک کپی شد». No third-party scripts.
 */

type ShareButtonProps = {
  mode: "share" | "copy";
  /** Absolute canonical URL (never read from `location`, so tracking params are not shared). */
  url: string;
  title: string;
};

const noop = () => () => {};
const canShare = () => typeof navigator.share === "function";

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function ShareButton({ mode, url, title }: ShareButtonProps) {
  const shareable = useSyncExternalStore(noop, canShare, () => false);

  if (mode === "share") {
    if (!shareable) return null;
    const share = () => {
      navigator.share({ title, url }).catch(() => {
        // Dismissed by the reader, or not allowed here: nothing to do.
      });
    };
    return (
      <Button variant="secondary" size="sm" iconStart="share" onClick={share}>
        اشتراک‌گذاری
      </Button>
    );
  }

  const copy = async () => {
    if (await copyText(url)) toast("لینک کپی شد", undefined, "link");
    else toast("کپی نشد؛ لینک را از نوار نشانی بردارید.", undefined, "info");
  };
  return (
    <Button variant="quiet" size="sm" iconStart="link" onClick={copy}>
      کپی لینک
    </Button>
  );
}
