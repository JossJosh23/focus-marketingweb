import "dotenv/config";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { rateLimit } from "express-rate-limit";
import { initializeDatabase, pool } from "./database.js";
import { newDeviceEmail, resetEmail, sendMail } from "./mailer.js";

const app = express();
const production = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT || 3000);
const jwtSecret = process.env.JWT_SECRET || (production ? "" : "focugex-local-development-secret-change-me");
const appUrl = (process.env.APP_URL || `http://localhost:${port}`).replace(/\/$/, "");
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, "../dist");
if (jwtSecret.length < 32) throw new Error("JWT_SECRET debe tener al menos 32 caracteres.");

app.set("trust proxy", 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "20kb" }));
app.use(cookieParser());

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });
const resetLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false });
const baseCookieOptions = { httpOnly: true, secure: production, sameSite: "lax", path: "/" };
const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");

function deviceInfo(req) {
  const agent = req.get("user-agent") || "Dispositivo desconocido";
  const compact = agent.includes("Mobile") ? "Navegador móvil" : agent.includes("Windows") ? "Navegador en Windows" : agent.includes("Macintosh") ? "Navegador en macOS" : "Navegador web";
  return { hash: hash(agent), name: compact, ip: req.ip || null };
}

function signSession(user, sessionId, remember) {
  return jwt.sign({ sub: String(user.id), role: user.role, jti: sessionId }, jwtSecret, { expiresIn: remember ? "30d" : "8h", issuer: "focugex" });
}

async function authenticate(req, res, next) {
  try {
    const token = req.cookies.focugex_session;
    if (!token) return res.status(401).json({ error: "No has iniciado sesión." });
    const payload = jwt.verify(token, jwtSecret, { issuer: "focugex" });
    const result = await pool.query(`SELECT u.id, u.name, u.email, u.role, u.last_login_at, s.id AS session_id
      FROM users u JOIN auth_sessions s ON s.user_id = u.id
      WHERE u.id = $1 AND s.id = $2 AND u.active = TRUE AND s.revoked_at IS NULL AND s.expires_at > NOW()`, [payload.sub, payload.jti]);
    if (result.rowCount === 0) return res.status(401).json({ error: "Sesión no válida." });
    req.user = result.rows[0];
    await pool.query("UPDATE auth_sessions SET last_seen_at = NOW() WHERE id = $1", [payload.jti]);
    next();
  } catch {
    res.clearCookie("focugex_session", baseCookieOptions);
    return res.status(401).json({ error: "Tu sesión expiró. Inicia sesión nuevamente." });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Acceso exclusivo para administradores." });
  next();
}

app.get("/health", async (_req, res) => {
  try { await pool.query("SELECT 1"); res.json({ status: "ok", database: "connected" }); }
  catch { res.status(503).json({ status: "error", database: "disconnected" }); }
});

app.post("/api/auth/login", loginLimiter, async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const remember = req.body.remember === true;
  if (!email || !password) return res.status(400).json({ error: "Ingresa tu correo y contraseña." });
  const result = await pool.query("SELECT id, name, email, role, password_hash, last_login_at FROM users WHERE email = $1 AND active = TRUE", [email]);
  const user = result.rows[0];
  const valid = user ? await bcrypt.compare(password, user.password_hash) : false;
  if (!valid) return res.status(401).json({ error: "Correo o contraseña incorrectos." });

  const device = deviceInfo(req);
  const knownDevice = await pool.query("SELECT id FROM auth_sessions WHERE user_id = $1 AND device_hash = $2 LIMIT 1", [user.id, device.hash]);
  const hadSessions = await pool.query("SELECT id FROM auth_sessions WHERE user_id = $1 LIMIT 1", [user.id]);
  const sessionId = crypto.randomUUID();
  const hours = remember ? 30 * 24 : 8;
  await pool.query("INSERT INTO auth_sessions (id, user_id, device_hash, device_name, ip_address, expires_at) VALUES ($1, $2, $3, $4, $5, NOW() + ($6 * INTERVAL '1 hour'))", [sessionId, user.id, device.hash, device.name, device.ip, hours]);
  await pool.query("UPDATE users SET last_login_at = NOW(), last_login_ip = $2, updated_at = NOW() WHERE id = $1", [user.id, device.ip]);
  if (hadSessions.rowCount > 0 && knownDevice.rowCount === 0) sendMail({ to: user.email, ...newDeviceEmail(user.name, device.name, device.ip) }).catch(console.error);

  const sessionCookie = remember ? { ...baseCookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 } : baseCookieOptions;
  res.cookie("focugex_session", signSession(user, sessionId, remember), sessionCookie);
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, lastLoginAt: user.last_login_at } });
});

