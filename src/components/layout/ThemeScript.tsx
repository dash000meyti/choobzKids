/*
 * Pre-paint script (DESIGN.md §9.3): applies the viewer's theme/motion choice and the
 * lite tier before first paint. No cookies, no server reads — the server always renders light.
 */
const SCRIPT = `(function(){var d=document.documentElement;try{var s=localStorage,t=s.getItem("cz.theme"),m=s.getItem("cz.motion");if(t)d.dataset.theme=t;if(m)d.dataset.motion=m}catch(e){}var n=navigator,c=n.connection;if((c&&c.saveData)||(n.deviceMemory&&n.deviceMemory<=2)||(n.hardwareConcurrency&&n.hardwareConcurrency<=4))d.dataset.lite=""})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
