import { notFound } from "next/navigation";
import { MANIFEST_KEYS } from "@/components/illustrations/manifests";
import { StudioBench } from "@/components/three/StudioBench";

export const metadata = { title: "استودیو رندر", robots: { index: false, follow: false } };

/** Dev-only photo studio: renders the catalogue shots from the product manifests. */
export default function StudioPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <StudioBench keys={[...MANIFEST_KEYS]} />;
}
