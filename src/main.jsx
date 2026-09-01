import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { AlertTriangle, ArrowRight, Building2, Check, Eye, EyeOff, LogOut, ShieldCheck, Sparkles } from "lucide-react";
import "./styles.css";

function Logo() {
  return <div className="brand"><img src="/logo-focugex.png" alt="Logo de FOCUGEX" /><b>FOCU<i>GEX</i></b></div>;
}

function goTo(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function LoadingScreen() {
  return <main className="loading-screen"><Logo /><div className="loader" aria-hidden="true"></div><p>Verificando tu sesión segura…</p></main>;
}

function Login() {
  const [role, setRole] = useState("admin");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [capsLock, setCapsLock] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [connection, setConnection] = useState("checking");

  useEffect(() => {
    let active = true;
    async function checkConnection() {
      try {
        const response = await fetch("/health", { cache: "no-store" });
        if (active) setConnection(response.ok ? "online" : "offline");
      } catch {
        if (active) setConnection("offline");
      }
    }
    checkConnection();
    const interval = window.setInterval(checkConnection, 30000);
    return () => { active = false; window.clearInterval(interval); };
  }, []);

  async function submit(event) {
    event.preventDefault();
    if (connection === "offline") return setError("El servidor no está disponible. Inténtalo nuevamente en unos momentos.");
    setLoading(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: data.get("email"), password: data.get("password"), role, remember }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 429) throw new Error("Demasiados intentos. Espera 15 minutos antes de volver a intentarlo.");
        if (response.status >= 500) throw new Error("El servidor tuvo un problema temporal. Inténtalo nuevamente.");
        throw new Error(result.error || "No fue posible iniciar sesión.");
      }
      goTo(result.user.role === "admin" ? "/admin" : "/client");
    } catch (requestError) {
      setError(requestError.name === "TypeError" ? "No se pudo conectar con el servidor. Revisa tu conexión a internet." : requestError.message);
    } finally {
      setLoading(false);
    }
  }

  function detectCapsLock(event) {
    setCapsLock(event.getModifierState?.("CapsLock") || false);
  }

  return (
    <main className="login-page">
      <section className="visual-panel">
        <div className="aurora one"></div><div className="aurora two"></div><div className="rings"><i></i><i></i><i></i></div>
        <div className="security-pill"><span></span> Plataforma privada · Acceso seguro</div>
        <div className="visual-content"><Logo /><div className="private-label"><ShieldCheck /> ESPACIO PRIVADO</div><h1>Tu marketing,<br /><em>en buenas manos.</em></h1><p>Planifica, revisa y entiende todo lo que hacemos para hacer crecer tu negocio.</p></div>
        <blockquote>“Ahora sabemos qué se publica, cuándo y por qué.”<span>— Cliente de FOCUGEX</span></blockquote>
      </section>

      <section className="form-panel">
        <form onSubmit={submit}>
          <div className={`connection-status ${connection}`}><span></span>{connection === "online" ? "Sistema disponible" : connection === "offline" ? "Sin conexión al servidor" : "Comprobando conexión"}</div>
          <span className="eyebrow">BIENVENIDO DE NUEVO</span><h2>Inicia sesión</h2><p className="lead">Accede a tu espacio de trabajo.</p>
          <div className="role-tabs" aria-label="Seleccionar tipo de acceso">
            <button type="button" className={role === "admin" ? "active" : ""} onClick={() => setRole("admin")}><ShieldCheck /> Administrador</button>
            <button type="button" className={role === "client" ? "active" : ""} onClick={() => setRole("client")}><Building2 /> Cliente</button>
          </div>
          <label>Correo electrónico<input name="email" type="email" autoComplete="email" required placeholder="correo@empresa.com" /></label>
          <label>Contraseña
            <div className="password-field">
              <input name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required placeholder="Ingresa tu contraseña" onKeyDown={detectCapsLock} onKeyUp={detectCapsLock} onBlur={() => setCapsLock(false)} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>{showPassword ? <EyeOff /> : <Eye />}</button>
            </div>
          </label>
          {capsLock && <div className="caps-warning"><AlertTriangle /> Bloq Mayús está activado</div>}
          <div className="form-options">
            <label className="remember"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /><span><Check /></span> Recordarme</label>
            <button type="button">¿Olvidaste tu contraseña?</button>
          </div>
          <button className="submit-button" type="submit" disabled={loading || connection === "offline"}><span>{loading ? "Verificando…" : "Iniciar sesión"}</span>{loading ? <i className="button-spinner"></i> : <ArrowRight />}</button>
          {error && <div className="error-message" role="alert"><AlertTriangle /> {error}</div>}
          <div className="demo-note"><Sparkles /><p><b>Acceso seguro</b><span>Tu sesión está protegida y las contraseñas nunca se guardan como texto.</span></p></div>
        </form>
      </section>
    </main>
  );
}

function PrivateArea({ user }) {
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.location.assign("/");
  }
  return <main className="session-page"><Logo /><span className="eyebrow">ACCESO AUTORIZADO</span><h1>Hola, {user.name}</h1><p>Ingresaste al espacio de {user.role === "admin" ? "administración" : "cliente"} de FOCUGEX.</p><button onClick={logout}><LogOut /> Cerrar sesión</button></main>;
}

function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [session, setSession] = useState({ checking: true, user: null });

  useEffect(() => {
    const updatePath = () => setPath(window.location.pathname);
    window.addEventListener("popstate", updatePath);
    return () => window.removeEventListener("popstate", updatePath);
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me", { credentials: "include", cache: "no-store" })
      .then(async (response) => response.ok ? response.json() : { user: null })
      .then(({ user }) => { if (active) setSession({ checking: false, user }); })
      .catch(() => { if (active) setSession({ checking: false, user: null }); });
    return () => { active = false; };
  }, [path]);

  if (session.checking) return <LoadingScreen />;
  if (session.user) {
    const correctPath = session.user.role === "admin" ? "/admin" : "/client";
    if (path !== correctPath) { window.setTimeout(() => goTo(correctPath), 0); return <LoadingScreen />; }
    return <PrivateArea user={session.user} />;
  }
  if (path === "/admin" || path === "/client") { window.setTimeout(() => goTo("/"), 0); return <LoadingScreen />; }
  return <Login />;
}

createRoot(document.getElementById("root")).render(<App />);
