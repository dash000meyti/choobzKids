"use client";

import { useLayoutEffect } from "react";
import { InlineScript } from "@/components/ui/InlineScript";

/*
 * Pre-paint preferences (DESIGN.md §9.3): the viewer's theme and motion choice and the lite tier,
 * applied to <html> before first paint. No cookies, no server reads — the server always renders
 * light, which is also the default: dark only when the visitor chose it (ThemeToggle).
 *
 * The inline script covers real page loads. In development, Strict Mode remounts <html>/<head>
 * once and resets <html> to the attributes React manages, clearing what the script set; the
 * layout effect re-applies them before paint (a no-op in production).
 */
const SCRIPT = `(function(){var d=document.documentElement;try{var s=localStorage,t=s.getItem("cz.theme"),m=s.getItem("cz.motion");if(t==="dark"){d.dataset.theme=t;var mt=document.querySelector('meta[name="theme-color"]');if(mt)mt.setAttribute("content","#000000")}if(m)d.dataset.motion=m}catch(e){}var n=navigator,c=n.connection;if((c&&c.saveData)||(n.deviceMemory&&n.deviceMemory<=2)||(n.hardwareConcurrency&&n.hardwareConcurrency<=4))d.dataset.lite=""})();`;

function applyPreferences() {
  const d = document.documentElement;
  try {
    if (localStorage.getItem("cz.theme") === "dark") d.dataset.theme = "dark";
    const motion = localStorage.getItem("cz.motion");
    if (motion) d.dataset.motion = motion;
  } catch {}
  const n = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  if (n.connection?.saveData || (n.deviceMemory && n.deviceMemory <= 2) || (n.hardwareConcurrency && n.hardwareConcurrency <= 4)) {
    d.dataset.lite = "";
  }
}

export function ThemeScript() {
  useLayoutEffect(applyPreferences, []);
  return <InlineScript html={SCRIPT} />;
}
