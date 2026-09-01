export async function api(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  let response;
  try {
    response = await fetch(path, { credentials: "include", ...options, signal: options.signal || controller.signal });
  } catch (error) {
    if (error.name === "AbortError") throw new Error("La solicitud tardó demasiado. Comprueba tu conexión e inténtalo nuevamente.");
    throw new Error("No pudimos conectar con el servidor. Revisa tu conexión a internet.");
  } finally {
    clearTimeout(timeout);
  }
  const result = response.status === 204 ? {} : await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 429) throw new Error("Demasiados intentos. Espera unos minutos antes de intentarlo nuevamente.");
    if (response.status >= 500) throw new Error("El servidor tuvo un problema temporal. Inténtalo nuevamente.");
    throw new Error(result.error || "No fue posible completar la solicitud.");
  }
  return result;
}
