function mountDialog({ eyebrow, title, message, content = "", confirmLabel = "Aceptar", cancelLabel = "", danger = false }) {
  return new Promise((resolve) => {
    const backdrop = document.createElement("div");
    backdrop.className = "app-dialog-backdrop";
    backdrop.innerHTML = `<section class="app-dialog" role="dialog" aria-modal="true"><header><span></span><h2></h2><p></p></header><div class="app-dialog-content"></div><footer></footer></section>`;
    const dialog = backdrop.querySelector(".app-dialog");
    dialog.classList.toggle("danger", danger);
    dialog.querySelector("header span").textContent = eyebrow;
    dialog.querySelector("h2").textContent = title;
    dialog.querySelector("header p").textContent = message;
    const body = dialog.querySelector(".app-dialog-content");
    if (content instanceof HTMLElement) body.append(content); else body.textContent = content;
    if (!content) body.remove();
    const footer = dialog.querySelector("footer");
    if (cancelLabel) { const cancel = document.createElement("button"); cancel.type = "button"; cancel.className = "app-dialog-cancel"; cancel.textContent = cancelLabel; footer.append(cancel); cancel.addEventListener("click", () => close(null)); }
    const confirm = document.createElement("button"); confirm.type = "button"; confirm.className = "app-dialog-confirm"; confirm.textContent = confirmLabel; footer.append(confirm);
    let finished = false;
    function close(value) { if (finished) return; finished = true; document.removeEventListener("keydown", onKeyDown); backdrop.classList.remove("visible"); setTimeout(() => backdrop.remove(), 180); resolve(value); }
    function onKeyDown(event) { if (event.key === "Escape") close(null); }
    confirm.addEventListener("click", () => close(true));
    backdrop.addEventListener("mousedown", (event) => { if (event.target === backdrop) close(null); });
    document.addEventListener("keydown", onKeyDown);
    document.body.append(backdrop);
    requestAnimationFrame(() => { backdrop.classList.add("visible"); confirm.focus(); });
  });
}

export function confirmAction({ title, message, confirmLabel = "Confirmar", danger = false }) {
  return mountDialog({ eyebrow: danger ? "ACCIÓN IMPORTANTE" : "CONFIRMACIÓN", title, message, confirmLabel, cancelLabel: "Cancelar", danger });
}

export function requestText({ title, message, label, placeholder = "", confirmLabel = "Continuar" }) {
  const wrapper = document.createElement("label");
  wrapper.textContent = label;
  const textarea = document.createElement("textarea");
  textarea.rows = 4;
  textarea.placeholder = placeholder;
  wrapper.append(textarea);
  return new Promise((resolve) => {
    mountDialog({ eyebrow: "COMENTARIO REQUERIDO", title, message, content: wrapper, confirmLabel, cancelLabel: "Cancelar" }).then((accepted) => resolve(accepted && textarea.value.trim() ? textarea.value.trim() : null));
    requestAnimationFrame(() => textarea.focus());
  });
}

export function showToast(message, type = "success") {
  let region = document.querySelector(".app-toast-region");
  if (!region) { region = document.createElement("div"); region.className = "app-toast-region"; region.setAttribute("aria-live", "polite"); document.body.append(region); }
  const toast = document.createElement("div"); toast.className = `app-toast ${type}`;
  const icon = document.createElement("i"); icon.textContent = type === "error" ? "!" : type === "info" ? "i" : "✓";
  const text = document.createElement("span"); text.textContent = message;
  toast.append(icon, text); region.append(toast);
  requestAnimationFrame(() => toast.classList.add("visible"));
  setTimeout(() => { toast.classList.remove("visible"); setTimeout(() => toast.remove(), 220); }, 3800);
}
