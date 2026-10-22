/*
 * Pre-paint script (DESIGN.md §9.3): applies the viewer's theme/motion choice and the
 * lite tier before first paint. No cookies, no server reads — the server always renders light,
 * which is also the default: dark only when the visitor chose it (ThemeToggle).
 */
const SCRIPT = `(function(){var d=document.documentElement;try{var s=localStorage,t=s.getItem("cz.theme"),m=s.getItem("cz.motion");if(t==="dark"){d.dataset.theme=t;var mt=document.querySelector('meta[name="theme-color"]');if(mt)mt.setAttribute("content","#000000")}if(m)d.dataset.motion=m}catch(e){}var n=navigator,c=n.connection;if((c&&c.saveData)||(n.deviceMemory&&n.deviceMemory<=2)||(n.hardwareConcurrency&&n.hardwareConcurrency<=4))d.dataset.lite=""})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
