export function requestCompanyName() {
  return new Promise((resolve) => {
    const backdrop = document.createElement("div");
    backdrop.className = "company-dialog-backdrop";
    backdrop.innerHTML = `
      <section class="company-dialog" role="dialog" aria-modal="true" aria-labelledby="company-dialog-title">
        <header>
          <div class="company-dialog-icon" aria-hidden="true">+</div>
          <div><span>NUEVA EMPRESA</span><h2 id="company-dialog-title">Agregar empresa</h2></div>
          <button type="button" class="company-dialog-close" aria-label="Cerrar">×</button>
        </header>
        <form>
          <p>Crea el espacio de una marca para gestionar su calendario, contenido y usuarios cliente.</p>
          <label>Nombre de la empresa<input name="companyName" maxlength="160" autocomplete="organization" placeholder="Ej. Manabiche" required /></label>
          <small class="company-dialog-error" role="alert"></small>
          <footer><button type="button" class="company-dialog-cancel">Cancelar</button><button class="company-dialog-submit">Crear empresa</button></footer>
        </form>
      </section>`;
    document.body.appendChild(backdrop);
    const input = backdrop.querySelector("input");
    const error = backdrop.querySelector(".company-dialog-error");
    let finished = false;
    function close(value = null) { if (finished) return; finished = true; document.removeEventListener("keydown", onKeyDown); backdrop.remove(); resolve(value); }
    function onKeyDown(event) { if (event.key === "Escape") close(); }
    backdrop.querySelector("form").addEventListener("submit", (event) => { event.preventDefault(); const value = input.value.trim(); if (value.length < 2) { error.textContent = "Escribe un nombre de al menos 2 caracteres."; input.focus(); return; } close(value); });
    backdrop.querySelector(".company-dialog-close").addEventListener("click", () => close());
    backdrop.querySelector(".company-dialog-cancel").addEventListener("click", () => close());
    backdrop.addEventListener("mousedown", (event) => { if (event.target === backdrop) close(); });
    document.addEventListener("keydown", onKeyDown);
    requestAnimationFrame(() => { backdrop.classList.add("visible"); input.focus(); });
  });
}

export function showAppNotice(message) {
  return new Promise((resolve) => {
    const backdrop = document.createElement("div");
    backdrop.className = "company-dialog-backdrop visible";
    backdrop.innerHTML = `<section class="company-dialog company-notice" role="alertdialog" aria-modal="true"><header><div class="company-dialog-icon">!</div><div><span>NO SE PUDO COMPLETAR</span><h2>Revisa la información</h2></div></header><div class="company-notice-body"><p></p><button type="button">Entendido</button></div></section>`;
    backdrop.querySelector("p").textContent = message;
    document.body.appendChild(backdrop);
    function close() { backdrop.remove(); resolve(); }
    backdrop.querySelector("button").addEventListener("click", close);
    backdrop.addEventListener("mousedown", (event) => { if (event.target === backdrop) close(); });
    backdrop.querySelector("button").focus();
  });
}
