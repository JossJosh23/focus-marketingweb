import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowRight,
  Building2,
  Check,
  Eye,
  EyeOff,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import "./styles.css";

function Logo() {
  return (
    <div className="brand">
      <span><Zap /></span>
      <b>Marketing<i>Yorch</i></b>
    </div>
  );
}

function Login() {
  const [role, setRole] = useState("admin");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  function submit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    window.setTimeout(() => {
      setLoading(false);
      setMessage(`Acceso de ${role === "admin" ? "administrador" : "cliente"} listo para conectar al backend.`);
    }, 700);
  }

  return (
    <main className="login-page">
      <section className="visual-panel">
        <div className="aurora one"></div>
        <div className="aurora two"></div>
        <div className="rings"><i></i><i></i><i></i></div>

        <div className="security-pill"><span></span> Plataforma privada · Acceso seguro</div>

        <div className="visual-content">
          <Logo />
          <div className="private-label"><ShieldCheck /> ESPACIO PRIVADO</div>
          <h1>Tu marketing,<br /><em>en buenas manos.</em></h1>
          <p>Planifica, revisa y entiende todo lo que hacemos para hacer crecer tu negocio.</p>
        </div>

        <blockquote>
          “Ahora sabemos qué se publica, cuándo y por qué.”
          <span>— Cliente de MarketingYorch</span>
        </blockquote>
      </section>

      <section className="form-panel">
        <form onSubmit={submit}>
          <span className="eyebrow">BIENVENIDO DE NUEVO</span>
          <h2>Inicia sesión</h2>
          <p className="lead">Accede a tu espacio de trabajo.</p>

          <div className="role-tabs" aria-label="Seleccionar tipo de acceso">
            <button type="button" className={role === "admin" ? "active" : ""} onClick={() => setRole("admin")}>
              <ShieldCheck /> Administrador
            </button>
            <button type="button" className={role === "client" ? "active" : ""} onClick={() => setRole("client")}>
              <Building2 /> Cliente
            </button>
          </div>

          <label>
            Correo electrónico
            <input
              key={role}
              type="email"
              required
              defaultValue={role === "admin" ? "admin@marketingyorch.com" : "cliente@empresa.com"}
              placeholder="correo@empresa.com"
            />
          </label>

          <label>
            Contraseña
            <div className="password-field">
              <input type={showPassword ? "text" : "password"} required defaultValue="demostracion" placeholder="Ingresa tu contraseña" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </label>

          <div className="form-options">
            <label className="remember"><input type="checkbox" defaultChecked /><span><Check /></span> Recordarme</label>
            <button type="button">¿Olvidaste tu contraseña?</button>
          </div>

          <button className="submit-button" type="submit" disabled={loading}>
            <span>{loading ? "Preparando tu espacio…" : "Iniciar sesión"}</span>
            {!loading && <ArrowRight />}
          </button>

          {message && <div className="success-message"><Check /> {message}</div>}

          <div className="demo-note">
            <Sparkles />
            <p><b>Modo demostración</b><span>Selecciona un perfil para explorar. Las credenciales no son reales.</span></p>
          </div>
        </form>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<Login />);
