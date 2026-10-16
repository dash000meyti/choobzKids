/*
 * Fallbacks for two HTML features the chrome relies on (loaded by InvokerPolyfill only where
 * missing):
 *   - invoker commands: <button commandfor="id" command="show-modal|close|request-close|
 *     toggle-popover|show-popover|hide-popover">
 *   - <dialog closedby="any">: a click on the backdrop closes the dialog.
 */

function runCommand(button: HTMLButtonElement) {
  const id = button.getAttribute("commandfor");
  const command = button.getAttribute("command");
  if (!id || !command || button.disabled) return;
  const target = document.getElementById(id);
  if (!target) return;

  if (target instanceof HTMLDialogElement) {
    if (command === "show-modal" && !target.open) target.showModal();
    else if (command === "close" && target.open) target.close();
    else if (command === "request-close" && target.open) {
      if (typeof target.requestClose === "function") target.requestClose();
      else target.close();
    }
    return;
  }
  if (!target.hasAttribute("popover")) return;
  const open = target.matches(":popover-open");
  if (command === "toggle-popover") target.togglePopover();
  else if (command === "show-popover" && !open) target.showPopover();
  else if (command === "hide-popover" && open) target.hidePopover();
}

function onCommandClick(event: MouseEvent) {
  const button = (event.target as Element | null)?.closest?.("button[commandfor]");
  if (button instanceof HTMLButtonElement) runCommand(button);
}

function onBackdropClick(event: MouseEvent) {
  const dialog = event.target;
  if (!(dialog instanceof HTMLDialogElement) || !dialog.open || dialog.getAttribute("closedby") !== "any") return;
  // Clicks on the dialog element itself, outside its box, come from the ::backdrop.
  const box = dialog.getBoundingClientRect();
  const inside = event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom;
  if (!inside) dialog.close();
}

let installed = false;

export function installInvokerFallbacks({ commands, closedBy }: { commands: boolean; closedBy: boolean }) {
  if (installed) return;
  installed = true;
  if (commands) document.addEventListener("click", onCommandClick);
  if (closedBy) document.addEventListener("click", onBackdropClick);
}
