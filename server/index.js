import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { rateLimit } from "express-rate-limit";
import { initializeDatabase, pool } from "./database.js";

const app = express();
const production = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT || 3000);
const jwtSecret = process.env.JWT_SECRET || (production ? "" : "focugex-local-development-secret-change-me");
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distPath = path.resolve(__dirname, "../dist");

if (jwtSecret.length < 32) throw new Error("JWT_SECRET debe tener al menos 32 caracteres.");

app.set("trust proxy", 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "20kb" }));
app.use(cookieParser());

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });
const cookieOptions = { httpOnly: true, secure: production, sameSite: "lax", maxAge: 8 * 60 * 60 * 1000, path: "/" };

function signSession(user) {
  return jwt.sign({ sub: String(user.id), role: user.role }, jwtSecret, { expiresIn: "8h", issuer: "focugex" });
}

async function authenticate(req, res, next) {
  try {
    const token = req.cookies.focugex_session;
    if (!token) return res.status(401).json({ error: "No has iniciado sesión." });
    const payload = jwt.verify(token, jwtSecret, { issuer: "focugex" });
    const result = await pool.query("SELECT id, name, email, role FROM users WHERE id = $1 AND active = TRUE", [payload.sub]);
    if (result.rowCount === 0) return res.status(401).json({ error: "Sesión no válida." });
    req.user = result.rows[0];
    next();
  } catch {
    res.clearCookie("focugex_session", cookieOptions);
    return res.status(401).json({ error: "Tu sesión expiró. Inicia sesión nuevamente." });
  }
}

function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Acceso exclusivo para administradores." });
  next();
}

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.status(200).json({ status: "ok", database: "connected" });
  } catch {
    res.status(503).json({ status: "error", database: "disconnected" });
  }
});

app.post("/api/auth/login", loginLimiter, async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const requestedRole = req.body.role === "client" ? "client" : "admin";
  if (!email || !password) return res.status(400).json({ error: "Ingresa tu correo y contraseña." });

  const result = await pool.query("SELECT id, name, email, role, password_hash FROM users WHERE email = $1 AND active = TRUE", [email]);
  const user = result.rows[0];
  const valid = user ? await bcrypt.compare(password, user.password_hash) : false;
  if (!valid || user.role !== requestedRole) return res.status(401).json({ error: "Correo, contraseña o tipo de acceso incorrecto." });

  res.cookie("focugex_session", signSession(user), cookieOptions);
  return res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

app.get("/api/auth/me", authenticate, (req, res) => res.json({ user: req.user }));
app.post("/api/auth/logout", (_req, res) => {
  res.clearCookie("focugex_session", cookieOptions);
  res.status(204).end();
});

app.get("/api/admin/users", authenticate, requireAdmin, async (_req, res) => {
  const result = await pool.query("SELECT id, name, email, role, active, created_at FROM users ORDER BY created_at DESC");
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
    const result = await pool.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, active, created_at",
      [name, email, passwordHash, role],
    );
    res.status(201).json({ user: result.rows[0] });
  } catch (error) {
    if (error.code === "23505") return res.status(409).json({ error: "Ya existe un usuario con ese correo." });
    throw error;
  }
});

app.use(express.static(distPath, { maxAge: production ? "1d" : 0 }));
app.get("*path", (_req, res) => res.sendFile(path.join(distPath, "index.html")));

initializeDatabase()
  .then(() => app.listen(port, "0.0.0.0", () => console.log(`FOCUGEX disponible en el puerto ${port}`)))
  .catch((error) => {
    console.error("No fue posible iniciar FOCUGEX:", error.message);
    process.exit(1);
  });

async function shutdown() {
  await pool.end();
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
