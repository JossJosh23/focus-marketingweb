import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { AlertTriangle, ArrowLeft, ArrowRight, BarChart3, Bell, Building2, CalendarDays, Check, CheckCircle2, ChevronDown, CircleCheck, ClipboardCheck, Copy, Dices, Eye, EyeOff, FileText, HelpCircle, Laptop, LayoutDashboard, LockKeyhole, LogOut, Mail, Menu, MessageSquare, Moon, Pencil, Plus, RefreshCw, Search, Settings, ShieldCheck, Sparkles, TrendingUp, UserPlus, UserRound, Users, UserX, X } from "lucide-react";
import "./styles.css";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function Logo() { return <div className="brand"><img src="/logo-focugex.png" alt="" /><b>FOCU<i>GEX</i></b></div>; }
function goTo(path) { window.history.pushState({}, "", path); window.dispatchEvent(new PopStateEvent("popstate")); }
function pathForRole(role) { return role === "admin" ? "/admin" : role === "manager" ? "/manager" : "/client"; }

async function api(path, options = {}) {
  const response = await fetch(path, { credentials: "include", ...options });
  const result = response.status === 204 ? {} : await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 429) throw new Error("Demasiados intentos. Espera 15 minutos antes de intentarlo nuevamente.");
    if (response.status >= 500) throw new Error("El servidor tuvo un problema temporal. Inténtalo nuevamente.");
    throw new Error(result.error || "No fue posible completar la solicitud.");
  }
  return result;
}

function LoadingScreen({ text = "Verificando tu sesión segura…" }) {
  return <main className="loading-screen"><Logo /><div className="loader"></div><p>{text}</p></main>;
}

function FullPageRedirect({ to, text = "Abriendo tu espacio…" }) {
  useEffect(() => { window.location.replace(to); }, [to]);
  return <LoadingScreen text={text} />;
}

function MaintenanceScreen({ retry }) {
  return <main className="maintenance-page"><Logo /><div className="maintenance-icon"><RefreshCw /></div><span className="eyebrow">CONEXIÓN TEMPORALMENTE INTERRUMPIDA</span><h1>Estamos realizando<br />una mejora.</h1><p>Tu espacio estará disponible nuevamente en unos minutos.</p><button onClick={retry}><RefreshCw /> Volver a comprobar</button></main>;
}

