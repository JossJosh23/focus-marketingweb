export function goTo(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

export function pathForRole(role) {
  if (role === "admin") return "/admin";
  if (role === "manager") return "/manager";
  return "/client";
}
