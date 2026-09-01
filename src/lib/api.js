export async function api(path, options = {}) {
  const response = await fetch(path, { credentials: "include", ...options });
  const result = response.status === 204 ? {} : await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 429) throw new Error("Demasiados intentos. Espera unos minutos antes de intentarlo nuevamente.");
    if (response.status >= 500) throw new Error("El servidor tuvo un problema temporal. Inténtalo nuevamente.");
    throw new Error(result.error || "No fue posible completar la solicitud.");
  }
  return result;
}