function VisualPanel() {
  function moveRings(event) {
    const panel = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--pointer-x", `${(event.clientX - panel.left) / panel.width * 14 - 7}px`);
    event.currentTarget.style.setProperty("--pointer-y", `${(event.clientY - panel.top) / panel.height * 14 - 7}px`);
  }
  return <section className="visual-panel" onPointerMove={moveRings}>
    <div className="aurora one"></div><div className="aurora two"></div><div className="rings"><i></i><i></i><i></i></div>
    <div className="security-pill"><span></span> Plataforma privada · Conexión cifrada</div>
    <div className="visual-content"><Logo /><div className="private-label"><ShieldCheck /> ESPACIO PRIVADO</div><h1>Tu marketing,<br /><em>en buenas manos.</em></h1><p>Planifica, revisa y entiende todo lo que hacemos para hacer crecer tu negocio.</p>
      <div className="impact-metrics"><div><TrendingUp /><b>+24%</b><span>Alcance</span></div><div><Sparkles /><b>12</b><span>Campañas</span></div><div><CheckCircle2 /><b>98%</b><span>Aprobado</span></div></div>
    </div>
    <blockquote>“Ahora sabemos qué se publica, cuándo y por qué.”<span>— Cliente de FOCUGEX</span></blockquote>
  </section>;
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
    try { const response = await fetch("/health", { cache: "no-store" }); setConnection(response.ok ? "online" : "offline"); }
    catch { setConnection("offline"); }
  }
  useEffect(() => { checkConnection(); const timer = setInterval(checkConnection, 30000); return () => clearInterval(timer); }, []);

  async function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email")).trim();
    if (!emailPattern.test(email)) { setEmailError("Escribe un correo electrónico válido."); return; }
    setEmailError(""); setError(""); setStage("Verificando credenciales…");
    try {
      const result = await api("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: data.get("password"), remember }) });
      setStage("Protegiendo tu sesión…");
      await new Promise((resolve) => setTimeout(resolve, 300));
      setStage("Abriendo tu espacio…");
      await new Promise((resolve) => setTimeout(resolve, 250));
      window.location.assign(pathForRole(result.user.role));
    } catch (requestError) { setError(requestError.name === "TypeError" ? "No se pudo conectar con el servidor. Revisa tu conexión a internet." : requestError.message); setStage(""); }
  }
  if (connection === "offline") return <MaintenanceScreen retry={checkConnection} />;

  return <main className="login-page"><VisualPanel /><section className="form-panel"><div className="login-card">
    <form onSubmit={submit} noValidate>
      <div className={`connection-status ${connection}`}><span></span>{connection === "online" ? "Sistema disponible" : "Comprobando conexión"}</div>
      <span className="eyebrow">BIENVENIDO DE NUEVO</span><h2>Inicia sesión</h2><p className="lead">Ingresa tus datos; te llevaremos automáticamente a tu espacio.</p>
      <label>Correo electrónico<div className={`input-shell ${emailError ? "invalid" : ""}`}><Mail /><input name="email" type="email" autoComplete="email" required placeholder="correo@empresa.com" onChange={() => setEmailError("")} /></div></label>
      {emailError && <div className="field-error"><AlertTriangle />{emailError}</div>}
      <label>Contraseña<div className="input-shell password-field"><LockKeyhole /><input name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" minLength="10" required placeholder="Ingresa tu contraseña" onKeyDown={(e) => setCapsLock(e.getModifierState("CapsLock"))} onKeyUp={(e) => setCapsLock(e.getModifierState("CapsLock"))} onBlur={() => setCapsLock(false)} /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>{showPassword ? <EyeOff /> : <Eye />}</button></div></label>
      {capsLock && <div className="caps-warning"><AlertTriangle /> Bloq Mayús está activado</div>}
      <div className="form-options"><label className="remember"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /><span><Check /></span> Recordarme</label><button type="button" onClick={() => goTo("/forgot-password")}>¿Olvidaste tu contraseña?</button></div>
      <button className="submit-button" type="submit" disabled={Boolean(stage) || connection !== "online"}><span>{stage || "Iniciar sesión"}</span>{stage ? <i className="button-spinner"></i> : <ArrowRight />}</button>
      {error && <div className="error-message" role="alert"><AlertTriangle /> {error}</div>}
      <div className="secure-note"><ShieldCheck /><p><b>Acceso protegido</b><span>Conexión cifrada · Contraseña protegida · Sesión privada</span></p></div>
    </form>
  </div></section></main>;
}

function AuthCard({ children }) { return <main className="auth-page"><div className="auth-card"><Logo />{children}</div></main>; }

