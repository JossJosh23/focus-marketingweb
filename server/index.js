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
app.use(express.json({ limit: "15mb" }));
app.use(cookieParser());

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });
const resetLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false });
const baseCookieOptions = { httpOnly: true, secure: production, sameSite: "lax", path: "/" };
const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");
const strongPassword = (value) => value.length >= 10 && /[A-Z]/.test(value) && /[0-9]/.test(value);

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
    const result = await pool.query(`SELECT u.id, u.name, u.username, u.email, u.company_name, u.role, u.last_login_at, s.id AS session_id
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

function requireManager(req, res, next) {
  if (req.user.role !== "manager") return res.status(403).json({ error: "Acceso exclusivo para gestores de marketing." });
  next();
}

const rolePath = (role) => role === "admin" ? "/admin" : role === "manager" ? "/manager" : "/client";

async function companyForRequest(req) {
  if (req.user.role === "client") return req.user.company_name || "";
  if (req.user.role !== "manager") return "";
  const requested = String(req.get("x-focugex-company") || "").trim();
  const result = await pool.query(`SELECT c.name FROM user_companies uc JOIN companies c ON c.id = uc.company_id
    WHERE uc.user_id = $1 AND ($2 = '' OR LOWER(c.name) = LOWER($2)) ORDER BY c.name LIMIT 1`, [req.user.id, requested]);
  return result.rows[0]?.name || "";
}

async function assignableCompany(client, managerId, name) {
  const existing = await client.query("SELECT id, name FROM companies WHERE LOWER(name) = LOWER($1) FOR UPDATE", [name]);
  if (existing.rowCount) {
    const access = await client.query("SELECT 1 FROM user_companies WHERE user_id = $1 AND company_id = $2", [managerId, existing.rows[0].id]);
    if (!access.rowCount) { const error = new Error("No tienes acceso a esa empresa."); error.status = 403; throw error; }
    return existing.rows[0];
  }
  const created = await client.query("INSERT INTO companies (name) VALUES ($1) RETURNING id, name", [name]);
  await client.query("INSERT INTO user_companies (user_id, company_id) VALUES ($1, $2)", [managerId, created.rows[0].id]);
  return created.rows[0];
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
  if (!strongPassword(password)) return res.status(400).json({ error: "La contraseña debe tener 10 caracteres, una mayúscula y un número." });
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

app.get("/api/manager/companies", authenticate, requireManager, async (req, res) => {
  const result = await pool.query(`SELECT c.id, c.name, COUNT(u.id)::int AS clients
    FROM user_companies uc JOIN companies c ON c.id = uc.company_id
    LEFT JOIN users u ON LOWER(u.company_name) = LOWER(c.name) AND u.role = 'client'
    WHERE uc.user_id = $1 GROUP BY c.id, c.name ORDER BY c.name`, [req.user.id]);
  res.json({ companies: result.rows });
});

app.post("/api/manager/companies", authenticate, requireManager, async (req, res) => {
  const name = String(req.body.name || "").trim();
  if (name.length < 2 || name.length > 160) return res.status(400).json({ error: "Ingresa un nombre de empresa válido." });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const company = await assignableCompany(client, req.user.id, name);
    await client.query("COMMIT");
    res.status(201).json({ company: { ...company, clients: 0 } });
  } catch (error) { await client.query("ROLLBACK"); if (error.status) return res.status(error.status).json({ error: error.message }); throw error; } finally { client.release(); }
});

app.get("/api/manager/clients", authenticate, requireManager, async (req, res) => {
  const result = await pool.query(`SELECT u.id, u.name, u.username, u.email, u.company_name, u.active, u.last_login_at
    FROM users u JOIN companies c ON LOWER(c.name) = LOWER(u.company_name) JOIN user_companies uc ON uc.company_id = c.id
    WHERE uc.user_id = $1 AND u.role = 'client' ORDER BY u.created_at DESC`, [req.user.id]);
  res.json({ clients: result.rows });
});

app.post("/api/manager/clients", authenticate, requireManager, async (req, res) => {
  const name = String(req.body.name || "").trim();
  const username = String(req.body.username || "").trim().toLowerCase();
  const email = String(req.body.email || "").trim().toLowerCase();
  const companyName = String(req.body.companyName || "").trim();
  const password = String(req.body.password || "");
  if (!name || !/^[a-z0-9._-]{3,40}$/.test(username) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !companyName || !strongPassword(password)) return res.status(400).json({ error: "Completa los datos y usa una contraseña con 10 caracteres, una mayúscula y un número." });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const company = await assignableCompany(client, req.user.id, companyName);
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await client.query("INSERT INTO users (name, username, email, company_name, password_hash, role) VALUES ($1,$2,$3,$4,$5,'client') RETURNING id, name, username, email, company_name, active, last_login_at", [name, username, email, company.name, passwordHash]);
    await client.query("INSERT INTO user_companies (user_id, company_id) VALUES ($1, $2)", [result.rows[0].id, company.id]);
    await client.query("COMMIT");
    res.status(201).json({ client: result.rows[0], company });
  } catch (error) { await client.query("ROLLBACK"); if (error.status) return res.status(error.status).json({ error: error.message }); if (error.code === "23505") return res.status(409).json({ error: "Ya existe una cuenta con ese correo o usuario." }); throw error; } finally { client.release(); }
});

app.get("/api/calendar/publications", authenticate, async (req, res) => {
  const company = await companyForRequest(req);
  if (!company) return res.json({ publications: [] });
  const result = await pool.query(`SELECT id, publication_date AS date, publication_time AS time, topic, copy, format, platforms,
    media_data AS "mediaUrl", media_type AS "mediaType", media_name AS "mediaName"
    FROM calendar_publications WHERE LOWER(company_name) = LOWER($1)
    ORDER BY publication_date, publication_time NULLS LAST`, [company]);
  res.json({ publications: result.rows });
});

app.put("/api/calendar/publications/:id", authenticate, requireManager, async (req, res) => {
  const company = await companyForRequest(req);
  const id = String(req.params.id || "");
  const date = String(req.body.date || "");
  const time = String(req.body.time || "") || null;
  const topic = String(req.body.topic || "").trim();
  const copy = String(req.body.copy || "");
  const format = String(req.body.format || "");
  const platforms = Array.isArray(req.body.platforms) ? req.body.platforms.map(String).slice(0, 10) : [];
  const mediaUrl = String(req.body.mediaUrl || "");
  const mediaType = ["image", "video"].includes(req.body.mediaType) ? req.body.mediaType : null;
  const mediaName = String(req.body.mediaName || "").slice(0, 255) || null;
  const allowedPlatforms = ["Instagram", "Facebook", "TikTok", "LinkedIn", "YouTube"];
  if (!company || !/^[0-9a-f-]{36}$/i.test(id) || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !topic || topic.length > 200 || copy.length > 10000 || !["post", "reel", "historia"].includes(format) || platforms.some((item) => !allowedPlatforms.includes(item))) return res.status(400).json({ error: "Los datos de la publicación no son válidos." });
  if (mediaUrl && (!/^data:(image\/(jpeg|png|webp|gif)|video\/(mp4|webm|quicktime));base64,/.test(mediaUrl) || mediaUrl.length > 14_000_000)) return res.status(400).json({ error: "El archivo multimedia no es válido o supera los 10 MB." });
  const result = await pool.query(`INSERT INTO calendar_publications (id, company_name, created_by, publication_date, publication_time, topic, copy, format, platforms, media_data, media_type, media_name)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    ON CONFLICT (id) DO UPDATE SET publication_date = EXCLUDED.publication_date, publication_time = EXCLUDED.publication_time,
      topic = EXCLUDED.topic, copy = EXCLUDED.copy, format = EXCLUDED.format, platforms = EXCLUDED.platforms,
      media_data = EXCLUDED.media_data, media_type = EXCLUDED.media_type, media_name = EXCLUDED.media_name, updated_at = NOW()
    WHERE LOWER(calendar_publications.company_name) = LOWER(EXCLUDED.company_name)
    RETURNING id, publication_date AS date, publication_time AS time, topic, copy, format, platforms,
      media_data AS "mediaUrl", media_type AS "mediaType", media_name AS "mediaName"`, [id, company, req.user.id, date, time, topic, copy, format, platforms, mediaUrl || null, mediaType, mediaName]);
  if (!result.rowCount) return res.status(403).json({ error: "No puedes modificar publicaciones de otra empresa." });
  res.json({ publication: result.rows[0] });
});

app.delete("/api/calendar/publications/:id", authenticate, requireManager, async (req, res) => {
  const company = await companyForRequest(req);
  const result = await pool.query("DELETE FROM calendar_publications WHERE id = $1 AND LOWER(company_name) = LOWER($2)", [req.params.id, company]);
  if (!result.rowCount) return res.status(404).json({ error: "Publicación no encontrada." });
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
    return res.redirect(302, rolePath(result.rows[0].role));
  } catch {
    res.clearCookie("focugex_session", baseCookieOptions);
    return next();
  }
});

app.get("/api/admin/users", authenticate, requireAdmin, async (_req, res) => {
  const result = await pool.query("SELECT id, name, username, email, company_name, role, active, created_at, last_login_at FROM users ORDER BY created_at DESC");
  res.json({ users: result.rows });
});

app.post("/api/admin/users", authenticate, requireAdmin, async (req, res) => {
  const name = String(req.body.name || "").trim();
  const username = String(req.body.username || "").trim().toLowerCase();
  const email = String(req.body.email || "").trim().toLowerCase();
  const companyName = String(req.body.companyName || "").trim();
  const password = String(req.body.password || "");
  const role = String(req.body.role || "client");
  if (!["manager", "client"].includes(role)) return res.status(400).json({ error: "Selecciona un rol válido para el usuario." });
  if (!name || !username || !email || !companyName || !strongPassword(password)) return res.status(400).json({ error: "Todos los campos son obligatorios y la contraseña debe tener 10 caracteres, una mayúscula y un número." });
  if (!/^[a-z0-9._-]{3,40}$/.test(username)) return res.status(400).json({ error: "El usuario debe tener entre 3 y 40 caracteres y usar solamente letras, números, punto, guion o guion bajo." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Ingresa un correo electrónico válido." });
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await pool.query("INSERT INTO users (name, username, email, company_name, password_hash, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, username, email, company_name, role, active, created_at, last_login_at", [name, username, email, companyName, passwordHash, role]);
    const company = await pool.query("INSERT INTO companies (name) VALUES ($1) ON CONFLICT (LOWER(name)) DO UPDATE SET name = EXCLUDED.name RETURNING id", [companyName]);
    await pool.query("INSERT INTO user_companies (user_id, company_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [result.rows[0].id, company.rows[0].id]);
    res.status(201).json({ user: result.rows[0] });
  } catch (error) {
    if (error.code === "23505") return res.status(409).json({ error: "Ya existe una cuenta con ese correo o nombre de usuario." });
    throw error;
  }
});

app.patch("/api/admin/users/:id", authenticate, requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const name = String(req.body.name || "").trim();
  const username = String(req.body.username || "").trim().toLowerCase();
  const email = String(req.body.email || "").trim().toLowerCase();
  const companyName = String(req.body.companyName || "").trim();
  const password = String(req.body.password || "");
  const active = req.body.active !== false;
  const role = String(req.body.role || "client");
  if (!["manager", "client"].includes(role)) return res.status(400).json({ error: "Selecciona un rol válido para el usuario." });
  if (!Number.isInteger(id) || !name || !username || !email || !companyName) return res.status(400).json({ error: "Los datos del usuario están incompletos." });
  if (!/^[a-z0-9._-]{3,40}$/.test(username) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "El correo o nombre de usuario no es válido." });
  if (password && !strongPassword(password)) return res.status(400).json({ error: "La contraseña nueva debe tener 10 caracteres, una mayúscula y un número." });
  try {
    const passwordHash = password ? await bcrypt.hash(password, 12) : null;
    const result = await pool.query(`UPDATE users SET name = $1, username = $2, email = $3, company_name = $4, active = $5,
      password_hash = COALESCE($6, password_hash), role = $7, updated_at = NOW()
      WHERE id = $8 AND role <> 'admin'
      RETURNING id, name, username, email, company_name, role, active, created_at, last_login_at`, [name, username, email, companyName, active, passwordHash, role, id]);
    if (!result.rowCount) return res.status(404).json({ error: "Usuario no encontrado." });
    const company = await pool.query("INSERT INTO companies (name) VALUES ($1) ON CONFLICT (LOWER(name)) DO UPDATE SET name = EXCLUDED.name RETURNING id", [companyName]);
    await pool.query("INSERT INTO user_companies (user_id, company_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [id, company.rows[0].id]);
    if (!active || passwordHash) await pool.query("UPDATE auth_sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL", [id]);
    res.json({ user: result.rows[0] });
  } catch (error) {
    if (error.code === "23505") return res.status(409).json({ error: "Ya existe una cuenta con ese correo o nombre de usuario." });
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
