"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { IconButton } from "@/components/ui/IconButton";
import styles from "./ZoomDialog.module.css";

/*
 * Full-screen photo viewer for the product gallery (DESIGN.md §6.3 block 2). Photo slides are
 * `<button commandfor={id} command="show-modal" data-zoom-index>` invokers, so the dialog opens
 * without this island (and through the InvokerPolyfill where commands are missing); this island
 * only scrolls to the photo that was tapped and toggles a 2× view on tap. Pinch-zoom is the
 * browser's own. The large images sit in the closed dialog with `loading="lazy"`, so nothing is
 * downloaded until the viewer opens. Esc, the backdrop and «بستن» close it.
 */

export type ZoomPhoto = { src: string; width: number; height: number; alt: string; caption: string | null };

type ZoomDialogProps = {
  id: string;
  /** Dialog name, e.g. «عکس‌های برج یادگیری». */
  title: string;
  photos: ZoomPhoto[];
};

export function ZoomDialog({ id, title, photos }: ZoomDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [zoomed, setZoomed] = useState<number | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onTrigger = (event: MouseEvent) => {
      const trigger = (event.target as Element | null)?.closest(`[commandfor="${id}"][data-zoom-index]`);
      if (!trigger) return;
      const index = trigger.getAttribute("data-zoom-index");
      // The dialog opens on this same click; scroll once it is laid out.
      requestAnimationFrame(() => {
        dialog.querySelector(`[data-zoom-photo="${index}"]`)?.scrollIntoView({ block: "nearest", inline: "start" });
      });
    };
    const onClose = () => setZoomed(null);
    document.addEventListener("click", onTrigger);
    dialog.addEventListener("close", onClose);
    return () => {
      document.removeEventListener("click", onTrigger);
      dialog.removeEventListener("close", onClose);
    };
  }, [id]);

  return (
    <dialog ref={dialogRef} id={id} aria-label={title} closedby="any" className={styles.dialog}>
      <form method="dialog" className={styles.close}>
        <IconButton icon="close" label="بستن" type="submit" />
      </form>
      <ul className={styles.strip}>
        {photos.map((photo, index) => (
          <li key={photo.src} data-zoom-photo={index} className={styles.frame} data-zoomed={zoomed === index || undefined}>
            <button
              type="button"
              className={styles.photo}
              aria-pressed={zoomed === index}
              aria-label={zoomed === index ? "اندازهٔ عادی" : "بزرگ‌نمایی"}
              onClick={() => setZoomed((current) => (current === index ? null : index))}
            >
              <Image
                src={photo.src}
                width={photo.width}
                height={photo.height}
                alt={photo.alt}
                sizes="100vw"
                quality={90}
                loading="lazy"
                className={styles.image}
              />
            </button>
            {photo.caption ? <p className="px-4 pt-2 text-center text-sm text-muted">{photo.caption}</p> : null}
          </li>
        ))}
      </ul>
    </dialog>
  );
}