app.get("/api/auth/me", authenticate, (req, res) => res.json({ user: req.user }));
app.post("/api/auth/logout", authenticate, async (req, res) => {
  await pool.query("UPDATE auth_sessions SET revoked_at = NOW() WHERE id = $1", [req.user.session_id]);
  res.clearCookie("focugex_session", baseCookieOptions);
  res.status(204).end();
});

app.post("/api/auth/forgot-password", resetLimiter, async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const result = await pool.query("SELECT id, name, email FROM users WHERE email = $1 AND active = TRUE", [email]);
  if (result.rowCount) {
    const user = result.rows[0];
    const token = crypto.randomBytes(32).toString("hex");
    await pool.query("UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL", [user.id]);
    await pool.query("INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, NOW() + INTERVAL '30 minutes')", [user.id, hash(token)]);
    await sendMail({ to: user.email, ...resetEmail(user.name, `${appUrl}/reset-password?token=${token}`) }).catch(console.error);
  }
  res.json({ message: "Si el correo está registrado, recibirás un enlace válido durante 30 minutos." });
});

app.post("/api/auth/reset-password", resetLimiter, async (req, res) => {
  const token = String(req.body.token || "");
  const password = String(req.body.password || "");
  if (password.length < 10) return res.status(400).json({ error: "La contraseña debe tener al menos 10 caracteres." });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query("SELECT id, user_id FROM password_reset_tokens WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW() FOR UPDATE", [hash(token)]);
    if (!result.rowCount) { await client.query("ROLLBACK"); return res.status(400).json({ error: "El enlace es inválido o ya venció." }); }
    const passwordHash = await bcrypt.hash(password, 12);
    await client.query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", [passwordHash, result.rows[0].user_id]);
    await client.query("UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1", [result.rows[0].id]);
    await client.query("UPDATE auth_sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL", [result.rows[0].user_id]);
    await client.query("COMMIT");
    res.json({ message: "Contraseña actualizada. Ya puedes iniciar sesión." });
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
});

app.get("/api/auth/sessions", authenticate, async (req, res) => {
  const result = await pool.query("SELECT id, device_name, ip_address, created_at, last_seen_at, id = $2 AS current FROM auth_sessions WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > NOW() ORDER BY last_seen_at DESC", [req.user.id, req.user.session_id]);
  res.json({ sessions: result.rows });
});

app.delete("/api/auth/sessions/others", authenticate, async (req, res) => {
  await pool.query("UPDATE auth_sessions SET revoked_at = NOW() WHERE user_id = $1 AND id <> $2 AND revoked_at IS NULL", [req.user.id, req.user.session_id]);
  res.status(204).end();
});

app.get("/", async (req, res, next) => {
  const token = req.cookies.focugex_session;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, jwtSecret, { issuer: "focugex" });
    const result = await pool.query(`SELECT u.role
      FROM users u JOIN auth_sessions s ON s.user_id = u.id
      WHERE u.id = $1 AND s.id = $2 AND u.active = TRUE
        AND s.revoked_at IS NULL AND s.expires_at > NOW()`, [payload.sub, payload.jti]);
    if (!result.rowCount) return next();
    res.setHeader("Cache-Control", "no-store");
    return res.redirect(302, result.rows[0].role === "admin" ? "/admin" : "/client");
  } catch {
    res.clearCookie("focugex_session", baseCookieOptions);
    return next();
  }
});

app.get("/api/admin/users", authenticate, requireAdmin, async (_req, res) => {
  const result = await pool.query("SELECT id, name, email, role, active, created_at, last_login_at FROM users ORDER BY created_at DESC");
  res.json({ users: result.rows });
});

app.post("/api/admin/users", authenticate, requireAdmin, async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const role = req.body.role === "admin" ? "admin" : "client";
  if (!name || !email || password.length < 10) return res.status(400).json({ error: "Nombre, correo y contraseña de al menos 10 caracteres son obligatorios." });
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query("INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, active, created_at", [name, email, passwordHash, role]);
    res.status(201).json({ user: result.rows[0] });
  } catch (error) {
    if (error.code === "23505") return res.status(409).json({ error: "Ya existe un usuario con ese correo." });
    throw error;
  }
});

app.use(express.static(distPath, {
  index: false,
  maxAge: 0,
  setHeaders(res, filePath) {
    if (filePath.includes(`${path.sep}assets${path.sep}`)) {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    } else {
      res.setHeader("Cache-Control", "no-cache");
    }
  },
}));
app.get("*path", (_req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
  res.sendFile(path.join(distPath, "index.html"));
});
app.use((error, _req, res, _next) => { console.error(error); res.status(500).json({ error: "Ocurrió un problema inesperado." }); });

initializeDatabase().then(() => app.listen(port, "0.0.0.0", () => console.log(`FOCUGEX disponible en el puerto ${port}`))).catch((error) => { console.error("No fue posible iniciar FOCUGEX:", error.message); process.exit(1); });
async function shutdown() { await pool.end(); process.exit(0); }
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
