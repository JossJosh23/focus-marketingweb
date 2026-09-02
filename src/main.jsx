import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Copy,
  Dices,
  Download,
  Eye,
  EyeOff,
  FileDown,
  FileImage,
  Image,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Mail,
  Menu,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Smartphone,
  Trash2,
  Upload,
  UserPlus,
  UserRound,
  Users,
  Video,
  X,
} from "lucide-react";
import { Logo } from "./components/Logo.jsx";
import { api } from "./lib/api.js";
import { requestCompanyName, showAppNotice } from "./lib/companyDialog.js";
import { confirmAction, requestText, showToast } from "./lib/appDialog.js";
import { createCalendarPdf } from "./lib/calendarPdf.js";
import { goTo, pathForRole } from "./lib/navigation.js";
import "./styles.css";
import "./design-system.css";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LoadingScreen({ text = "Verificando tu sesión segura…" }) {
  return (
    <main className="loading-screen">
      <Logo />
      <div className="loader"></div>
      <p>{text}</p>
    </main>
  );
}

function FullPageRedirect({ to, text = "Abriendo tu espacio…" }) {
  useEffect(() => {
    window.location.replace(to);
  }, [to]);
  return <LoadingScreen text={text} />;
}

function MaintenanceScreen({ retry }) {
  return (
    <main className="maintenance-page">
      <Logo />
      <div className="maintenance-icon">
        <RefreshCw />
      </div>
      <span className="eyebrow">CONEXIÓN TEMPORALMENTE INTERRUMPIDA</span>
      <h1>
        Estamos realizando
        <br />
        una mejora.
      </h1>
      <p>Tu espacio estará disponible nuevamente en unos minutos.</p>
      <button onClick={retry}>
        <RefreshCw /> Volver a comprobar
      </button>
    </main>
  );
}

function VisualPanel() {
  function moveRings(event) {
    const panel = event.currentTarget.getBoundingClientRect();
    const pointerX = event.clientX - panel.left;
    const pointerY = event.clientY - panel.top;
    event.currentTarget.style.setProperty("--focus-x", `${pointerX}px`);
    event.currentTarget.style.setProperty("--focus-y", `${pointerY}px`);
    let nearest = null;
    let nearestDistance = Infinity;
    event.currentTarget.querySelectorAll(".focus-word").forEach((word) => {
      const bounds = word.getBoundingClientRect();
      const distance = Math.hypot(
        event.clientX - (bounds.left + bounds.width / 2),
        event.clientY - (bounds.top + bounds.height / 2),
      );
      if (distance < nearestDistance) {
        nearest = word;
        nearestDistance = distance;
      }
      word.classList.remove("active");
    });
    nearest?.classList.add("active");
    event.currentTarget.dataset.focusActive = "true";
  }
  function clearFocus(event) {
    delete event.currentTarget.dataset.focusActive;
    event.currentTarget
      .querySelectorAll(".focus-word")
      .forEach((word) => word.classList.remove("active"));
  }
  return (
    <section
      className="visual-panel"
      onPointerMove={moveRings}
      onPointerLeave={clearFocus}
    >
      <div className="focus-depth" aria-hidden="true">
        <span className="focus-word strategy">Estrategia</span>
        <span className="focus-word content">Contenido</span>
        <span className="focus-word brand-word">Marca</span>
        <span className="focus-word results">Resultados</span>
        <span className="focus-word ideas">Ideas</span>
        <span className="focus-word audience">Audiencia</span>
        <span className="focus-word campaigns">Campañas</span>
        <span className="focus-word design">Diseño</span>
        <span className="focus-word impact">Impacto</span>
        <span className="focus-word growth">Crecimiento</span>
      </div>
      <div className="visual-content">
        <Logo />
        <h1>
          Tu marketing,
          <br />
          en buenas manos.
        </h1>
        <p>
          Planifica, revisa y entiende todo lo que hacemos para hacer crecer tu
          negocio.
        </p>
      </div>
    </section>
  );
}

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [capsLock, setCapsLock] = useState(false);
  const [stage, setStage] = useState("");
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [connection, setConnection] = useState("checking");

  async function checkConnection() {
    setConnection("checking");
    try {
      const response = await fetch("/health", { cache: "no-store" });
      setConnection(response.ok ? "online" : "offline");
    } catch {
      setConnection("offline");
    }
  }
  useEffect(() => {
    checkConnection();
    const timer = setInterval(checkConnection, 30000);
    return () => clearInterval(timer);
  }, []);

  async function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email")).trim();
    if (!emailPattern.test(email)) {
      setEmailError("Escribe un correo electrónico válido.");
      return;
    }
    setEmailError("");
    setError("");
    setStage("Verificando credenciales…");
    try {
      const result = await api("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password: data.get("password"),
          remember,
        }),
      });
      setStage("Protegiendo tu sesión…");
      await new Promise((resolve) => setTimeout(resolve, 300));
      setStage("Abriendo tu espacio…");
      await new Promise((resolve) => setTimeout(resolve, 250));
      window.location.assign(pathForRole(result.user.role));
    } catch (requestError) {
      setError(
        requestError.name === "TypeError"
          ? "No se pudo conectar con el servidor. Revisa tu conexión a internet."
          : requestError.message,
      );
      setStage("");
    }
  }
  if (connection === "offline")
    return <MaintenanceScreen retry={checkConnection} />;

  return (
    <main className="login-page">
      <VisualPanel />
      <section className="form-panel">
        <div className="login-card">
          <form onSubmit={submit} noValidate>
            <div className={`connection-status ${connection}`}>
              {connection === "online"
                ? "Sistema disponible"
                : "Comprobando conexión"}
            </div>
            <span className="login-kicker">Bienvenido de nuevo</span>
            <h2>Inicia sesión</h2>
            <p className="lead">
              Ingresa tus datos; te llevaremos automáticamente a tu espacio.
            </p>
            <label>
              Correo electrónico
              <div className={`input-shell ${emailError ? "invalid" : ""}`}>
                <Mail />
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="correo@empresa.com"
                  onChange={() => setEmailError("")}
                />
              </div>
            </label>
            {emailError && (
              <div className="field-error">
                <AlertTriangle />
                {emailError}
              </div>
            )}
            <label>
              Contraseña
              <div className="input-shell password-field">
                <LockKeyhole />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  minLength="10"
                  required
                  placeholder="Ingresa tu contraseña"
                  onKeyDown={(e) => setCapsLock(e.getModifierState("CapsLock"))}
                  onKeyUp={(e) => setCapsLock(e.getModifierState("CapsLock"))}
                  onBlur={() => setCapsLock(false)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </label>
            {capsLock && (
              <div className="caps-warning">
                <AlertTriangle /> Bloq Mayús está activado
              </div>
            )}
            <div className="form-options">
              <label className="remember">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span>
                  <Check />
                </span>{" "}
                Recordarme
              </label>
              <button type="button" onClick={() => goTo("/forgot-password")}>
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <button
              className="submit-button"
              type="submit"
              disabled={Boolean(stage) || connection !== "online"}
            >
              <span>{stage || "Iniciar sesión"}</span>
              {stage ? <i className="button-spinner"></i> : <ArrowRight />}
            </button>
            <div className="secure-note">
              <ShieldCheck />
              <p>
                <b>Acceso protegido</b>
                <span>
                  Conexión cifrada · Contraseña protegida · Sesión privada
                </span>
              </p>
            </div>
            <button
              className="register-link"
              type="button"
              onClick={() => goTo("/register")}
            >
              ¿Eres gestor de marketing? Crear una cuenta
            </button>
            {error && (
              <div className="error-message" role="alert">
                <AlertTriangle /> {error}
              </div>
            )}
          </form>
        </div>
      </section>
    </main>
  );
}

function AuthCard({ children }) {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <Logo />
        {children}
      </div>
    </main>
  );
}

function ForgotPassword() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = new FormData(event.currentTarget);
      const result = await api("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.get("email") }),
      });
      setMessage(result.message);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  return (
    <AuthCard>
      <button className="back-link" onClick={() => goTo("/")}>
        <ArrowLeft /> Volver
      </button>
      <span className="eyebrow">RECUPERACIÓN SEGURA</span>
      <h1>Recupera tu acceso</h1>
      <p>Te enviaremos un enlace que vence en 30 minutos.</p>
      {message ? (
        <div className="success-box">
          <CheckCircle2 />
          {message}
        </div>
      ) : (
        <form onSubmit={submit}>
          <label>
            Correo electrónico
            <div className="input-shell">
              <Mail />
              <input
                name="email"
                type="email"
                required
                placeholder="correo@empresa.com"
              />
            </div>
          </label>
          <button className="submit-button" disabled={loading}>
            {loading ? "Enviando…" : "Enviar enlace"}
            <ArrowRight />
          </button>
          {error && (
            <div className="error-message">
              <AlertTriangle />
              {error}
            </div>
          )}
        </form>
      )}
    </AuthCard>
  );
}

function RegisterManager() {
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    agencyName: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }
  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const result = await api("/api/auth/register-manager", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setMessage(result.message);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <AuthCard>
      <button className="back-link" onClick={() => goTo("/")}>
        <ArrowLeft /> Volver
      </button>
      <span className="eyebrow">REGISTRO DE GESTOR</span>
      <h1>Crea tu espacio de marketing</h1>
      <p>
        Registra tu agencia. Después podrás crear las empresas de tus clientes.
      </p>
      {message ? (
        <>
          <div className="success-box">
            <CheckCircle2 />
            {message}
          </div>
          <button className="submit-button" onClick={() => goTo("/")}>
            Iniciar sesión <ArrowRight />
          </button>
        </>
      ) : (
        <form className="register-form" onSubmit={submit}>
          <label>
            Nombre completo
            <input
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              required
            />
          </label>
          <label>
            Nombre de usuario
            <input
              value={form.username}
              onChange={(e) =>
                update(
                  "username",
                  e.target.value.toLowerCase().replace(/\s/g, ""),
                )
              }
              minLength="3"
              required
            />
          </label>
          <label>
            Nombre de tu agencia
            <input
              value={form.agencyName}
              onChange={(e) => update("agencyName", e.target.value)}
              placeholder="Ej. Agencia San Jorge"
              required
            />
          </label>
          <label>
            Correo electrónico
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              required
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              minLength="10"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder="10 caracteres, mayúscula y número"
              required
            />
          </label>
          {error && (
            <div className="error-message">
              <AlertTriangle />
              {error}
            </div>
          )}
          <button
            className="submit-button"
            disabled={saving}
            aria-busy={saving}
          >
            {saving ? "Creando cuenta…" : "Crear cuenta de gestor"}
            <ArrowRight />
          </button>
        </form>
      )}
    </AuthCard>
  );
}

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const token = new URLSearchParams(window.location.search).get("token") || "";
  const checks = [
    password.length >= 10,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
  ];
  async function submit(event) {
    event.preventDefault();
    if (!checks.every(Boolean))
      return setError("La contraseña todavía no cumple los requisitos.");
    if (password !== confirm) return setError("Las contraseñas no coinciden.");
    setSaving(true);
    try {
      const result = await api("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      setMessage(result.message);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <AuthCard>
      <button className="back-link" onClick={() => goTo("/")}>
        <ArrowLeft /> Volver
      </button>
      <span className="eyebrow">NUEVA CONTRASEÑA</span>
      <h1>Protege tu cuenta</h1>
      {message ? (
        <>
          <div className="success-box">
            <CheckCircle2 />
            {message}
          </div>
          <button className="submit-button" onClick={() => goTo("/")}>
            Iniciar sesión <ArrowRight />
          </button>
        </>
      ) : (
        <form onSubmit={submit}>
          <label>
            Nueva contraseña
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="new-password"
              required
            />
          </label>
          <div className="password-checks">
            <span className={checks[0] ? "ok" : ""}>
              <Check />
              10 caracteres
            </span>
            <span className={checks[1] ? "ok" : ""}>
              <Check />
              Una mayúscula
            </span>
            <span className={checks[2] ? "ok" : ""}>
              <Check />
              Un número
            </span>
          </div>
          <label>
            Confirmar contraseña
            <input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              type="password"
              autoComplete="new-password"
              required
            />
          </label>
          <button className="submit-button">
            Actualizar contraseña <ArrowRight />
          </button>
          {error && (
            <div className="error-message">
              <AlertTriangle />
              {error}
            </div>
          )}
        </form>
      )}
    </AuthCard>
  );
}

function generateUserPassword(name) {
  const base = (name.trim().split(/\s+/)[0] || "Focugex")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 6);
  const prefix = base
    ? base[0].toUpperCase() + base.slice(1).toLowerCase()
    : "Focugex";
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const random = crypto.getRandomValues(new Uint32Array(8));
  const suffix = Array.from(
    random,
    (value) => alphabet[value % alphabet.length],
  ).join("");
  return `${prefix}@${suffix}`;
}

function UserModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: user?.name || "",
    username: user?.username || "",
    email: user?.email || "",
    companyName: user?.agency_name || user?.company_name || "",
    role: user?.role || "client",
    password: "",
    active: user?.active ?? true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }
  function generate() {
    update("password", generateUserPassword(form.name));
    setShowPassword(true);
  }
  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const result = await api(
        user ? `/api/admin/users/${user.id}` : "/api/admin/users",
        {
          method: user ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      onSaved(result.user);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <div
      className="user-modal-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className="user-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-modal-title"
      >
        <header>
          <div>
            <span className="eyebrow">GESTIÓN DE ACCESO</span>
            <h2 id="user-modal-title">
              {user ? "Editar usuario" : "Crear usuario"}
            </h2>
            <p>
              {user
                ? "Actualiza la información o el acceso de esta cuenta."
                : "Crea una cuenta de gestor de marketing o cliente."}
            </p>
          </div>
          <button onClick={onClose} aria-label="Cerrar">
            <X />
          </button>
        </header>
        <form onSubmit={submit}>
          <div className="user-form-grid">
            <label>
              Nombre completo
              <input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                required
                placeholder="Ej. Adriana López"
              />
            </label>
            <label>
              Nombre de usuario
              <input
                value={form.username}
                onChange={(e) =>
                  update(
                    "username",
                    e.target.value.toLowerCase().replace(/\s/g, ""),
                  )
                }
                required
                minLength="3"
                placeholder="adriana.lopez"
              />
            </label>
            <label>
              Correo electrónico
              <input
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                type="email"
                required
                placeholder="usuario@gmail.com"
              />
            </label>
            <label>
              Rol de acceso
              <select
                value={form.role}
                onChange={(e) => update("role", e.target.value)}
              >
                <option value="client">Cliente · revisa y aprueba</option>
                <option value="collaborator">
                  Colaborador · trabaja para la agencia
                </option>
                <option value="manager">Gestor · propietario de agencia</option>
              </select>
            </label>
            <label>
              {form.role === "client" ? "Empresa del cliente" : "Agencia"}
              <input
                value={form.companyName}
                onChange={(e) => update("companyName", e.target.value)}
                required
                placeholder={
                  form.role === "client"
                    ? "Ej. Manabiche"
                    : "Ej. Agencia San Jorge"
                }
              />
            </label>
          </div>
          <label>
            Contraseña{" "}
            {user && <small>Déjala vacía para conservar la actual</small>}
            <div className="generated-password">
              <input
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                type={showPassword ? "text" : "password"}
                required={!user}
                minLength="10"
                placeholder="Mínimo 10 caracteres"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Mostrar contraseña"
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
              <button
                type="button"
                className="generate-button"
                onClick={generate}
              >
                <Dices /> Generar clave
              </button>
              {form.password && (
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(form.password)}
                  aria-label="Copiar contraseña"
                >
                  <Copy />
                </button>
              )}
            </div>
          </label>
          {user && (
            <label className="user-active-toggle">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => update("active", e.target.checked)}
              />
              <span>
                <i></i>
              </span>
              <div>
                <b>Usuario activo</b>
                <small>Puede iniciar sesión en la plataforma</small>
              </div>
            </label>
          )}
          {error && (
            <div className="error-message">
              <AlertTriangle />
              {error}
            </div>
          )}
          <footer>
            <button type="button" onClick={onClose}>
              Cancelar
            </button>
            <button className="save-user" disabled={saving} aria-busy={saving}>
              {saving
                ? "Guardando…"
                : user
                  ? "Guardar cambios"
                  : "Crear usuario"}
              <ArrowRight />
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function UsersModule({ users, onCreate, onEdit, onDelete }) {
  const [query, setQuery] = useState("");
  const members = users.filter((item) => item.role !== "admin");
  const filtered = members.filter((item) =>
    `${item.name} ${item.username} ${item.email} ${item.company_name} ${item.role}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <div className="users-module">
      <div className="users-heading">
        <div>
          <span className="eyebrow">GESTIÓN DE EQUIPO</span>
          <h1>Usuarios</h1>
          <p>
            Administra gestores, colaboradores y clientes desde un solo lugar.
          </p>
        </div>
        <button onClick={onCreate}>
          <UserPlus /> Crear usuario
        </button>
      </div>
      <div className="users-summary">
        <article>
          <span>Total de usuarios</span>
          <b>{members.length}</b>
        </article>
        <article>
          <span>Equipo de marketing</span>
          <b>
            {
              members.filter((item) =>
                ["manager", "collaborator"].includes(item.role),
              ).length
            }
          </b>
        </article>
        <article>
          <span>Clientes</span>
          <b>{members.filter((item) => item.role === "client").length}</b>
        </article>
      </div>
      <section className="users-table-card">
        <header>
          <div className="users-search">
            <Search />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar usuario, correo o empresa"
            />
          </div>
          <span>
            {filtered.length} resultado{filtered.length === 1 ? "" : "s"}
          </span>
        </header>
        {filtered.length ? (
          <div className="users-table">
            <div className="users-table-row table-head">
              <span>Usuario</span>
              <span>Empresa / rol</span>
              <span>Estado</span>
              <span>Último acceso</span>
              <span></span>
            </div>
            {filtered.map((item) => (
              <div className="users-table-row" key={item.id}>
                <div className="user-cell">
                  <i>
                    {item.name
                      .split(" ")
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join("")}
                  </i>
                  <span>
                    <b>{item.name}</b>
                    <small>
                      @{item.username} · {item.email}
                    </small>
                  </span>
                </div>
                <span className="company-role">
                  {item.role === "client"
                    ? item.company_name
                    : item.agency_name}
                  <small>
                    {item.role === "manager"
                      ? "Gestor de marketing"
                      : item.role === "collaborator"
                        ? "Colaborador"
                        : "Cliente"}
                  </small>
                </span>
                <span>
                  <i
                    className={`status-pill ${item.active ? "active" : "inactive"}`}
                  >
                    {item.active ? "Activo" : "Suspendido"}
                  </i>
                </span>
                <span>
                  {item.last_login_at
                    ? new Date(item.last_login_at).toLocaleDateString("es-EC")
                    : "Sin acceso"}
                </span>
                <div className="user-row-actions">
                  <button onClick={() => onEdit(item)}>
                    <Pencil /> Editar
                  </button>
                  <button
                    className="delete-user"
                    onClick={() => onDelete(item)}
                    aria-label={`Eliminar a ${item.name}`}
                  >
                    <Trash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="users-empty">
            <Users />
            <h3>No hay usuarios todavía</h3>
            <p>Crea una cuenta para comenzar.</p>
            <button onClick={onCreate}>
              <Plus /> Crear primer usuario
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function ActivityModule({ activities }) {
  const actionLabels = {
    "publication.saved": "Publicación guardada",
    "publication.approved": "Publicación aprobada",
    "publication.changes_requested": "Cambios solicitados",
    "calendar.slots_generated": "Espacios del calendario generados",
    "content_plan.saved": "Estrategia mensual guardada",
    "user.created": "Usuario creado",
    "user.updated": "Usuario actualizado",
    "user.deleted": "Usuario eliminado",
    "company.created": "Empresa creada",
    "company.updated": "Empresa actualizada",
  };
  const targetLabels = {
    publication: "Publicación",
    company: "Empresa",
    user: "Usuario",
  };
  return (
    <div className="users-module">
      <div className="users-heading">
        <div>
          <span className="dashboard-intro">Registro de auditoría</span>
          <h1>Actividad</h1>
          <p>
            Últimos eventos de seguridad y gestión registrados por el servidor.
          </p>
        </div>
      </div>
      <section className="activity-log">
        {activities.length ? (
          activities.map((item) => (
            <article key={item.id}>
              <ShieldCheck />
              <div>
                <b>
                  {actionLabels[item.action] ||
                    item.action.replaceAll(".", " · ")}
                </b>
                <span>
                  {item.actor_name || "Usuario eliminado"} ·{" "}
                  {new Date(item.created_at).toLocaleString("es-EC")}
                </span>
              </div>
              <small
                title={`${targetLabels[item.target_type] || item.target_type} #${item.target_id}`}
              >
                {targetLabels[item.target_type] || item.target_type}{" "}
                <i>#{item.target_id}</i>
              </small>
            </article>
          ))
        ) : (
          <div className="users-empty">
            <ShieldCheck />
            <h3>Sin actividad registrada</h3>
            <p>Los nuevos eventos aparecerán aquí.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function AdminPanel({ user }) {
  const [section, setSection] = useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [userModal, setUserModal] = useState(null);
  const profileMenuRef = useRef(null);
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  useEffect(() => {
    api("/api/admin/users")
      .then((result) => setUsers(result.users))
      .catch((error) => showToast(error.message, "error"));
  }, []);
  useEffect(() => {
    if (section === "activity")
      api("/api/admin/activity")
        .then((result) => setActivities(result.activities))
        .catch((error) => showToast(error.message, "error"));
  }, [section]);
  useEffect(() => {
    function closeWithEscape(event) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", closeWithEscape);
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.removeEventListener("keydown", closeWithEscape);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);
  useEffect(() => {
    function closeProfileMenu(event) {
      if (!profileMenuRef.current?.contains(event.target))
        setProfileMenuOpen(false);
    }
    function closeWithEscape(event) {
      if (event.key === "Escape") setProfileMenuOpen(false);
    }
    document.addEventListener("mousedown", closeProfileMenu);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("mousedown", closeProfileMenu);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, []);
  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    window.location.assign("/");
  }
  function openSection(nextSection) {
    setSection(nextSection);
    setMenuOpen(false);
    setProfileMenuOpen(false);
  }
  function saveUser(savedUser) {
    setUsers((current) =>
      current.some((item) => item.id === savedUser.id)
        ? current.map((item) => (item.id === savedUser.id ? savedUser : item))
        : [savedUser, ...current],
    );
    setUserModal(null);
    showToast("Usuario guardado correctamente.", "success");
  }
  async function deleteUser(selectedUser) {
    const confirmed = await confirmAction({
      title: "Eliminar usuario",
      message: `Se eliminará definitivamente la cuenta de ${selectedUser.name} y se cerrarán sus sesiones activas.`,
      confirmLabel: "Eliminar usuario",
      danger: true,
    });
    if (!confirmed) return;
    try {
      await api(`/api/admin/users/${selectedUser.id}`, { method: "DELETE" });
      setUsers((current) =>
        current.filter((item) => item.id !== selectedUser.id),
      );
      showToast("Usuario eliminado.", "success");
    } catch (error) {
      showToast(error.message, "error");
    }
  }

  return (
    <main className="admin-shell admin-dark">
      <section className="admin-workspace">
        <header className="admin-topbar">
          <button
            className="mobile-menu"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir navegación"
          >
            <Menu />
          </button>
          <div className="admin-breadcrumb">
            <span>Panel administrativo</span>
            <b>
              {section === "users"
                ? "Usuarios"
                : section === "activity"
                  ? "Actividad"
                  : "Resumen"}
            </b>
          </div>
          <div className="topbar-actions">
            <div className="topbar-profile-wrap" ref={profileMenuRef}>
              <button
                className={`topbar-profile ${profileMenuOpen ? "active" : ""}`}
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                aria-expanded={profileMenuOpen}
                aria-haspopup="menu"
              >
                <div className="topbar-avatar">
                  {initials}
                  <i></i>
                </div>
                <div className="topbar-profile-copy">
                  <b>{user.name}</b>
                  <span>{user.email}</span>
                </div>
                <small>ADMIN</small>
                <ChevronDown className="profile-chevron" />
              </button>
              {profileMenuOpen && (
                <div className="account-menu" role="menu">
                  <div className="account-menu-group primary">
                    <button
                      role="menuitem"
                      onClick={() => openSection("dashboard")}
                    >
                      <LayoutDashboard />
                      <span>Resumen</span>
                    </button>
                    <button
                      role="menuitem"
                      onClick={() => openSection("users")}
                    >
                      <Users />
                      <span>Usuarios</span>
                    </button>
                  </div>
                  <button
                    className="account-logout"
                    role="menuitem"
                    onClick={logout}
                  >
                    <LogOut /> Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {section === "users" ? (
          <UsersModule
            users={users}
            onCreate={() => setUserModal({ mode: "create" })}
            onEdit={(selectedUser) =>
              setUserModal({ mode: "edit", user: selectedUser })
            }
            onDelete={deleteUser}
          />
        ) : section === "activity" ? (
          <ActivityModule activities={activities} />
        ) : (
          <div className="admin-dashboard">
            <div className="dashboard-heading">
              <div>
                <span className="dashboard-intro">
                  Resumen de la plataforma
                </span>
                <h1>Hola, {user.name.split(" ")[0]}</h1>
                <p>
                  Estos datos provienen de las cuentas registradas en la
                  plataforma.
                </p>
              </div>
            </div>
            <div className="admin-kpis">
              <article className="kpi-primary">
                <div className="kpi-icon purple">
                  <Users />
                </div>
                <span>Cuentas administradas</span>
                <b>{users.filter((item) => item.role !== "admin").length}</b>
                <small>Gestores y clientes registrados</small>
              </article>
              <article className="kpi-managers">
                <div className="kpi-icon blue">
                  <UserRound />
                </div>
                <span>Gestores</span>
                <b>{users.filter((item) => item.role === "manager").length}</b>
                <small>Responsables de marketing</small>
              </article>
              <article className="kpi-clients">
                <div className="kpi-icon cyan">
                  <Building2 />
                </div>
                <span>Clientes</span>
                <b>{users.filter((item) => item.role === "client").length}</b>
                <small>Cuentas de visualización</small>
              </article>
              <article className="kpi-active">
                <div className="kpi-icon orange">
                  <ShieldCheck />
                </div>
                <span>Cuentas activas</span>
                <b>
                  {
                    users.filter((item) => item.role !== "admin" && item.active)
                      .length
                  }
                </b>
                <small>Con acceso habilitado</small>
              </article>
            </div>
            <section className="real-data-note">
              <ShieldCheck />
              <div>
                <h2>Panel sin datos simulados</h2>
                <p>
                  Las métricas de campañas, alcance y aprobaciones aparecerán
                  cuando sus módulos tengan fuentes de datos reales.
                </p>
              </div>
            </section>
          </div>
        )}
      </section>

      {menuOpen && (
        <button
          className="admin-overlay"
          onClick={() => setMenuOpen(false)}
          aria-label="Cerrar navegación"
        ></button>
      )}
      <aside
        className={`admin-sidebar ${menuOpen ? "open" : ""}`}
        aria-label="Panel lateral administrativo"
      >
        <button
          className="sidebar-close"
          onClick={() => setMenuOpen(false)}
          aria-label="Cerrar panel lateral"
        >
          <X />
        </button>
        <div className="sidebar-profile">
          <div className="sidebar-profile-head">
            <Logo />
          </div>
        </div>
        <div className="sidebar-empty">
          <span>Panel administrativo</span>
          <p>Gestiona los accesos de tu plataforma.</p>
        </div>
        <nav className="admin-modules" aria-label="Módulos administrativos">
          <button
            className={section === "dashboard" ? "active" : ""}
            onClick={() => openSection("dashboard")}
          >
            <LayoutDashboard />
            <span>Resumen</span>
          </button>
          <button
            className={section === "users" ? "active" : ""}
            onClick={() => openSection("users")}
          >
            <Users />
            <span>Usuarios</span>
            <small>
              {users.filter((item) => item.role !== "admin").length}
            </small>
          </button>
          <button
            className={section === "activity" ? "active" : ""}
            onClick={() => openSection("activity")}
          >
            <ShieldCheck />
            <span>Actividad</span>
          </button>
        </nav>
        <button className="sidebar-logout" onClick={logout}>
          <LogOut /> Cerrar sesión
        </button>
      </aside>
      {userModal && (
        <UserModal
          user={userModal.user}
          onClose={() => setUserModal(null)}
          onSaved={saveUser}
        />
      )}
    </main>
  );
}

const portalModules = [
  { id: "overview", label: "Resumen", icon: LayoutDashboard },
  { id: "calendar", label: "Calendario", icon: CalendarDays },
  { id: "calendar-pdf", label: "Crear PDF cronograma", icon: FileDown },
];

const emptyPublication = {
  date: "",
  time: "",
  topic: "",
  copy: "",
  objective: "",
  productionReference: "",
  distributionType: "organic",
  format: "post",
  platforms: [],
  mediaUrl: "",
  mediaType: "",
  mediaName: "",
};
const platformOptions = [
  "Instagram",
  "Facebook",
  "TikTok",
  "LinkedIn",
  "YouTube",
];

function PlanModal({ initial, period, company, onClose, onSaved }) {
  const [form, setForm] = useState({
    period,
    strategySummary: "",
    postsPerWeek: 0,
    videosPerMonth: 0,
    videoSchedule: "",
    mainLines: "",
    ...initial,
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }
  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const result = await api("/api/calendar/plan", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Focugex-Company": company,
        },
        body: JSON.stringify({ ...form, period }),
      });
      onSaved(result.plan);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <div
      className="publication-modal-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section className="publication-modal">
        <header>
          <div>
            <span className="eyebrow">ESTRATEGIA MENSUAL</span>
            <h2>Configurar presentación</h2>
          </div>
          <button onClick={onClose}>
            <X />
          </button>
        </header>
        <form onSubmit={submit}>
          <div className="publication-form-grid">
            <label>
              Posts por semana
              <input
                type="number"
                min="0"
                max="30"
                value={form.postsPerWeek}
                onChange={(e) => update("postsPerWeek", Number(e.target.value))}
              />
            </label>
            <label>
              Videos en el mes
              <input
                type="number"
                min="0"
                max="100"
                value={form.videosPerMonth}
                onChange={(e) =>
                  update("videosPerMonth", Number(e.target.value))
                }
              />
            </label>
            <label className="wide">
              Resumen de estrategia
              <textarea
                rows="3"
                value={form.strategySummary}
                onChange={(e) => update("strategySummary", e.target.value)}
                placeholder="Describe cómo se organizará el contenido del mes"
              />
            </label>
            <label className="wide">
              Frecuencia o fechas de video
              <input
                value={form.videoSchedule}
                onChange={(e) => update("videoSchedule", e.target.value)}
                placeholder="Ej. Reels pautados cada 10 días"
              />
            </label>
            <label className="wide">
              Líneas principales
              <textarea
                rows="4"
                value={form.mainLines}
                onChange={(e) => update("mainLines", e.target.value)}
                placeholder="Una línea o idea principal por renglón"
              />
            </label>
          </div>
          {error && (
            <div className="calendar-error">
              <AlertTriangle />
              {error}
            </div>
          )}
          <footer>
            <button type="button" onClick={onClose}>
              Cancelar
            </button>
            <button
              className="save-publication"
              disabled={saving}
              aria-busy={saving}
            >
              <Save />
              {saving ? "Guardando…" : "Guardar estrategia"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

const platformMarks = {
  Instagram: "IG",
  Facebook: "f",
  TikTok: "TT",
  LinkedIn: "in",
  YouTube: "▶",
};
function CalendarContentCard({ item, onSelect }) {
  if (item.isDraftSlot) {
    return (
      <div
        className="calendar-pending-slot"
        aria-label={`Contenido pendiente para el ${item.date}`}
      >
        <span>PENDIENTE</span>
        <strong>Contenido por completar</strong>
        <small>Esta fecha aún no ha sido llenada</small>
      </div>
    );
  }
  const status =
    item.approvalStatus === "approved"
      ? "Aprobado"
      : item.approvalStatus === "changes_requested"
        ? "Cambios"
        : "Pendiente";
  return (
    <button
      type="button"
      className={`calendar-content-card format-${item.format} ${item.distributionType || "organic"}`}
      onClick={() => onSelect(item)}
      title={`Abrir ${item.topic}`}
    >
      <span className="calendar-card-top">
        <em>{item.format}</em>
        <i
          className={`calendar-card-status ${item.approvalStatus || "pending"}`}
        ></i>
      </span>
      <strong>{item.topic}</strong>
      <span className="calendar-card-meta">
        {item.time && (
          <small>
            <Clock3 />
            {item.time}
          </small>
        )}
        <small>{item.distributionType === "paid" ? "Pauta" : "Orgánico"}</small>
      </span>
      <span className="calendar-platforms">
        {(item.platforms || []).map((platform) => (
          <i
            className={`platform-${platform.toLowerCase()}`}
            key={platform}
            title={platform}
            aria-label={platform}
          >
            <span>{platformMarks[platform] || platform.slice(0, 2)}</span>
          </i>
        ))}
        {!(item.platforms || []).length && <small>Sin plataforma</small>}
        <small className="calendar-status-label">{status}</small>
      </span>
    </button>
  );
}
function CalendarPresentation({
  plan,
  items,
  period,
  company,
  onSelectContent,
}) {
  const [year, month] = period.split("-").map(Number);
  const days = new Date(year, month, 0).getDate();
  const offset = (new Date(year, month - 1, 1).getDay() + 6) % 7;
  const monthName = new Date(year, month - 1, 1).toLocaleDateString("es-EC", {
    month: "long",
    year: "numeric",
  });
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return (
    <section className="calendar-presentation">
      <header>
        <span>CRONOGRAMA DE CONTENIDO</span>
        <h2>{company}</h2>
        <p>{monthName}</p>
      </header>
      {plan && (
        <div className="plan-summary">
          <article>
            <small>PUBLICACIONES</small>
            <b>{plan.postsPerWeek || 0}</b>
            <span>por semana</span>
          </article>
          <article>
            <small>VIDEOS</small>
            <b>{plan.videosPerMonth || 0}</b>
            <span>durante el mes</span>
          </article>
          <article>
            <small>PLAN DE VIDEO</small>
            <p>{plan.videoSchedule || "Sin frecuencia definida"}</p>
          </article>
          <div>
            <small>ESTRATEGIA</small>
            <p>{plan.strategySummary || "Sin resumen agregado"}</p>
          </div>
          {plan.mainLines && (
            <div>
              <small>LÍNEAS PRINCIPALES</small>
              <ul>
                {plan.mainLines
                  .split("\n")
                  .filter(Boolean)
                  .map((line) => (
                    <li key={line}>{line}</li>
                  ))}
              </ul>
            </div>
          )}
        </div>
      )}
      <div className="calendar-legend" aria-label="Leyenda del calendario">
        <span className="post">
          <i></i>Publicación
        </span>
        <span className="reel">
          <i></i>Reel
        </span>
        <span className="historia">
          <i></i>Historia
        </span>
        <span className="key-date">
          <i></i>Fecha clave
        </span>
        <span className="pending-slot">
          <i></i>Por completar
        </span>
        <small>Selecciona un contenido para ver todos sus detalles</small>
      </div>
      <div className="month-calendar">
        <div className="weekdays">
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>
        <div className="calendar-days">
          {Array.from({ length: offset }, (_, index) => (
            <i key={`empty-${index}`}></i>
          ))}
          {Array.from({ length: days }, (_, index) => {
            const day = index + 1;
            const date = `${period}-${String(day).padStart(2, "0")}`;
            const entries = items.filter((item) => item.date === date);
            const keyDates = (plan?.keyDates || []).filter(
              (item) =>
                item.date === date &&
                !entries.some(
                  (entry) =>
                    entry.topic.toLowerCase() === item.title.toLowerCase(),
                ),
            );
            return (
              <article
                className={`${entries.length || keyDates.length ? "has-content" : ""} ${date === todayIso ? "is-today" : ""} ${(offset + index) % 7 > 4 ? "is-weekend" : ""}`.trim()}
                key={day}
              >
                <b>{day}</b>
                {entries.map((item) => (
                  <CalendarContentCard
                    item={item}
                    onSelect={onSelectContent}
                    key={item.id}
                  />
                ))}
                {keyDates.map((item, keyIndex) => (
                  <div
                    className="calendar-key-date"
                    key={`${item.date}-${item.title}-${keyIndex}`}
                    title={item.description}
                  >
                    <small>FECHA CLAVE</small>
                    {item.title}
                  </div>
                ))}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function WeekPresentation({ items, selectedDate, onSelectContent }) {
  const selected = new Date(`${selectedDate}T12:00:00`);
  const monday = new Date(selected);
  monday.setDate(selected.getDate() - ((selected.getDay() + 6) % 7));
  const dates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return date;
  });
  return (
    <section className="week-presentation">
      <header>
        <span>
          SEMANA DEL{" "}
          {monday
            .toLocaleDateString("es-EC", { day: "2-digit", month: "long" })
            .toUpperCase()}
        </span>
      </header>
      <div>
        {dates.map((date) => {
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
          const entries = items.filter((item) => item.date === key);
          return (
            <article key={key}>
              <header>
                <small>
                  {date.toLocaleDateString("es-EC", { weekday: "short" })}
                </small>
                <b>{date.getDate()}</b>
              </header>
              {entries.map((item) => item.isDraftSlot ? (
                <div className="calendar-pending-slot" key={item.id}>
                  <span>PENDIENTE</span>
                  <strong>Contenido por completar</strong>
                  <small>Esta fecha aún no ha sido llenada</small>
                </div>
              ) : (
                <button
                  type="button"
                  className={`${item.distributionType || "organic"} format-${item.format}`}
                  onClick={() => onSelectContent(item)}
                  key={item.id}
                >
                  <span>
                    {item.format}
                    {item.distributionType === "paid" ? " · pauta" : ""}
                  </span>
                  <b>{item.topic}</b>
                  <small>{item.time || "Sin hora"}</small>
                </button>
              ))}
              {!entries.length && <p>Sin contenido</p>}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function DayPresentation({ items, selectedDate, company }) {
  const entries = items.filter((item) => item.date === selectedDate);
  const completedEntries = entries.filter((item) => !item.isDraftSlot);
  const hasPendingSlot = entries.some((item) => item.isDraftSlot);
  const statusLabel = (item) =>
    item.approvalStatus === "approved"
      ? "APROBADO"
      : item.approvalStatus === "changes_requested"
        ? "CAMBIOS SOLICITADOS"
        : "PENDIENTE";
  if (!completedEntries.length)
    return (
      <section className={`daily-empty ${hasPendingSlot ? "has-pending-slot" : ""}`}>
        <CalendarDays />
        <h3>{hasPendingSlot ? "Contenido pendiente" : "Sin contenido para este día"}</h3>
        <p>
          {hasPendingSlot
            ? "Esta fecha forma parte de la estructura mensual, pero su contenido aún no ha sido llenado."
            : "Selecciona otra fecha para consultar su ficha de presentación."}
        </p>
      </section>
    );
  return (
    <div className="daily-presentations">
      {completedEntries.map((item, index) => (
        <section className="daily-sheet" key={item.id}>
          <header>
            <div>
              <b>CRONOGRAMA</b>
              <span>de contenido</span>
            </div>
            <i></i>
            <div>
              <b>
                {new Date(`${selectedDate}T12:00:00`)
                  .toLocaleDateString("es-EC", { month: "long" })
                  .toUpperCase()}
              </b>
              <span>Planificación de redes sociales</span>
            </div>
            <strong>{company}</strong>
          </header>
          <div className="daily-layout">
            <aside>
              <h3>PLATAFORMAS Y DATOS</h3>
              <b>{item.platforms.join(" • ") || "Sin plataformas"}</b>
              <dl>
                <div>
                  <dt>FECHA TENTATIVA</dt>
                  <dd>
                    {new Date(`${item.date}T12:00:00`).toLocaleDateString(
                      "es-EC",
                    )}
                  </dd>
                </div>
                <div>
                  <dt>FORMATO</dt>
                  <dd>
                    {item.format} ·{" "}
                    {item.distributionType === "paid" ? "PAUTA" : "ORGÁNICO"}
                  </dd>
                </div>
                <div>
                  <dt>ESTADO</dt>
                  <dd className={item.approvalStatus || "pending"}>
                    {statusLabel(item)}
                  </dd>
                </div>
                <div>
                  <dt>PRODUCCIÓN / REFERENCIA</dt>
                  <dd>
                    {item.productionReference || "Sin referencia agregada"}
                  </dd>
                </div>
              </dl>
            </aside>
            <div className="daily-main">
              <h2>{item.topic}</h2>
              <section>
                <small>OBJETIVO</small>
                <b>{item.objective || "Sin objetivo agregado"}</b>
              </section>
              <section>
                <small>TEXTO DE PUBLICACIÓN</small>
                <p>{item.copy || "Sin texto agregado"}</p>
              </section>
              <section className="visual-reference">
                <small>REFERENCIA VISUAL</small>
                <div>
                  {item.mediaUrl ? (
                    item.mediaType === "video" ? (
                      <video src={item.mediaUrl} controls />
                    ) : (
                      <img src={item.mediaUrl} alt={item.topic} />
                    )
                  ) : (
                    <b>
                      {item.productionReference || "IMAGEN / IDEA POR DEFINIR"}
                    </b>
                  )}
                </div>
              </section>
            </div>
          </div>
          <footer>
            <span>PLANIFICAMOS HOY PARA CONECTAR MAÑANA</span>
            <small>
              {selectedDate.slice(0, 7)} · {String(index + 1).padStart(2, "0")}
            </small>
          </footer>
        </section>
      ))}
    </div>
  );
}

function ContentPreviewModal({ item, company, manager, onClose, onReview }) {
  return (
    <div
      className="content-preview-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="content-preview-modal">
        <button
          className="content-preview-close"
          onClick={onClose}
          aria-label="Cerrar"
        >
          <X />
        </button>
        <DayPresentation
          items={[item]}
          selectedDate={item.date}
          company={company}
        />
        {!manager && (
          <footer className="content-preview-actions">
            <button onClick={() => onReview(item.id, "changes_requested")}>
              <Pencil /> Solicitar cambios
            </button>
            <button
              className="approve-publication"
              onClick={() => onReview(item.id, "approved")}
            >
              <Check /> Aprobar contenido
            </button>
          </footer>
        )}
      </div>
    </div>
  );
}

function CalendarModule({ manager, company }) {
  const [items, setItems] = useState([]);
  const [period, setPeriod] = useState(() =>
    new Date().toISOString().slice(0, 7),
  );
  const [plan, setPlan] = useState(null);
  const [planOpen, setPlanOpen] = useState(false);
  const [viewMode, setViewMode] = useState("month");
  const [selectedDate, setSelectedDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [selectedContent, setSelectedContent] = useState(null);
  const [editing, setEditing] = useState(null);
  const [clientPreview, setClientPreview] = useState(!manager);
  const [calendarError, setCalendarError] = useState("");
  const [loadingCalendar, setLoadingCalendar] = useState(true);
  const [savingContent, setSavingContent] = useState(false);
  const [reviewingContent, setReviewingContent] = useState(false);
  const preview = !manager || clientPreview;
  const periodItems = items.filter((item) => item.date?.startsWith(period));
  const presentationItems = periodItems.filter((item) => !item.isDraftSlot);
  const clientCalendarItems = preview ? periodItems : presentationItems;
  const totalContents = periodItems.length;
  const completedContents = presentationItems.length;
  const pendingContents = Math.max(totalContents - completedContents, 0);
  const monthProgress = totalContents
    ? Math.round((completedContents / totalContents) * 100)
    : 0;
  useEffect(() => {
    let active = true;
    const legacyKey = `focugex_calendar_${(company || "general").toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
    setLoadingCalendar(true);
    setCalendarError("");
    api("/api/calendar/publications", {
      headers: manager ? { "X-Focugex-Company": company } : {},
    })
      .then(async ({ publications }) => {
        let sharedItems = publications;
        if (manager && !publications.length) {
          try {
            const legacyItems =
              JSON.parse(localStorage.getItem(legacyKey)) || [];
            if (legacyItems.length) {
              sharedItems = await Promise.all(
                legacyItems.map((item) =>
                  api(`/api/calendar/publications/${item.id}`, {
                    method: "PUT",
                    headers: {
                      "Content-Type": "application/json",
                      "X-Focugex-Company": company,
                    },
                    body: JSON.stringify(item),
                  }).then((result) => result.publication),
                ),
              );
              localStorage.removeItem(legacyKey);
            }
          } catch {
            /* El calendario compartido sigue disponible aunque no se pueda migrar un borrador local. */
          }
        }
        if (active) setItems(sharedItems);
      })
      .catch((error) => active && setCalendarError(error.message))
      .finally(() => active && setLoadingCalendar(false));
    return () => {
      active = false;
    };
  }, [company, manager]);
  useEffect(() => {
    let active = true;
    api(`/api/calendar/plan?period=${period}`, {
      headers: manager ? { "X-Focugex-Company": company } : {},
    })
      .then((result) => active && setPlan(result.plan))
      .catch((error) => active && setCalendarError(error.message));
    return () => {
      active = false;
    };
  }, [company, manager, period]);
  useEffect(() => {
    if (
      periodItems.length &&
      !periodItems.some((item) => item.date === selectedDate)
    )
      setSelectedDate(periodItems[0].date);
  }, [items, period]);
  function openEditor(item = null) {
    setEditing(
      item
        ? { ...item }
        : {
            ...emptyPublication,
            date: `${period}-01`,
            id: crypto.randomUUID(),
          },
    );
  }
  function update(field, value) {
    setEditing((current) => ({ ...current, [field]: value }));
  }
  function togglePlatform(platform) {
    setEditing((current) => ({
      ...current,
      platforms: current.platforms.includes(platform)
        ? current.platforms.filter((item) => item !== platform)
        : [...current.platforms, platform],
    }));
  }
  function selectMedia(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024)
      return setCalendarError("El archivo no puede superar los 10 MB.");
    const reader = new FileReader();
    reader.onload = () =>
      setEditing((current) => ({
        ...current,
        mediaUrl: reader.result,
        mediaType: file.type.startsWith("video/") ? "video" : "image",
        mediaName: file.name,
      }));
    reader.readAsDataURL(file);
  }
  async function save(event) {
    event.preventDefault();
    if (savingContent) return;
    setSavingContent(true);
    setCalendarError("");
    try {
      const { publication } = await api(
        `/api/calendar/publications/${editing.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-Focugex-Company": company,
          },
          body: JSON.stringify(editing),
        },
      );
      setItems((current) =>
        (current.some((item) => item.id === publication.id)
          ? current.map((item) =>
              item.id === publication.id ? publication : item,
            )
          : [...current, publication]
        ).sort((a, b) =>
          `${a.date}${a.time || ""}`.localeCompare(`${b.date}${b.time || ""}`),
        ),
      );
      setEditing(null);
      showToast("Contenido guardado en el calendario.", "success");
    } catch (error) {
      setCalendarError(error.message);
    } finally {
      setSavingContent(false);
    }
  }
  async function remove(id) {
    const confirmed = await confirmAction({
      title: "Eliminar contenido",
      message:
        "Esta publicación desaparecerá del calendario y del próximo PDF.",
      confirmLabel: "Eliminar",
      danger: true,
    });
    if (!confirmed) return;
    setCalendarError("");
    try {
      await api(`/api/calendar/publications/${id}`, {
        method: "DELETE",
        headers: { "X-Focugex-Company": company },
      });
      setItems((current) => current.filter((item) => item.id !== id));
      showToast("Contenido eliminado.", "success");
    } catch (error) {
      setCalendarError(error.message);
    }
  }
  async function review(id, status) {
    if (reviewingContent) return;
    const comment =
      status === "changes_requested"
        ? await requestText({
            title: "Solicitar cambios",
            message: "Explica con claridad qué debe ajustar el gestor.",
            label: "Comentario para el gestor",
            placeholder: "Ej. Ajustar el texto y reemplazar la imagen…",
            confirmLabel: "Enviar solicitud",
          })
        : "";
    if (status === "changes_requested" && !comment?.trim()) return;
    setReviewingContent(true);
    setCalendarError("");
    try {
      const { review: result } = await api(
        `/api/calendar/publications/${id}/review`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status, comment }),
        },
      );
      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, ...result } : item)),
      );
      setSelectedContent((current) =>
        current?.id === id ? { ...current, ...result } : current,
      );
      showToast(
        status === "approved"
          ? "Contenido aprobado."
          : "Cambios enviados al gestor.",
        "success",
      );
    } catch (error) {
      setCalendarError(error.message);
    } finally {
      setReviewingContent(false);
    }
  }
  return (
    <section className="calendar-module">
      <header className="calendar-toolbar">
        <div>
          <span className="eyebrow">PLANIFICACIÓN DE CONTENIDO</span>
          <h2>Calendario editorial</h2>
          <p>
            {preview
              ? "Así verá el cliente las publicaciones planificadas."
              : "Crea y organiza cada publicación antes de enviarla al cliente."}
          </p>
        </div>
        <div>
          <input
            className="period-picker"
            type="month"
            value={period}
            onChange={(e) => {
              setPeriod(e.target.value);
              setSelectedDate(`${e.target.value}-01`);
            }}
          />
          {preview && viewMode !== "month" && (
            <input
              className="period-picker"
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setPeriod(e.target.value.slice(0, 7));
              }}
            />
          )}
          {manager && !preview && (
            <button onClick={() => setPlanOpen(true)}>
              <Pencil /> Estrategia mensual
            </button>
          )}
          {manager && (
            <button
              className={`preview-toggle ${clientPreview ? "active" : ""}`}
              onClick={() => setClientPreview(!clientPreview)}
            >
              <Eye />
              {clientPreview ? "Volver al editor" : "Vista del cliente"}
            </button>
          )}
          {manager && !preview && (
            <button className="primary-action" onClick={() => openEditor()}>
              <Plus /> Nueva publicación
            </button>
          )}
        </div>
      </header>
      <section className="calendar-progress" aria-label="Progreso del contenido mensual">
        <div className="calendar-progress-heading">
          <div>
            <span>PROGRESO DEL MES</span>
            <strong>{monthProgress}% completado</strong>
          </div>
          <p>
            <b>{completedContents}</b> de <b>{totalContents}</b> contenidos listos
          </p>
        </div>
        <div
          className="calendar-progress-track"
          role="progressbar"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={monthProgress}
          aria-label={`${monthProgress}% del contenido mensual completado`}
        >
          <span style={{ width: `${monthProgress}%` }} />
        </div>
        <div className="calendar-progress-stats">
          <span><i className="completed" />{completedContents} contenidos creados</span>
          <span><i className="pending" />{pendingContents} contenidos por completar</span>
          <small>{totalContents ? `${monthProgress}% de la estructura mensual` : "Aún no hay una estructura para este mes"}</small>
        </div>
      </section>
      {preview && (
        <nav className="calendar-view-switch" aria-label="Vista del calendario">
          {[
            ["month", "Mes"],
            ["week", "Semana"],
            ["day", "Día"],
          ].map(([value, label]) => (
            <button
              className={viewMode === value ? "active" : ""}
              onClick={() => setViewMode(value)}
              key={value}
            >
              {label}
            </button>
          ))}
        </nav>
      )}
      {preview && viewMode === "month" && (
        <CalendarPresentation
          plan={plan}
          items={clientCalendarItems}
          period={period}
          company={company}
          onSelectContent={(item) => setSelectedContent(item)}
        />
      )}
      {preview && viewMode === "week" && (
        <WeekPresentation
          items={clientCalendarItems}
          selectedDate={selectedDate}
          onSelectContent={(item) => setSelectedContent(item)}
        />
      )}
      {preview && viewMode === "day" && (
        <DayPresentation
          items={clientCalendarItems}
          selectedDate={selectedDate}
          company={company}
        />
      )}
      {calendarError && (
        <div className="calendar-error">
          <AlertTriangle />
          {calendarError}
        </div>
      )}
      {!preview &&
        (loadingCalendar ? (
          <div className="calendar-loading">
            <RefreshCw /> Cargando calendario…
          </div>
        ) : periodItems.length ? (
          <div className="publication-grid">
            {periodItems.map((item) => (
              <article
                className={`publication-card format-${item.format}`}
                key={item.id}
              >
                <div
                  className={`publication-media ${item.mediaType || "empty"}`}
                >
                  {item.mediaUrl && item.mediaType === "image" ? (
                    <img src={item.mediaUrl} alt={item.topic} />
                  ) : item.mediaUrl && item.mediaType === "video" ? (
                    <video src={item.mediaUrl} controls />
                  ) : item.mediaType === "video" ? (
                    <Video />
                  ) : (
                    <Image />
                  )}
                  <span>{item.format}</span>
                </div>
                <div className="publication-body">
                  <div className="publication-date">
                    <CalendarDays />
                    {item.date
                      ? new Date(`${item.date}T12:00:00`).toLocaleDateString(
                          "es-EC",
                          { day: "2-digit", month: "short", year: "numeric" },
                        )
                      : "Sin fecha"}
                    {item.time && ` · ${item.time}`}
                  </div>
                  <h3>{item.topic}</h3>
                  {item.objective && (
                    <div className="content-detail">
                      <small>OBJETIVO</small>
                      <span>{item.objective}</span>
                    </div>
                  )}
                  <div className="content-detail">
                    <small>TIPO</small>
                    <span>
                      {item.format} ·{" "}
                      {item.distributionType === "paid" ? "Pauta" : "Orgánico"}
                    </span>
                  </div>
                  <p>{item.copy || "Sin copy agregado."}</p>
                  {item.productionReference && (
                    <div className="content-detail">
                      <small>PRODUCCIÓN / REFERENCIA</small>
                      <span>{item.productionReference}</span>
                    </div>
                  )}
                  <div className="platform-tags">
                    {item.platforms.map((platform) => (
                      <span key={platform}>{platform}</span>
                    ))}
                  </div>
                  {item.mediaName && !item.mediaUrl && (
                    <small className="media-reference">
                      <FileImage />
                      {item.mediaName}
                    </small>
                  )}
                  <div
                    className={`approval-state ${item.approvalStatus || "pending"}`}
                  >
                    {item.approvalStatus === "approved"
                      ? "Aprobado por el cliente"
                      : item.approvalStatus === "changes_requested"
                        ? "Cambios solicitados"
                        : "Pendiente de aprobación"}
                  </div>
                  {item.clientComment && (
                    <blockquote className="client-comment">
                      {item.clientComment}
                    </blockquote>
                  )}
                </div>
                {manager && !preview && (
                  <footer>
                    <button onClick={() => openEditor(item)}>
                      <Pencil /> Editar
                    </button>
                    <button
                      className="delete-publication"
                      onClick={() => remove(item.id)}
                      aria-label="Eliminar publicación"
                    >
                      <Trash2 />
                    </button>
                  </footer>
                )}
                {!manager && (
                  <footer className="client-review-actions">
                    <button
                      onClick={() => review(item.id, "changes_requested")}
                    >
                      <Pencil /> Solicitar cambios
                    </button>
                    <button
                      className="approve-publication"
                      onClick={() => review(item.id, "approved")}
                    >
                      <Check /> Aprobar
                    </button>
                  </footer>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="calendar-empty">
            <CalendarDays />
            <h3>No hay publicaciones planificadas</h3>
            <p>
              Crea el primer cuadro del calendario con su fecha, copy y
              material.
            </p>
            <button className="primary-action" onClick={() => openEditor()}>
              <Plus /> Crear primera publicación
            </button>
          </div>
        ))}
      {editing && (
        <div
          className="publication-modal-backdrop"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setEditing(null)
          }
        >
          <section
            className="publication-modal"
            role="dialog"
            aria-modal="true"
          >
            <header>
              <div>
                <span className="eyebrow">EDITOR DE CRONOGRAMA</span>
                <h2>
                  {items.some((item) => item.id === editing.id)
                    ? "Editar contenido"
                    : "Nuevo contenido"}
                </h2>
              </div>
              <button onClick={() => setEditing(null)} aria-label="Cerrar">
                <X />
              </button>
            </header>
            <form onSubmit={save}>
              <div className="publication-form-grid">
                <label>
                  Fecha tentativa
                  <input
                    type="date"
                    value={editing.date}
                    onChange={(e) => update("date", e.target.value)}
                    required
                  />
                </label>
                <label>
                  Hora
                  <input
                    type="time"
                    value={editing.time}
                    onChange={(e) => update("time", e.target.value)}
                  />
                </label>
                <label className="wide">
                  Tema o título
                  <input
                    value={editing.topic}
                    onChange={(e) => update("topic", e.target.value)}
                    placeholder="Ej. Plato del mes"
                    required
                  />
                </label>
                <label className="wide">
                  Objetivo
                  <input
                    value={editing.objective || ""}
                    onChange={(e) => update("objective", e.target.value)}
                    placeholder="Ej. Visitas, conversión o reconocimiento"
                  />
                </label>
                <label className="wide">
                  Texto de publicación
                  <textarea
                    value={editing.copy}
                    onChange={(e) => update("copy", e.target.value)}
                    placeholder="Escribe el copy completo…"
                    rows="5"
                  />
                </label>
                <label className="wide">
                  Producción o referencia
                  <textarea
                    value={editing.productionReference || ""}
                    onChange={(e) =>
                      update("productionReference", e.target.value)
                    }
                    placeholder="Describe la fotografía, escena, diseño o material necesario"
                    rows="3"
                  />
                </label>
              </div>
              <fieldset>
                <legend>Tipo de publicación</legend>
                <div className="format-options">
                  {["post", "reel", "historia"].map((format) => (
                    <button
                      type="button"
                      className={editing.format === format ? "selected" : ""}
                      key={format}
                      onClick={() => update("format", format)}
                    >
                      {format === "reel" ? (
                        <Video />
                      ) : format === "historia" ? (
                        <Smartphone />
                      ) : (
                        <FileImage />
                      )}
                      {format}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend>Distribución</legend>
                <div className="format-options">
                  {[
                    ["organic", "Orgánico"],
                    ["paid", "Pauta"],
                  ].map(([value, label]) => (
                    <button
                      type="button"
                      className={
                        (editing.distributionType || "organic") === value
                          ? "selected"
                          : ""
                      }
                      key={value}
                      onClick={() => update("distributionType", value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend>
                  Plataformas <small>Puedes elegir varias</small>
                </legend>
                <div className="platform-options">
                  {platformOptions.map((platform) => (
                    <label key={platform}>
                      <input
                        type="checkbox"
                        checked={editing.platforms.includes(platform)}
                        onChange={() => togglePlatform(platform)}
                      />
                      <span>
                        <Check />
                      </span>
                      {platform}
                    </label>
                  ))}
                </div>
              </fieldset>
              <label className="media-upload">
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={selectMedia}
                />
                <Upload />
                <span>
                  <b>Agregar imagen o video</b>
                  <small>
                    {editing.mediaName || "JPG, PNG, WEBP, MP4 o MOV"}
                  </small>
                </span>
              </label>
              {editing.mediaUrl && (
                <div className="media-preview">
                  {editing.mediaType === "video" ? (
                    <video src={editing.mediaUrl} controls />
                  ) : (
                    <img src={editing.mediaUrl} alt="Vista previa" />
                  )}
                </div>
              )}
              <footer>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  disabled={savingContent}
                >
                  Cancelar
                </button>
                <button
                  className="save-publication"
                  disabled={savingContent}
                  aria-busy={savingContent}
                >
                  <Save /> {savingContent ? "Guardando…" : "Guardar contenido"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
      {planOpen && (
        <PlanModal
          initial={plan}
          period={period}
          company={company}
          onClose={() => setPlanOpen(false)}
          onSaved={(saved) => {
            setPlan(saved);
            setPlanOpen(false);
          }}
        />
      )}
      {selectedContent && (
        <ContentPreviewModal
          item={selectedContent}
          company={company}
          manager={manager}
          onClose={() => setSelectedContent(null)}
          onReview={review}
        />
      )}
    </section>
  );
}

function CompaniesModule({
  companies,
  clients,
  owner,
  onClientCreated,
  onCompanyCreated,
  onCompanyUpdated,
  onCompanyDeleted,
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    companyName: companies[0]?.name || "",
    password: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }
  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const result = await api("/api/manager/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      onClientCreated(result);
      setOpen(false);
      setForm({
        name: "",
        username: "",
        email: "",
        companyName: result.company.name,
        password: "",
      });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }
  async function createCompany() {
    const companyData = await requestCompanyName();
    if (!companyData) return;
    try {
      const result = await api("/api/manager/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(companyData),
      });
      onCompanyCreated(result.company);
    } catch (requestError) {
      showAppNotice(requestError.message);
    }
  }
  async function editCompany(company) {
    const companyData = await requestCompanyName(company);
    if (!companyData) return;
    try {
      const result = await api(`/api/manager/companies/${company.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(companyData),
      });
      onCompanyUpdated(company.name, result.company);
    } catch (requestError) {
      showAppNotice(requestError.message);
    }
  }
  async function deleteCompany(company) {
    const confirmed = await confirmAction({
      title: `Eliminar ${company.name}`,
      message:
        "Se eliminarán la empresa, sus usuarios cliente, publicaciones, estrategia y accesos relacionados. Esta acción no se puede deshacer.",
      confirmLabel: "Eliminar empresa",
      danger: true,
    });
    if (!confirmed) return;
    try {
      await api(`/api/manager/companies/${company.id}`, { method: "DELETE" });
      onCompanyDeleted(company);
      showToast("Empresa eliminada correctamente.", "success");
    } catch (requestError) {
      showToast(requestError.message, "error");
    }
  }
  function addClient(companyName) {
    setForm({ name: "", username: "", email: "", companyName, password: "" });
    setOpen(true);
  }
  return (
    <section className="manager-clients">
      <header>
        <div>
          <span className="eyebrow">CARTERA DE LA AGENCIA</span>
          <h2>Empresas</h2>
          <p>
            Crea las empresas cuyo marketing administra tu agencia y sus accesos
            de cliente.
          </p>
        </div>
        {owner && (
          <button onClick={createCompany}>
            <Plus /> Nueva empresa
          </button>
        )}
      </header>
      <div className="company-management-grid">
        {companies.map((company) => (
          <article key={company.id}>
            <header>
              {company.logoData ? (
                <img
                  className="company-card-logo"
                  src={company.logoData}
                  alt={`Logo de ${company.name}`}
                />
              ) : (
                <Building2 />
              )}
              <div>
                <b>{company.name}</b>
                <span>
                  {
                    clients.filter(
                      (client) =>
                        client.company_name.toLowerCase() ===
                        company.name.toLowerCase(),
                    ).length
                  }{" "}
                  usuario(s) cliente
                </span>
              </div>
              <div className="company-card-actions">
                {owner && (
                  <>
                    <button onClick={() => editCompany(company)}>
                      <Pencil /> Editar
                    </button>
                    <button
                      className="delete-company"
                      onClick={() => deleteCompany(company)}
                    >
                      <Trash2 /> Eliminar
                    </button>
                  </>
                )}
                <button
                  className="add-company-user"
                  onClick={() => addClient(company.name)}
                >
                  <UserPlus /> Agregar usuario
                </button>
              </div>
            </header>
            <div className="company-users">
              {clients
                .filter(
                  (client) =>
                    client.company_name.toLowerCase() ===
                    company.name.toLowerCase(),
                )
                .map((client) => (
                  <div key={client.id}>
                    <i>
                      {client.name
                        .split(" ")
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join("")}
                    </i>
                    <span>
                      <b>{client.name}</b>
                      <small>{client.email}</small>
                    </span>
                    <em className={client.active ? "active" : ""}>
                      {client.active ? "Activo" : "Suspendido"}
                    </em>
                  </div>
                ))}
              {!clients.some(
                (client) =>
                  client.company_name.toLowerCase() ===
                  company.name.toLowerCase(),
              ) && <p>Esta empresa todavía no tiene usuarios cliente.</p>}
            </div>
          </article>
        ))}
      </div>
      {!companies.length && (
        <div className="calendar-empty">
          <Building2 />
          <h3>No hay empresas administradas</h3>
          <p>El propietario de la agencia debe crear la primera empresa.</p>
        </div>
      )}
      {open && (
        <div
          className="publication-modal-backdrop"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setOpen(false)
          }
        >
          <section className="publication-modal client-create-modal">
            <header>
              <div>
                <span className="eyebrow">USUARIO DE EMPRESA</span>
                <h2>Crear acceso de cliente</h2>
              </div>
              <button onClick={() => setOpen(false)}>
                <X />
              </button>
            </header>
            <form onSubmit={submit}>
              <div className="publication-form-grid">
                <label>
                  Nombre completo
                  <input
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    required
                  />
                </label>
                <label>
                  Nombre de usuario
                  <input
                    value={form.username}
                    onChange={(e) =>
                      update(
                        "username",
                        e.target.value.toLowerCase().replace(/\s/g, ""),
                      )
                    }
                    required
                  />
                </label>
                <label>
                  Correo electrónico
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    required
                  />
                </label>
                <label>
                  Contraseña
                  <input
                    type="password"
                    minLength="10"
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                    placeholder="10 caracteres, mayúscula y número"
                    required
                  />
                </label>
                <label className="wide">
                  Empresa
                  <input value={form.companyName} readOnly />
                </label>
              </div>
              {error && (
                <div className="calendar-error">
                  <AlertTriangle />
                  {error}
                </div>
              )}
              <footer>
                <button type="button" onClick={() => setOpen(false)}>
                  Cancelar
                </button>
                <button
                  className="save-publication"
                  disabled={saving}
                  aria-busy={saving}
                >
                  <UserPlus />
                  {saving ? "Creando…" : "Crear usuario cliente"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}

function CollaboratorsModule({ collaborators, owner, onCreated }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }
  async function submit(event) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const result = await api("/api/manager/collaborators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      onCreated(result.collaborator);
      setOpen(false);
      setForm({ name: "", username: "", email: "", password: "" });
      showToast("Colaborador creado correctamente.", "success");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="manager-clients">
      <header>
        <div>
          <span className="eyebrow">EQUIPO INTERNO</span>
          <h2>Colaboradores</h2>
          <p>
            Miembros de tu agencia que pueden trabajar en las empresas y
            calendarios asignados.
          </p>
        </div>
        {owner && (
          <button onClick={() => setOpen(true)}>
            <UserPlus /> Nuevo colaborador
          </button>
        )}
      </header>
      <div className="manager-client-grid">
        {collaborators.map((item) => (
          <article key={item.id}>
            <i>
              {item.name
                .split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("")}
            </i>
            <div>
              <b>{item.name}</b>
              <span>{item.email}</span>
              <small>@{item.username}</small>
            </div>
            <em className={item.active ? "active" : ""}>
              {item.active ? "Activo" : "Suspendido"}
            </em>
          </article>
        ))}
      </div>
      {!collaborators.length && (
        <div className="calendar-empty">
          <Users />
          <h3>Sin colaboradores</h3>
          <p>El propietario de la agencia puede crear miembros internos.</p>
        </div>
      )}
      {open && (
        <div className="publication-modal-backdrop">
          <section className="publication-modal">
            <header>
              <h2>Nuevo colaborador</h2>
              <button
                onClick={() => !saving && setOpen(false)}
                aria-label="Cerrar"
              >
                <X />
              </button>
            </header>
            <form onSubmit={submit}>
              <div className="publication-form-grid">
                <label>
                  Nombre
                  <input
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                    required
                  />
                </label>
                <label>
                  Usuario
                  <input
                    value={form.username}
                    onChange={(e) => update("username", e.target.value)}
                    required
                  />
                </label>
                <label>
                  Correo
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    required
                  />
                </label>
                <label>
                  Contraseña
                  <input
                    type="password"
                    minLength="10"
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                    required
                  />
                </label>
              </div>
              {error && <div className="calendar-error">{error}</div>}
              <footer>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  className="save-publication"
                  disabled={saving}
                  aria-busy={saving}
                >
                  {saving ? "Creando…" : "Crear colaborador"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}

function MonthStructureModule({ company }) {
  const [period, setPeriod] = useState(() =>
    new Date().toISOString().slice(0, 7),
  );
  const [form, setForm] = useState({
    strategySummary: "",
    postsPerWeek: 0,
    postsDetail: "",
    videosPerMonth: 0,
    videosDetail: "",
    videoSchedule: "",
    videoBoostDetail: "",
    mainLinesCount: 0,
    mainLines: "",
    keyDates: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    setLoading(true);
    setMessage("");
    api(`/api/calendar/plan?period=${period}`, {
      headers: { "X-Focugex-Company": company },
    })
      .then(
        ({ plan }) =>
          active &&
          setForm({
            strategySummary: "",
            postsPerWeek: 0,
            postsDetail: "",
            videosPerMonth: 0,
            videosDetail: "",
            videoSchedule: "",
            videoBoostDetail: "",
            mainLinesCount: 0,
            mainLines: "",
            keyDates: [],
            ...(plan || {}),
          }),
      )
      .catch((error) => active && setMessage(error.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [company, period]);
  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }
  function updateKeyDate(index, field, value) {
    setForm((current) => ({
      ...current,
      keyDates: current.keyDates.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    }));
  }
  function addKeyDate() {
    setForm((current) => ({
      ...current,
      keyDates: [
        ...current.keyDates,
        { date: `${period}-01`, title: "", description: "" },
      ],
    }));
  }
  function removeKeyDate(index) {
    setForm((current) => ({
      ...current,
      keyDates: current.keyDates.filter((_, itemIndex) => itemIndex !== index),
    }));
  }
  const totalPosts = Number(form.postsPerWeek || 0);
  const paidPosts = Math.min(
    totalPosts,
    Number(String(form.postsDetail || "").match(/(\d+)\s*(?:para\s*)?pauta/i)?.[1] || 0),
  );
  function distributionLabel(total, paid) {
    const organic = Math.max(total - paid, 0);
    return `${organic} ${organic === 1 ? "orgánico" : "orgánicos"} + ${paid} para pauta`;
  }
  function updatePostTotal(value) {
    const total = Number(value);
    const adjustedPaid = Math.min(paidPosts, total);
    setForm((current) => ({
      ...current,
      postsPerWeek: total,
      postsDetail: distributionLabel(total, adjustedPaid),
    }));
  }
  function updatePaidPosts(value) {
    const paid = Math.min(Number(value), totalPosts);
    update("postsDetail", distributionLabel(totalPosts, paid));
  }
  const totalVideos = Number(form.videosPerMonth || 0);
  const reelVideos = Math.min(
    totalVideos,
    Number(String(form.videosDetail || "").match(/(\d+)\s*reels?/i)?.[1] || 0),
  );
  const videoMixLabel = (total, reels) =>
    `${reels} ${reels === 1 ? "reel" : "reels"} + ${Math.max(total - reels, 0)} TikTok${total - reels === 1 ? "" : "s"}`;
  function updateVideoTotal(value) {
    const total = Number(value);
    const adjustedReels = Math.min(reelVideos, total);
    setForm((current) => ({
      ...current,
      videosPerMonth: total,
      videosDetail: videoMixLabel(total, adjustedReels),
      videoSchedule: (String(current.videoSchedule || "").match(/\d+/g) || [])
        .map(Number)
        .slice(0, total)
        .sort((a, b) => a - b)
        .join(", "),
    }));
  }
  const selectedVideoDays = [...new Set((String(form.videoSchedule || "").match(/\d+/g) || []).map(Number))]
    .filter((day) => day >= 1 && day <= new Date(Number(period.slice(0, 4)), Number(period.slice(5, 7)), 0).getDate());
  const daysInPeriod = new Date(Number(period.slice(0, 4)), Number(period.slice(5, 7)), 0).getDate();
  function toggleVideoDay(day) {
    const selected = selectedVideoDays.includes(day)
      ? selectedVideoDays.filter((item) => item !== day)
      : selectedVideoDays.length < totalVideos
        ? [...selectedVideoDays, day]
        : selectedVideoDays;
    update("videoSchedule", selected.sort((a, b) => a - b).join(", "));
  }
  const boostFrequency = Math.min(
    30,
    Math.max(1, Number(String(form.videoBoostDetail || "").match(/\d+/)?.[0] || 10)),
  );
  const structureChecks = [
    Boolean(form.strategySummary?.trim()),
    totalPosts > 0,
    Boolean(form.postsDetail?.trim()),
    totalVideos > 0,
    Boolean(form.videosDetail?.trim()),
    selectedVideoDays.length > 0,
    Boolean(form.videoBoostDetail?.trim()),
    Number(form.mainLinesCount || 0) > 0,
    Boolean(form.mainLines?.trim()),
    form.keyDates.length > 0,
  ];
  const structureProgress = Math.round(
    (structureChecks.filter(Boolean).length / structureChecks.length) * 100,
  );
  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const { plan } = await api("/api/calendar/plan", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Focugex-Company": company,
        },
        body: JSON.stringify({ ...form, period }),
      });
      const generated = await api("/api/calendar/generate-slots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Focugex-Company": company,
        },
        body: JSON.stringify({ period }),
      });
      setForm((current) => ({ ...current, ...plan }));
      setMessage(
        generated.count
          ? `Estructura guardada. Se agregaron ${generated.count} fechas nuevas al calendario.`
          : "Estructura guardada. No hay fechas nuevas para agregar al calendario.",
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="structure-module">
      <header>
        <div>
          <span className="eyebrow">PLANIFICACIÓN GUIADA</span>
          <h2>Estructura del mes</h2>
          <p>
            Responde las preguntas para construir el PDF y crear borradores
            editables en el calendario.
          </p>
        </div>
        <input
          className="period-picker"
          type="month"
          value={period}
          onChange={(event) => setPeriod(event.target.value)}
        />
      </header>
      {loading ? (
        <div className="calendar-loading">
          <RefreshCw /> Cargando estructura…
        </div>
      ) : (
        <form onSubmit={save}>
          <div className="structure-form-progress">
            <div>
              <span>AVANCE DE LA ESTRUCTURA</span>
              <strong>{structureProgress}% completado</strong>
            </div>
            <div className="structure-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={structureProgress}>
              <i style={{ width: `${structureProgress}%` }}></i>
            </div>
            <small>{structureChecks.filter(Boolean).length} de {structureChecks.length} apartados configurados</small>
          </div>
          <label className="structure-wide">
            <span>1. ¿Cómo resumirías la planificación de este mes?</span>
            <textarea
              rows="3"
              value={form.strategySummary || ""}
              onChange={(event) =>
                update("strategySummary", event.target.value)
              }
            />
          </label>
          <label>
            <span>2. ¿Cuántos espacios para posts habrá por semana?</span>
            <div className="range-control">
              <output>{totalPosts}</output>
              <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={totalPosts}
                onChange={(event) => updatePostTotal(event.target.value)}
                aria-label="Posts por semana"
              />
              <small><span>0</span><span>30 posts</span></small>
            </div>
          </label>
          <label>
            <span>3. ¿Cómo se distribuyen esos posts?</span>
            <div className="range-control distribution-range">
              <output>{distributionLabel(totalPosts, paidPosts)}</output>
              <input
                type="range"
                min="0"
                max={totalPosts}
                step="1"
                value={paidPosts}
                disabled={!totalPosts}
                onChange={(event) => updatePaidPosts(event.target.value)}
                aria-label="Cantidad de posts para pauta"
              />
              <small><span>Todos orgánicos</span><span>Máximo {totalPosts} para pauta</span></small>
            </div>
          </label>
          <label>
            <span>4. ¿Cuántos videos tendrá el mes?</span>
            <div className="range-control">
              <output>{totalVideos}</output>
              <input type="range" min="0" max="30" step="1" value={totalVideos} onChange={(event) => updateVideoTotal(event.target.value)} aria-label="Videos del mes" />
              <small><span>0</span><span>30 videos</span></small>
            </div>
          </label>
          <label>
            <span>5. ¿Qué tipos de videos se producirán?</span>
            <div className="range-control distribution-range">
              <output>{videoMixLabel(totalVideos, reelVideos)}</output>
              <input type="range" min="0" max={totalVideos} step="1" value={reelVideos} disabled={!totalVideos} onChange={(event) => update("videosDetail", videoMixLabel(totalVideos, Number(event.target.value)))} aria-label="Distribución de videos" />
              <small><span>Todos TikToks</span><span>Máximo {totalVideos} reels</span></small>
            </div>
          </label>
          <label>
            <span>6. ¿En qué fechas se pautarán los videos?</span>
            <div className="day-selector">
              <output>{selectedVideoDays.length} de {totalVideos} fechas seleccionadas</output>
              <div>{Array.from({ length: daysInPeriod }, (_, index) => index + 1).map((day) => (
                <button type="button" className={selectedVideoDays.includes(day) ? "selected" : ""} disabled={!selectedVideoDays.includes(day) && selectedVideoDays.length >= totalVideos} onClick={() => toggleVideoDay(day)} key={day}>{day}</button>
              ))}</div>
            </div>
          </label>
          <label>
            <span>7. ¿Cuál será la frecuencia o intención de la pauta?</span>
            <div className="range-control distribution-range">
              <output>Cada {boostFrequency} días</output>
              <input type="range" min="1" max="30" step="1" value={boostFrequency} onChange={(event) => update("videoBoostDetail", `Un impulso cada ${event.target.value} días`)} aria-label="Frecuencia de la pauta" />
              <small><span>Diaria</span><span>Cada 30 días</span></small>
            </div>
          </label>
          <label>
            <span>8. ¿Cuántas líneas principales habrá?</span>
            <div className="range-control">
              <output>{form.mainLinesCount || 0}</output>
              <input type="range" min="0" max="20" step="1" value={form.mainLinesCount || 0} onChange={(event) => update("mainLinesCount", Number(event.target.value))} aria-label="Líneas principales" />
              <small><span>0</span><span>20 líneas</span></small>
            </div>
          </label>
          <label>
            <span>9. ¿Cuáles son esas líneas de contenido?</span>
            <textarea
              rows="4"
              value={form.mainLines || ""}
              onChange={(event) => update("mainLines", event.target.value)}
              placeholder="Escribe una línea de contenido por renglón"
            />
            <small className="field-help">Sugerencia: usa un renglón para cada una de las {form.mainLinesCount || 0} líneas.</small>
          </label>
          <fieldset className="key-dates">
            <legend>10. Fechas específicas del mes</legend>
            <p>
              Agrega celebraciones, campañas o contenidos que deben publicarse
              en un día exacto.
            </p>
            {!!form.keyDates.length && (
              <div className="key-date-head" aria-hidden="true">
                <span>Fecha</span>
                <span>Nombre del contenido</span>
                <span>Descripción o intención</span>
                <span></span>
              </div>
            )}
            {form.keyDates.map((item, index) => (
              <div key={`${item.date}-${index}`}>
                <input
                  type="date"
                  min={`${period}-01`}
                  max={`${period}-31`}
                  value={item.date}
                  onChange={(event) =>
                    updateKeyDate(index, "date", event.target.value)
                  }
                  required
                />
                <input
                  value={item.title}
                  onChange={(event) =>
                    updateKeyDate(index, "title", event.target.value)
                  }
                  placeholder="Ej. Día de la Bandera"
                  required
                />
                <input
                  value={item.description}
                  onChange={(event) =>
                    updateKeyDate(index, "description", event.target.value)
                  }
                  placeholder="Descripción o intención del contenido"
                />
                <button
                  type="button"
                  onClick={() => removeKeyDate(index)}
                  aria-label="Eliminar fecha"
                >
                  <Trash2 />
                </button>
              </div>
            ))}
            <button type="button" className="add-key-date" onClick={addKeyDate}>
              <Plus /> Agregar fecha específica
            </button>
          </fieldset>
          <footer>
            <span
              className={
                message.startsWith("Estructura guardada") ? "success" : ""
              }
            >
              {message}
            </span>
            <button
              className="save-publication"
              disabled={saving}
              aria-busy={saving}
            >
              <Save />
              {saving ? "Guardando…" : "Guardar estrategia y fechas"}
            </button>
          </footer>
        </form>
      )}
    </section>
  );
}

function CalendarPdfModule({ company }) {
  const [period, setPeriod] = useState(() =>
    new Date().toISOString().slice(0, 7),
  );
  const [pdfUrl, setPdfUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const urlRef = useRef("");
  useEffect(
    () => () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    [],
  );
  useEffect(() => {
    setPdfUrl("");
    setFileName("");
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = "";
    }
  }, [company]);
  async function generatePreview() {
    if (!company) return setError("Selecciona primero una empresa activa.");
    setGenerating(true);
    setError("");
    try {
      const headers = { "X-Focugex-Company": company };
      const [publicationResult, planResult, companyResult] = await Promise.all([
        api("/api/calendar/publications", { headers }),
        api(`/api/calendar/plan?period=${period}`, { headers }),
        api("/api/company/current", { headers }),
      ]);
      const calendarItems = publicationResult.publications.filter((item) =>
        item.date?.startsWith(period),
      );
      const keyDateDays = new Set(
        (planResult.plan?.keyDates || []).map((item) => item.date),
      );
      const publications = calendarItems.filter(
        (item) => !item.isDraftSlot || keyDateDays.has(item.date),
      );
      if (!publications.length && !planResult.plan)
        throw new Error(
          "Primero agrega la estructura del mes o una publicación para generar el PDF.",
        );
      const document = await createCalendarPdf({
        company,
        logoData: companyResult.company.logoData,
        period,
        plan: planResult.plan,
        publications,
        calendarItems: publications,
      });
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = URL.createObjectURL(document.output("blob"));
      setPdfUrl(urlRef.current);
      setFileName(
        `Cronograma_${company}_${period}.pdf`.replace(/[^a-zA-Z0-9._-]+/g, "_"),
      );
    } catch (requestError) {
      setError(requestError.message);
      setPdfUrl("");
      setFileName("");
    } finally {
      setGenerating(false);
    }
  }
  return (
    <section className="pdf-module">
      <header>
        <div>
          <span className="eyebrow">DOCUMENTO PARA ENTREGA</span>
          <h2>Crear PDF cronograma</h2>
          <p>
            Genera el documento con las publicaciones reales de la empresa y
            revisa el resultado antes de descargarlo.
          </p>
        </div>
      </header>
      <div className="pdf-controls">
        <label>
          <span>Mes del cronograma</span>
          <input
            className="period-picker"
            type="month"
            value={period}
            onChange={(event) => {
              setPeriod(event.target.value);
              setPdfUrl("");
              setFileName("");
            }}
          />
        </label>
        <button
          className="pdf-generate"
          onClick={generatePreview}
          disabled={generating || !company}
        >
          {generating ? <RefreshCw className="spin" /> : <Eye />}
          {generating ? "Generando…" : "Generar vista previa"}
        </button>
        {pdfUrl && (
          <a className="pdf-download" href={pdfUrl} download={fileName}>
            <Download /> Descargar PDF
          </a>
        )}
      </div>
      {error && (
        <div className="calendar-error">
          <AlertTriangle />
          {error}
        </div>
      )}
      {pdfUrl ? (
        <div className="pdf-preview">
          <header>
            <span>
              <FileDown />
              Vista previa del documento
            </span>
            <small>{fileName}</small>
          </header>
          <iframe
            src={pdfUrl}
            title={`Vista previa del cronograma de ${company}`}
          />
        </div>
      ) : (
        <div className="pdf-empty">
          <FileDown />
          <h3>Prepara el cronograma para descargar</h3>
          <p>
            Selecciona el mes y genera la vista previa. La descarga estará
            disponible después de revisarla.
          </p>
        </div>
      )}
    </section>
  );
}

function RolePortal({ user }) {
  const [section, setSection] = useState("overview");
  const manager = ["manager", "collaborator"].includes(user.role);
  const owner = user.role === "manager";
  const [companies, setCompanies] = useState([]);
  const [clients, setClients] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [activeCompany, setActiveCompany] = useState(user.company_name || "");
  const firstName = user.name.split(" ")[0];
  useEffect(() => {
    if (!manager) return;
    Promise.all([
      api("/api/manager/companies"),
      api("/api/manager/clients"),
      api("/api/manager/collaborators"),
    ])
      .then(([companyResult, clientResult, collaboratorResult]) => {
        setCompanies(companyResult.companies);
        setClients(clientResult.clients);
        setCollaborators(collaboratorResult.collaborators);
        setActiveCompany((current) =>
          companyResult.companies.some((item) => item.name === current)
            ? current
            : companyResult.companies[0]?.name || "",
        );
      })
      .catch((error) => showToast(error.message, "error"));
  }, [manager]);
  function clientCreated({ client, company }) {
    setClients((current) => [client, ...current]);
    setCompanies((current) =>
      current.some(
        (item) => item.name.toLowerCase() === company.name.toLowerCase(),
      )
        ? current
        : [...current, { ...company, clients: 1 }],
    );
    setActiveCompany(company.name);
  }
  function companyCreated(company) {
    setCompanies((current) =>
      current.some((item) => item.id === company.id)
        ? current.map((item) =>
            item.id === company.id ? { ...item, ...company } : item,
          )
        : [...current, company],
    );
    setActiveCompany(company.name);
  }
  function companyUpdated(previousName, company) {
    setCompanies((current) =>
      current.map((item) =>
        item.id === company.id ? { ...item, ...company } : item,
      ),
    );
    setClients((current) =>
      current.map((client) =>
        client.company_name.toLowerCase() === previousName.toLowerCase()
          ? { ...client, company_name: company.name }
          : client,
      ),
    );
    setActiveCompany((current) =>
      current.toLowerCase() === previousName.toLowerCase()
        ? company.name
        : current,
    );
  }
  function companyDeleted(company) {
    const remaining = companies.filter((item) => item.id !== company.id);
    setCompanies(remaining);
    setActiveCompany((active) =>
      active.toLowerCase() === company.name.toLowerCase()
        ? remaining[0]?.name || ""
        : active,
    );
    setClients((current) =>
      current.filter(
        (client) =>
          client.company_name.toLowerCase() !== company.name.toLowerCase(),
      ),
    );
  }
  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    window.location.assign("/");
  }
  const modules = manager
    ? [
        ...portalModules,
        {
          id: "month-structure",
          label: "Estructura del mes",
          icon: LayoutDashboard,
        },
        { id: "companies", label: "Empresas", icon: Building2 },
        { id: "collaborators", label: "Colaboradores", icon: Users },
      ]
    : portalModules;
  return (
    <main
      className={`role-portal ${manager ? "manager-portal" : "client-portal"}`}
    >
      <aside className="portal-sidebar">
        <Logo />
        <span className="portal-role">
          {manager
            ? user.agency_name || "GESTOR DE MARKETING"
            : "PORTAL DEL CLIENTE"}
        </span>
        <nav>
          {modules.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={section === id ? "active" : ""}
              onClick={() => setSection(id)}
            >
              <Icon />
              {label}
            </button>
          ))}
        </nav>
        <div className="portal-company">
          <Building2 />
          <span>
            <small>{manager ? "CLIENTE ACTIVO" : "TU EMPRESA"}</small>
            <b>
              {activeCompany || user.company_name || "Sin empresa seleccionada"}
            </b>
          </span>
        </div>
        <button className="portal-logout" onClick={logout}>
          <LogOut /> Cerrar sesión
        </button>
      </aside>
      <section className="portal-workspace">
        <header>
          <div>
            <small>
              {manager ? "OPERACIÓN DE MARKETING" : "SEGUIMIENTO DE MARKETING"}
            </small>
            <b>{modules.find((item) => item.id === section)?.label}</b>
          </div>
          <div className="portal-header-actions">
            {manager && (
              <label className="company-switcher">
                <Building2 />
                <span>
                  <small>EMPRESA ACTIVA</small>
                  <select
                    value={activeCompany}
                    onChange={(e) => setActiveCompany(e.target.value)}
                  >
                    {companies.map((company) => (
                      <option key={company.id} value={company.name}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </span>
              </label>
            )}
            <div className="portal-profile">
              <i>
                {user.name
                  .split(" ")
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join("")}
              </i>
              <span>
                <b>{user.name}</b>
                <small>{manager ? "Gestor" : "Cliente"}</small>
              </span>
            </div>
          </div>
        </header>
        <div className="portal-content">
          {section === "overview" && (
            <div className="portal-welcome">
              <div>
                <span className="eyebrow">
                  {manager ? "CENTRO DE GESTIÓN" : "TODO EN UN SOLO LUGAR"}
                </span>
                <h1>Hola, {firstName}</h1>
                <p>
                  {manager
                    ? "Organiza el contenido, los cronogramas y las entregas de tus clientes."
                    : "Revisa el avance, los próximos contenidos y los resultados de tu marca."}
                </p>
              </div>
              {manager && (
                <button onClick={() => setSection("calendar")}>
                  <Plus /> Nuevo contenido
                </button>
              )}
            </div>
          )}
          {section === "overview" && (
            <section className="portal-real-overview">
              <button onClick={() => setSection("calendar")}>
                <CalendarDays />
                <span>
                  <small>CONTENIDO COMPARTIDO</small>
                  <b>Abrir calendario editorial</b>
                  <p>
                    {manager
                      ? "Crea y organiza las publicaciones de la empresa activa."
                      : "Consulta las publicaciones compartidas por tu gestor."}
                  </p>
                </span>
                <ArrowRight />
              </button>
              {manager && (
                <button onClick={() => setSection("companies")}>
                  <Building2 />
                  <span>
                    <small>CARTERA DE LA AGENCIA</small>
                    <b>Administrar empresas</b>
                    <p>Crea empresas y sus usuarios con rol cliente.</p>
                  </span>
                  <ArrowRight />
                </button>
              )}
              <div className="portal-integrity">
                <ShieldCheck />
                <span>
                  <b>Información real y aislada por empresa</b>
                  <p>
                    Solo se muestran datos guardados en la plataforma para{" "}
                    {activeCompany || user.company_name || "tu empresa"}.
                  </p>
                </span>
              </div>
            </section>
          )}
          {section === "calendar" && (
            <CalendarModule
              manager={manager}
              company={manager ? activeCompany : user.company_name}
            />
          )}
          {section === "calendar-pdf" && (
            <CalendarPdfModule company={activeCompany} />
          )}
          {section === "month-structure" && (
            <MonthStructureModule company={activeCompany} />
          )}
          {section === "companies" && (
            <CompaniesModule
              companies={companies}
              clients={clients}
              owner={owner}
              onClientCreated={clientCreated}
              onCompanyCreated={companyCreated}
              onCompanyUpdated={companyUpdated}
              onCompanyDeleted={companyDeleted}
            />
          )}
          {section === "collaborators" && (
            <CollaboratorsModule
              collaborators={collaborators}
              owner={owner}
              onCreated={(item) =>
                setCollaborators((current) => [item, ...current])
              }
            />
          )}
        </div>
      </section>
    </main>
  );
}

function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [session, setSession] = useState({ checking: true, user: null });
  useEffect(() => {
    const update = () => setPath(window.location.pathname);
    addEventListener("popstate", update);
    return () => removeEventListener("popstate", update);
  }, []);
  useEffect(() => {
    let active = true;
    api("/api/auth/me")
      .then(({ user }) => active && setSession({ checking: false, user }))
      .catch(() => active && setSession({ checking: false, user: null }));
    return () => {
      active = false;
    };
  }, [path]);
  if (session.checking) return <LoadingScreen />;
  if (path === "/forgot-password") return <ForgotPassword />;
  if (path === "/register") return <RegisterManager />;
  if (path === "/reset-password") return <ResetPassword />;
  if (session.user) {
    const target = pathForRole(session.user.role);
    if (path !== target) return <FullPageRedirect to={target} />;
    return session.user.role === "admin" ? (
      <AdminPanel user={session.user} />
    ) : (
      <RolePortal user={session.user} />
    );
  }
  if (["/admin", "/manager", "/client"].includes(path))
    return <FullPageRedirect to="/" text="Volviendo al inicio de sesión…" />;
  return <Login />;
}

createRoot(document.getElementById("root")).render(<App />);