function ForgotPassword() {
  const [message, setMessage] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false);
  async function submit(event) { event.preventDefault(); setLoading(true); setError(""); try { const data = new FormData(event.currentTarget); const result = await api("/api/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: data.get("email") }) }); setMessage(result.message); } catch (e) { setError(e.message); } finally { setLoading(false); } }
  return <AuthCard><button className="back-link" onClick={() => goTo("/")}><ArrowLeft /> Volver</button><span className="eyebrow">RECUPERACIÓN SEGURA</span><h1>Recupera tu acceso</h1><p>Te enviaremos un enlace que vence en 30 minutos.</p>{message ? <div className="success-box"><CheckCircle2 />{message}</div> : <form onSubmit={submit}><label>Correo electrónico<div className="input-shell"><Mail /><input name="email" type="email" required placeholder="correo@empresa.com" /></div></label><button className="submit-button" disabled={loading}>{loading ? "Enviando…" : "Enviar enlace"}<ArrowRight /></button>{error && <div className="error-message"><AlertTriangle />{error}</div>}</form>}</AuthCard>;
}

function ResetPassword() {
  const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState(""); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  const token = new URLSearchParams(window.location.search).get("token") || "";
  const checks = [password.length >= 10, /[A-Z]/.test(password), /[0-9]/.test(password)];
  async function submit(event) { event.preventDefault(); if (!checks.every(Boolean)) return setError("La contraseña todavía no cumple los requisitos."); if (password !== confirm) return setError("Las contraseñas no coinciden."); try { const result = await api("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) }); setMessage(result.message); setError(""); } catch (e) { setError(e.message); } }
  return <AuthCard><button className="back-link" onClick={() => goTo("/")}><ArrowLeft /> Volver</button><span className="eyebrow">NUEVA CONTRASEÑA</span><h1>Protege tu cuenta</h1>{message ? <><div className="success-box"><CheckCircle2 />{message}</div><button className="submit-button" onClick={() => goTo("/")}>Iniciar sesión <ArrowRight /></button></> : <form onSubmit={submit}><label>Nueva contraseña<input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete="new-password" required /></label><div className="password-checks"><span className={checks[0] ? "ok" : ""}><Check />10 caracteres</span><span className={checks[1] ? "ok" : ""}><Check />Una mayúscula</span><span className={checks[2] ? "ok" : ""}><Check />Un número</span></div><label>Confirmar contraseña<input value={confirm} onChange={(e) => setConfirm(e.target.value)} type="password" autoComplete="new-password" required /></label><button className="submit-button">Actualizar contraseña <ArrowRight /></button>{error && <div className="error-message"><AlertTriangle />{error}</div>}</form>}</AuthCard>;
}

function generateUserPassword(name) {
  const base = (name.trim().split(/\s+/)[0] || "Focugex").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z]/g, "").slice(0, 6);
  const prefix = base ? base[0].toUpperCase() + base.slice(1).toLowerCase() : "Focugex";
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const random = crypto.getRandomValues(new Uint32Array(8));
  const suffix = Array.from(random, (value) => alphabet[value % alphabet.length]).join("");
  return `${prefix}@${suffix}`;
}

function UserModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({ name: user?.name || "", username: user?.username || "", email: user?.email || "", companyName: user?.company_name || "", role: user?.role || "client", password: "", active: user?.active ?? true });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  function update(field, value) { setForm((current) => ({ ...current, [field]: value })); }
  function generate() { update("password", generateUserPassword(form.name)); setShowPassword(true); }
  async function submit(event) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const result = await api(user ? `/api/admin/users/${user.id}` : "/api/admin/users", { method: user ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      onSaved(result.user);
    } catch (requestError) { setError(requestError.message); }
    finally { setSaving(false); }
  }
  return <div className="user-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="user-modal" role="dialog" aria-modal="true" aria-labelledby="user-modal-title"><header><div><span className="eyebrow">GESTIÓN DE ACCESO</span><h2 id="user-modal-title">{user ? "Editar usuario" : "Crear usuario"}</h2><p>{user ? "Actualiza la información o el acceso de esta cuenta." : "Crea una cuenta de gestor de marketing o cliente."}</p></div><button onClick={onClose} aria-label="Cerrar"><X /></button></header><form onSubmit={submit}>
    <div className="user-form-grid"><label>Nombre completo<input value={form.name} onChange={(e) => update("name", e.target.value)} required placeholder="Ej. Adriana López" /></label><label>Nombre de usuario<input value={form.username} onChange={(e) => update("username", e.target.value.toLowerCase().replace(/\s/g, ""))} required minLength="3" placeholder="adriana.lopez" /></label><label>Correo electrónico<input value={form.email} onChange={(e) => update("email", e.target.value)} type="email" required placeholder="usuario@gmail.com" /></label><label>Empresa<input value={form.companyName} onChange={(e) => update("companyName", e.target.value)} required placeholder="Nombre de la empresa" /></label><label>Rol de acceso<select value={form.role} onChange={(e) => update("role", e.target.value)}><option value="client">Cliente · revisa y aprueba</option><option value="manager">Gestor · crea y administra</option></select></label></div>
    <label>Contraseña {user && <small>Déjala vacía para conservar la actual</small>}<div className="generated-password"><input value={form.password} onChange={(e) => update("password", e.target.value)} type={showPassword ? "text" : "password"} required={!user} minLength="10" placeholder="Mínimo 10 caracteres" /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Mostrar contraseña">{showPassword ? <EyeOff /> : <Eye />}</button><button type="button" className="generate-button" onClick={generate}><Dices /> Generar clave</button>{form.password && <button type="button" onClick={() => navigator.clipboard.writeText(form.password)} aria-label="Copiar contraseña"><Copy /></button>}</div></label>
    {user && <label className="user-active-toggle"><input type="checkbox" checked={form.active} onChange={(e) => update("active", e.target.checked)} /><span><i></i></span><div><b>Usuario activo</b><small>Puede iniciar sesión en la plataforma</small></div></label>}
    {error && <div className="error-message"><AlertTriangle />{error}</div>}
    <footer><button type="button" onClick={onClose}>Cancelar</button><button className="save-user" disabled={saving}>{saving ? "Guardando…" : user ? "Guardar cambios" : "Crear usuario"}<ArrowRight /></button></footer>
  </form></section></div>;
}

function UsersModule({ users, onCreate, onEdit }) {
  const [query, setQuery] = useState("");
  const members = users.filter((item) => item.role !== "admin");
  const filtered = members.filter((item) => `${item.name} ${item.username} ${item.email} ${item.company_name} ${item.role}`.toLowerCase().includes(query.toLowerCase()));
  return <div className="users-module"><div className="users-heading"><div><span className="eyebrow">GESTIÓN DE EQUIPO</span><h1>Usuarios</h1><p>Administra gestores de marketing y clientes desde un solo lugar.</p></div><button onClick={onCreate}><UserPlus /> Crear usuario</button></div><div className="users-summary"><article><span>Total de usuarios</span><b>{members.length}</b></article><article><span>Gestores de marketing</span><b>{members.filter((item) => item.role === "manager").length}</b></article><article><span>Clientes</span><b>{members.filter((item) => item.role === "client").length}</b></article></div><section className="users-table-card"><header><div className="users-search"><Search /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar usuario, correo o empresa" /></div><span>{filtered.length} resultado{filtered.length === 1 ? "" : "s"}</span></header>{filtered.length ? <div className="users-table"><div className="users-table-row table-head"><span>Usuario</span><span>Empresa / rol</span><span>Estado</span><span>Último acceso</span><span></span></div>{filtered.map((item) => <div className="users-table-row" key={item.id}><div className="user-cell"><i>{item.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</i><span><b>{item.name}</b><small>@{item.username} · {item.email}</small></span></div><span className="company-role">{item.company_name}<small>{item.role === "manager" ? "Gestor de marketing" : "Cliente"}</small></span><span><i className={`status-pill ${item.active ? "active" : "inactive"}`}>{item.active ? "Activo" : "Suspendido"}</i></span><span>{item.last_login_at ? new Date(item.last_login_at).toLocaleDateString("es-EC") : "Sin acceso"}</span><button onClick={() => onEdit(item)}><Pencil /> Editar</button></div>)}</div> : <div className="users-empty"><Users /><h3>No hay usuarios todavía</h3><p>Crea una cuenta de gestor o cliente para comenzar.</p><button onClick={onCreate}><Plus /> Crear primer usuario</button></div>}</section></div>;
}

function AdminPanel({ user }) {
  const [section, setSection] = useState("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("focugex_admin_theme") === "dark");
  const [users, setUsers] = useState([]);
  const [userModal, setUserModal] = useState(null);
  const profileMenuRef = useRef(null);
  const initials = user.name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();

  useEffect(() => { api("/api/admin/users").then((result) => setUsers(result.users)).catch(() => {}); }, []);
  useEffect(() => {
    function closeWithEscape(event) { if (event.key === "Escape") setMenuOpen(false); }
    document.addEventListener("keydown", closeWithEscape);
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.removeEventListener("keydown", closeWithEscape); document.body.style.overflow = ""; };
  }, [menuOpen]);
  useEffect(() => {
    function closeProfileMenu(event) { if (!profileMenuRef.current?.contains(event.target)) setProfileMenuOpen(false); }
    function closeWithEscape(event) { if (event.key === "Escape") setProfileMenuOpen(false); }
    document.addEventListener("mousedown", closeProfileMenu);
    document.addEventListener("keydown", closeWithEscape);
    return () => { document.removeEventListener("mousedown", closeProfileMenu); document.removeEventListener("keydown", closeWithEscape); };
  }, []);
  useEffect(() => { localStorage.setItem("focugex_admin_theme", darkMode ? "dark" : "light"); }, [darkMode]);
  async function logout() { await api("/api/auth/logout", { method: "POST" }); window.location.assign("/"); }
  function openSection(nextSection) { setSection(nextSection); setMenuOpen(false); setProfileMenuOpen(false); }
  function saveUser(savedUser) { setUsers((current) => current.some((item) => item.id === savedUser.id) ? current.map((item) => item.id === savedUser.id ? savedUser : item) : [savedUser, ...current]); setUserModal(null); }

  return <main className={`admin-shell ${darkMode ? "admin-dark" : ""}`}>
    <section className="admin-workspace">
      <header className="admin-topbar">
        <button className="mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Abrir navegación"><Menu /></button>
        <div className="admin-breadcrumb"><span>Panel administrativo</span><b>{section === "users" ? "Usuarios" : "Vista principal"}</b></div>
        <div className="topbar-actions">
          <label className="admin-search"><Search /><input placeholder="Buscar en FOCUGEX" aria-label="Buscar" /></label>
          <button className="notification-button" aria-label="Notificaciones"><Bell /><i></i></button>
          <div className="topbar-profile-wrap" ref={profileMenuRef}>
            <button className={`topbar-profile ${profileMenuOpen ? "active" : ""}`} onClick={() => setProfileMenuOpen(!profileMenuOpen)} aria-expanded={profileMenuOpen} aria-haspopup="menu">
              <div className="topbar-avatar">{initials}<i></i></div>
              <div className="topbar-profile-copy"><b>{user.name}</b><span>{user.email}</span></div>
              <small>ADMIN</small><ChevronDown className="profile-chevron" />
            </button>
            {profileMenuOpen && <div className="account-menu" role="menu">
              <div className="account-menu-group primary"><button role="menuitem" onClick={() => openSection("dashboard")}><LayoutDashboard /><span>Panel principal</span></button><button role="menuitem"><Settings /><span>Configuración</span></button><button role="menuitem" onClick={() => setDarkMode(!darkMode)}><Moon /><span>Modo oscuro</span><i className={`theme-switch ${darkMode ? "on" : ""}`}><em></em></i></button></div>
              <span className="account-menu-label">CUENTA</span>
              <div className="account-menu-group secondary"><button role="menuitem"><UserRound /><span>Mi perfil</span></button><button role="menuitem"><ShieldCheck /><span>Seguridad y sesiones</span></button><button role="menuitem"><HelpCircle /><span>Centro de ayuda</span></button></div>
              <button className="account-logout" role="menuitem" onClick={logout}><LogOut /> Cerrar sesión</button>
            </div>}
          </div>
        </div>
      </header>

      {section === "users" ? <UsersModule users={users} onCreate={() => setUserModal({ mode: "create" })} onEdit={(selectedUser) => setUserModal({ mode: "edit", user: selectedUser })} /> : <div className="admin-dashboard">
        <div className="dashboard-heading"><div><span className="eyebrow">CENTRO DE OPERACIONES</span><h1>Buenos días, {user.name.split(" ")[0]}</h1><p>Aquí tienes una vista clara de lo que está pasando en FOCUGEX.</p></div><button><Plus /> Nueva campaña</button></div>
        <div className="admin-kpis">
          <article><div className="kpi-icon purple"><Building2 /></div><span>Clientes activos</span><b>8</b><small><TrendingUp /> +2 este mes</small></article>
          <article><div className="kpi-icon blue"><Users /></div><span>Usuarios registrados</span><b>{users.length || "—"}</b><small><CheckCircle2 /> Base sincronizada</small></article>
          <article><div className="kpi-icon cyan"><CalendarDays /></div><span>Publicaciones</span><b>24</b><small>Programadas este mes</small></article>
          <article><div className="kpi-icon orange"><CircleCheck /></div><span>Por aprobar</span><b>3</b><small>Requieren atención</small></article>
        </div>
        <div className="dashboard-grid">
          <article className="performance-card"><div className="card-heading"><div><span>Rendimiento general</span><h2>Alcance de campañas</h2></div><button>Últimos 30 días <ChevronDown /></button></div><div className="performance-total"><b>184.2K</b><span>+18.4%</span></div><div className="chart-bars">{[32,46,42,60,55,73,68,87,81,94,88,100].map((height, index) => <i key={index} style={{ "--bar": `${height}%` }}></i>)}</div><div className="chart-labels"><span>1 Ago</span><span>10 Ago</span><span>20 Ago</span><span>30 Ago</span></div></article>
          <article className="activity-card"><div className="card-heading"><div><span>En tiempo real</span><h2>Actividad reciente</h2></div><button>Ver todo</button></div><ul><li><i className="activity-dot green"></i><div><b>Contenido aprobado</b><span>Manabiche · Hace 12 min</span></div></li><li><i className="activity-dot purple"></i><div><b>Nuevo cliente añadido</b><span>Restaurante Marea · Hace 1 h</span></div></li><li><i className="activity-dot blue"></i><div><b>Campaña programada</b><span>Lanzamiento septiembre · Hace 3 h</span></div></li></ul></article>
        </div>
      </div>}
    </section>

    {menuOpen && <button className="admin-overlay" onClick={() => setMenuOpen(false)} aria-label="Cerrar navegación"></button>}
    <aside className={`admin-sidebar ${menuOpen ? "open" : ""}`} aria-label="Panel lateral administrativo">
      <button className="sidebar-close" onClick={() => setMenuOpen(false)} aria-label="Cerrar panel lateral"><X /></button>
      <div className="sidebar-profile">
        <div className="sidebar-profile-head"><Logo /></div>
      </div>
      <div className="sidebar-empty"><span>Panel administrativo</span><p>Gestiona los accesos de tu plataforma.</p></div>
      <nav className="admin-modules" aria-label="Módulos administrativos"><button className={section === "users" ? "active" : ""} onClick={() => openSection("users")}><Users /><span>Usuarios</span><small>{users.filter((item) => item.role !== "admin").length}</small></button></nav>
      <button className="sidebar-logout" onClick={logout}><LogOut /> Cerrar sesión</button>
    </aside>
    {userModal && <UserModal user={userModal.user} onClose={() => setUserModal(null)} onSaved={saveUser} />}
  </main>;
}

const portalModules = [
  { id: "overview", label: "Resumen", icon: LayoutDashboard },
  { id: "calendar", label: "Calendario", icon: CalendarDays },
  { id: "materials", label: "Materiales", icon: FileText },
  { id: "reports", label: "Informes", icon: BarChart3 },
];

function RolePortal({ user }) {
  const [section, setSection] = useState("overview");
  const manager = user.role === "manager";
  const firstName = user.name.split(" ")[0];
  async function logout() { await api("/api/auth/logout", { method: "POST" }); window.location.assign("/"); }
  return <main className={`role-portal ${manager ? "manager-portal" : "client-portal"}`}>
    <aside className="portal-sidebar"><Logo /><span className="portal-role">{manager ? "GESTOR DE MARKETING" : "PORTAL DEL CLIENTE"}</span><nav>{portalModules.map(({ id, label, icon: Icon }) => <button key={id} className={section === id ? "active" : ""} onClick={() => setSection(id)}><Icon />{label}</button>)}</nav><div className="portal-company"><Building2 /><span><small>ESPACIO DE TRABAJO</small><b>{user.company_name || "FOCUGEX"}</b></span></div><button className="portal-logout" onClick={logout}><LogOut /> Cerrar sesión</button></aside>
    <section className="portal-workspace"><header><div><small>{manager ? "OPERACIÓN DE MARKETING" : "SEGUIMIENTO DE MARKETING"}</small><b>{portalModules.find((item) => item.id === section)?.label}</b></div><div className="portal-profile"><i>{user.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</i><span><b>{user.name}</b><small>{manager ? "Gestor" : "Cliente"}</small></span></div></header>
      <div className="portal-content">
        <div className="portal-welcome"><div><span className="eyebrow">{manager ? "CENTRO DE GESTIÓN" : "TODO EN UN SOLO LUGAR"}</span><h1>Hola, {firstName}</h1><p>{manager ? "Organiza el contenido, los cronogramas y las entregas de tus clientes." : "Revisa el avance, los próximos contenidos y los resultados de tu marca."}</p></div>{manager && <button><Plus /> Nuevo contenido</button>}</div>
        {section === "overview" && <><div className="portal-stats"><article><CalendarDays /><span>Próximas publicaciones<b>8</b><small>Durante este mes</small></span></article><article><ClipboardCheck /><span>{manager ? "Pendientes de revisión" : "Por aprobar"}<b>3</b><small>Requieren atención</small></span></article><article><TrendingUp /><span>Alcance del mes<b>24.8K</b><small className="positive">+18% frente al mes anterior</small></span></article></div><div className="portal-grid"><article className="portal-card"><header><div><small>PRÓXIMAMENTE</small><h2>Calendario de contenidos</h2></div><button onClick={() => setSection("calendar")}>Ver calendario</button></header><ul className="schedule-list"><li><i>03<span>SEP</span></i><div><b>Historia · Inicio de mes</b><span>Instagram · 10:00</span></div><em className="ready">Listo</em></li><li><i>05<span>SEP</span></i><div><b>Reel · Presentación de producto</b><span>Instagram y TikTok · 18:30</span></div><em>En revisión</em></li><li><i>08<span>SEP</span></i><div><b>Carrusel educativo</b><span>Instagram · 12:00</span></div><em className="draft">Borrador</em></li></ul></article><article className="portal-card approvals"><header><div><small>{manager ? "ACTIVIDAD" : "TU PARTICIPACIÓN"}</small><h2>{manager ? "Últimas entregas" : "Material por aprobar"}</h2></div></header><div className="approval-preview"><FileText /><div><b>Campaña de septiembre</b><span>5 piezas · Actualizado hoy</span></div></div><p>{manager ? "El material está preparado para enviarlo al cliente." : "Tenemos nuevo material esperando tu revisión."}</p><button>{manager ? "Enviar a revisión" : "Revisar y aprobar"}<ArrowRight /></button></article></div></>}
        {section !== "overview" && <section className="portal-empty-state">{section === "calendar" ? <CalendarDays /> : section === "materials" ? <FileText /> : <BarChart3 />}<h2>{section === "calendar" ? "Calendario de contenidos" : section === "materials" ? "Biblioteca de materiales" : "Informes y resultados"}</h2><p>{manager ? "Este módulo está listo para recibir y administrar la información de los clientes." : "Aquí podrás consultar toda la información que el equipo comparta contigo."}</p>{manager && <button><Plus /> Agregar información</button>}</section>}
      </div>
    </section>
  </main>;
}

function App() {
  const [path, setPath] = useState(window.location.pathname); const [session, setSession] = useState({ checking: true, user: null });
  useEffect(() => { const update = () => setPath(window.location.pathname); addEventListener("popstate", update); return () => removeEventListener("popstate", update); }, []);
  useEffect(() => { let active = true; api("/api/auth/me").then(({ user }) => active && setSession({ checking: false, user })).catch(() => active && setSession({ checking: false, user: null })); return () => { active = false; }; }, [path]);
  if (session.checking) return <LoadingScreen />;
  if (path === "/forgot-password") return <ForgotPassword />;
  if (path === "/reset-password") return <ResetPassword />;
  if (session.user) { const target = pathForRole(session.user.role); if (path !== target) return <FullPageRedirect to={target} />; return session.user.role === "admin" ? <AdminPanel user={session.user} /> : <RolePortal user={session.user} />; }
  if (["/admin", "/manager", "/client"].includes(path)) return <FullPageRedirect to="/" text="Volviendo al inicio de sesión…" />;
  return <Login />;
}

createRoot(document.getElementById("root")).render(<App />);
