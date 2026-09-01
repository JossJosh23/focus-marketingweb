import "dotenv/config";
import pg from "pg";
import bcrypt from "bcryptjs";

const { Pool } = pg;
if (!process.env.DATABASE_URL) throw new Error("Falta la variable de entorno DATABASE_URL.");

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
});

export async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'manager', 'collaborator', 'client')),
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_ip VARCHAR(64);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(80);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS company_name VARCHAR(160);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS agency_name VARCHAR(160);
    UPDATE users SET agency_name = company_name WHERE role = 'manager' AND agency_name IS NULL;
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
    ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'manager', 'collaborator', 'client'));

    CREATE TABLE IF NOT EXISTS activity_logs (
      id BIGSERIAL PRIMARY KEY,
      actor_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
      action VARCHAR(80) NOT NULL,
      target_type VARCHAR(40),
      target_id VARCHAR(80),
      details JSONB NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS activity_logs_created_idx ON activity_logs(created_at DESC);
    UPDATE users SET username = 'usuario-' || id WHERE username IS NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS users_username_lower_idx ON users(LOWER(username));

    CREATE TABLE IF NOT EXISTS companies (
      id BIGSERIAL PRIMARY KEY,
      name VARCHAR(160) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS companies_name_lower_idx ON companies(LOWER(name));
    ALTER TABLE companies ADD COLUMN IF NOT EXISTS logo_data TEXT;
    INSERT INTO companies (name) SELECT DISTINCT company_name FROM users WHERE company_name IS NOT NULL AND company_name <> '' ON CONFLICT DO NOTHING;

    CREATE TABLE IF NOT EXISTS user_companies (
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, company_id)
    );
    INSERT INTO user_companies (user_id, company_id)
      SELECT u.id, c.id FROM users u JOIN companies c ON LOWER(c.name) = LOWER(u.company_name)
      WHERE u.company_name IS NOT NULL AND u.company_name <> '' ON CONFLICT DO NOTHING;

    CREATE TABLE IF NOT EXISTS auth_sessions (
      id UUID PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      device_hash VARCHAR(64) NOT NULL,
      device_name VARCHAR(255) NOT NULL,
      ip_address VARCHAR(64),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at TIMESTAMPTZ NOT NULL,
      revoked_at TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS auth_sessions_user_idx ON auth_sessions(user_id);

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash VARCHAR(64) NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS reset_tokens_hash_idx ON password_reset_tokens(token_hash);

    CREATE TABLE IF NOT EXISTS calendar_publications (
      id UUID PRIMARY KEY,
      company_name VARCHAR(160) NOT NULL,
      created_by BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      publication_date DATE NOT NULL,
      publication_time TIME,
      topic VARCHAR(200) NOT NULL,
      copy TEXT NOT NULL DEFAULT '',
      format VARCHAR(20) NOT NULL CHECK (format IN ('post', 'reel', 'historia')),
      platforms TEXT[] NOT NULL DEFAULT '{}',
      media_data TEXT,
      media_type VARCHAR(10),
      media_name VARCHAR(255),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS calendar_publications_company_idx ON calendar_publications(LOWER(company_name), publication_date, publication_time);
    ALTER TABLE calendar_publications ADD COLUMN IF NOT EXISTS objective VARCHAR(500) NOT NULL DEFAULT '';
    ALTER TABLE calendar_publications ADD COLUMN IF NOT EXISTS distribution_type VARCHAR(20) NOT NULL DEFAULT 'organic';
    ALTER TABLE calendar_publications ADD COLUMN IF NOT EXISTS production_reference TEXT NOT NULL DEFAULT '';
    ALTER TABLE calendar_publications ADD COLUMN IF NOT EXISTS approval_status VARCHAR(30) NOT NULL DEFAULT 'pending';
    ALTER TABLE calendar_publications ADD COLUMN IF NOT EXISTS client_comment TEXT NOT NULL DEFAULT '';
    ALTER TABLE calendar_publications ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
    ALTER TABLE calendar_publications DROP CONSTRAINT IF EXISTS calendar_publications_created_by_fkey;
    ALTER TABLE calendar_publications ALTER COLUMN created_by DROP NOT NULL;
    ALTER TABLE calendar_publications ADD CONSTRAINT calendar_publications_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

    CREATE TABLE IF NOT EXISTS content_plans (
      id BIGSERIAL PRIMARY KEY,
      company_name VARCHAR(160) NOT NULL,
      period CHAR(7) NOT NULL,
      strategy_summary TEXT NOT NULL DEFAULT '',
      posts_per_week SMALLINT NOT NULL DEFAULT 0,
      videos_per_month SMALLINT NOT NULL DEFAULT 0,
      video_schedule VARCHAR(200) NOT NULL DEFAULT '',
      main_lines TEXT NOT NULL DEFAULT '',
      updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE UNIQUE INDEX IF NOT EXISTS content_plans_company_period_idx ON content_plans(LOWER(company_name), period);
    ALTER TABLE content_plans ADD COLUMN IF NOT EXISTS posts_detail VARCHAR(500) NOT NULL DEFAULT '';
    ALTER TABLE content_plans ADD COLUMN IF NOT EXISTS videos_detail VARCHAR(500) NOT NULL DEFAULT '';
    ALTER TABLE content_plans ADD COLUMN IF NOT EXISTS video_boost_detail VARCHAR(500) NOT NULL DEFAULT '';
    ALTER TABLE content_plans ADD COLUMN IF NOT EXISTS main_lines_count SMALLINT NOT NULL DEFAULT 0;

    DELETE FROM auth_sessions WHERE expires_at <= NOW() OR revoked_at < NOW() - INTERVAL '30 days';
    DELETE FROM password_reset_tokens WHERE expires_at <= NOW() OR used_at < NOW() - INTERVAL '7 days';
  `);

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;
  if (password.length < 10) throw new Error("ADMIN_PASSWORD debe tener al menos 10 caracteres.");
  const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
  if (existing.rowCount === 0) {
    const passwordHash = await bcrypt.hash(password, 12);
    await pool.query("INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, 'admin')", ["Administrador FOCUGEX", email, passwordHash]);
    console.log(`Administrador inicial creado: ${email}`);
  }
}
