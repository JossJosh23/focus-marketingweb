import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { ArrowRight, Building2, Check, Eye, EyeOff, LogOut, ShieldCheck, Sparkles } from "lucide-react";
import "./styles.css";

function Logo() {
  return <div className="brand"><img src="/logo-focugex.png" alt="Logo de FOCUGEX" /><b>FOCU<i>GEX</i></b></div>;
}

function goTo(path) {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function Login() {
  const [role, setRole] = useState("admin");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: data.get("email"), password: data.get("password"), role }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No fue posible iniciar sesión.");
      goTo(result.user.role === "admin" ? "/admin" : "/client");
    } catch (requestError) {
      setError(requestError.message === "Failed to fetch" ? "No fue posible conectar con el servidor." : requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="visual-panel">
        <div className="aurora one"></div><div className="aurora two"></div>
        <div className="rings"><i></i><i></i><i></i></div>
        <div className="security-pill"><span></span> Plataforma privada · Acceso seguro</div>
        <div className="visual-content">
          <Logo />
          <div className="private-label"><ShieldCheck /> ESPACIO PRIVADO</div>
          <h1>Tu marketing,<br /><em>en buenas manos.</em></h1>
          <p>Planifica, revisa y entiende todo lo que hacemos para hacer crecer tu negocio.</p>
        </div>
        <blockquote>“Ahora sabemos qué se publica, cuándo y por qué.”<span>— Cliente de FOCUGEX</span></blockquote>
      </section>

      <section className="form-panel">
        <form onSubmit={submit}>
          <span className="eyebrow">BIENVENIDO DE NUEVO</span>
          <h2>Inicia sesión</h2>
          <p className="lead">Accede a tu espacio de trabajo.</p>
          <div className="role-tabs" aria-label="Seleccionar tipo de acceso">
            <button type="button" className={role === "admin" ? "active" : ""} onClick={() => setRole("admin")}><ShieldCheck /> Administrador</button>
            <button type="button" className={role === "client" ? "active" : ""} onClick={() => setRole("client")}><Building2 /> Cliente</button>
          </div>
          <label>Correo electrónico<input name="email" type="email" autoComplete="email" required placeholder="correo@empresa.com" /></label>
          <label>Contraseña
            <div className="password-field">
              <input name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required placeholder="Ingresa tu contraseña" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>{showPassword ? <EyeOff /> : <Eye />}</button>
            </div>
          </label>
          <div className="form-options">
            <label className="remember"><input type="checkbox" defaultChecked /><span><Check /></span> Recordarme</label>
            <button type="button">¿Olvidaste tu contraseña?</button>
          </div>
          <button className="submit-button" type="submit" disabled={loading}><span>{loading ? "Verificando…" : "Iniciar sesión"}</span>{!loading && <ArrowRight />}</button>
          {error && <div className="error-message" role="alert">{error}</div>}
          <div className="demo-note"><Sparkles /><p><b>Acceso seguro</b><span>Las credenciales se verifican de forma segura en FOCUGEX.</span></p></div>
        </form>
      </section>
    </main>
  );
}

function PrivateArea({ expectedRole }) {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Debes iniciar sesión.");
        return response.json();
      })
      .then(({ user: currentUser }) => {
        if (currentUser.role !== expectedRole) return goTo(currentUser.role === "admin" ? "/admin" : "/client");
        setUser(currentUser);
      })
      .catch((requestError) => setError(requestError.message));
  }, [expectedRole]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    goTo("/");
  }

  if (error) return <main className="session-page"><Logo /><p>{error}</p><button onClick={() => goTo("/")}>Ir al inicio de sesión</button></main>;
  if (!user) return <main className="session-page"><Logo /><p>Verificando tu sesión…</p></main>;

  return (
    <main className="session-page">
      <Logo />
      <span className="eyebrow">ACCESO AUTORIZADO</span>
      <h1>Hola, {user.name}</h1>
      <p>Ingresaste al espacio de {user.role === "admin" ? "administración" : "cliente"} de FOCUGEX.</p>
      <button onClick={logout}><LogOut /> Cerrar sesión</button>
    </main>
  );
}

function App() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const updatePath = () => setPath(window.location.pathname);
    window.addEventListener("popstate", updatePath);
    return () => window.removeEventListener("popstate", updatePath);
  }, []);
  if (path === "/admin") return <PrivateArea expectedRole="admin" />;
  if (path === "/client") return <PrivateArea expectedRole="client" />;
  return <Login />;
}

createRoot(document.getElementById("root")).render(<App />);
