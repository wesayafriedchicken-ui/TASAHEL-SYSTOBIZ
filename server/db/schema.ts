import dotenv from 'dotenv';
dotenv.config({ override: true });
import pg from 'pg';
const { Pool } = pg;

function getSanitizedDbUrl(rawUrl?: string): string | undefined {
  if (!rawUrl || rawUrl.includes('mtzbvvotrffnylwsujra')) {
    rawUrl = process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('mtzbvvotrffnylwsujra')
      ? process.env.DATABASE_URL
      : 'postgresql://postgres.dpqpwqcmhcczwfvrkpot:Esraa%40131096@aws-0-eu-west-1.pooler.supabase.com:6543/postgres';
  }
  try {
    // If the URL contains multiple '@' signs (e.g. unencoded '@' in password)
    // format: postgresql://username:password@hostname:port/database
    let processedUrl = rawUrl;
    const protocolMatch = processedUrl.match(/^(postgres(?:ql)?:\/\/)(.*)$/);
    if (protocolMatch) {
      const rest = protocolMatch[2];
      const lastAtIndex = rest.lastIndexOf('@');
      if (lastAtIndex !== -1) {
        const authPart = rest.substring(0, lastAtIndex);
        const hostPart = rest.substring(lastAtIndex + 1);
        const firstColonIndex = authPart.indexOf(':');
        if (firstColonIndex !== -1) {
          const user = authPart.substring(0, firstColonIndex);
          const rawPassword = authPart.substring(firstColonIndex + 1);
          processedUrl = `${protocolMatch[1]}${encodeURIComponent(user)}:${encodeURIComponent(decodeURIComponent(rawPassword))}@${hostPart}`;
        }
      }
    }

    const parsed = new URL(processedUrl);
    parsed.searchParams.delete('sslmode');
    parsed.searchParams.delete('ssl');
    return parsed.toString();
  } catch (e) {
    return rawUrl.replace(/[?&]sslmode=[^&]+/g, '').replace(/[?&]ssl=[^&]+/g, '');
  }
}

const connectionString = getSanitizedDbUrl(process.env.DATABASE_URL);

// Parse max connections: Supabase pooler accommodates high concurrency.
// We default to 10 connections for balanced throughput and preventing checkout queue exhaustion.
const parsedPoolMax = process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX, 10) : 10;
const maxPoolConnections = isNaN(parsedPoolMax) || parsedPoolMax < 1 ? 10 : parsedPoolMax;

export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 30000, // 30s connection checkout timeout to absorb cold-starts and traffic spikes
  max: maxPoolConnections,
  idleTimeoutMillis: 30000, // 30s idle timeout for healthy connection recycling
  allowExitOnIdle: false,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

// Avoid issuing concurrent asynchronous SET queries inside pool.on('connect') 
// which conflict with PgBouncer transaction pooling and cause socket contention.

export let isDatabaseAvailable = Boolean(process.env.DATABASE_URL);

// Override pool.query to handle database query execution and transient retry globally with exponential backoff & jitter
const originalQuery = pool.query.bind(pool);
(pool as any).query = async (text: string | pg.QueryConfig, params?: any[]) => {
  if (!process.env.DATABASE_URL) {
    return { rows: [], rowCount: 0, fields: [], command: 'SELECT', oid: 0 };
  }

  let attempt = 0;
  const maxRetries = 4; // 4 retries for sufficient resilience during transient pooler spikes or cold wakeups

  while (true) {
    try {
      const res = await originalQuery(text, params);
      isDatabaseAvailable = true;
      return res;
    } catch (err: any) {
      attempt++;
      const errMsg = err?.message || '';
      const errCode = err?.code;

      const isTransientError = 
        errMsg.includes('timeout exceeded') || 
        errMsg.includes('Query read timeout') ||
        errMsg.includes('ECHECKOUTTIMEOUT') ||
        errMsg.includes('unable to check out connection') ||
        errMsg.includes('authentication did not complete') ||
        errMsg.includes('Failed to connect to database') ||
        errMsg.includes('Connection terminated') ||
        errMsg.includes('Connection closed') ||
        errMsg.includes('client has already been released') ||
        errMsg.includes('remaining connection slots are reserved') ||
        errMsg.includes('too many clients') ||
        errMsg.includes('econnrefused') ||
        errCode === 'ECONNRESET' ||
        errCode === 'ECONNREFUSED' ||
        errCode === 'ETIMEDOUT' ||
        errCode === '57P01' ||
        errCode === 'XX000' ||
        errCode === '08006' ||
        errCode === '08001' ||
        errCode === '08004' ||
        errCode === '53300';

      if (isTransientError && attempt <= maxRetries) {
        // Exponential backoff with jitter: ~500ms, ~1200ms, ~2500ms, ~4500ms
        const delay = Math.floor(500 * Math.pow(1.9, attempt - 1) + Math.random() * 300);
        console.warn(`⚠️ Transient DB issue (${errMsg || errCode}). Retrying (${attempt}/${maxRetries}) in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      if (
        errCode === 'ENOTFOUND' || 
        errCode === 'ECONNREFUSED' || 
        errCode === '57P01' || 
        errCode === '28P01' || 
        errCode === '08006' ||
        errCode === '08001' ||
        errCode === '08004' ||
        errMsg.includes('timeout') || 
        errMsg.includes('ECHECKOUTTIMEOUT') ||
        errMsg.includes('Failed to connect to database') ||
        errMsg.includes('authentication did not complete') ||
        errMsg.includes('econnrefused')
      ) {
        isDatabaseAvailable = false;
        console.warn(`⚠️ Database connection lost or unreachable (${errCode || errMsg}) — returning empty fallback.`);
        return { rows: [], rowCount: 0, fields: [], command: 'SELECT', oid: 0 };
      } else if (errCode === '23505') {
        console.warn(`⚠️ Unique constraint violation (${err.detail || errMsg})`);
      } else {
        const qPreview = typeof text === 'string' ? text.replace(/\s+/g, ' ').trim().substring(0, 150) : 'config-object';
        console.error(`❌ Database Query Error: [${errCode || 'ERR'}] ${errMsg} (Query: ${qPreview})`);
      }
      throw err;
    }
  }
};

// Periodic background heartbeat to prevent Supabase compute from going into cold sleep
setInterval(async () => {
  try {
    if (isDatabaseAvailable) {
      await originalQuery('SELECT 1');
    }
  } catch (_pingErr) {
    // Silent fail on heartbeat, pool will self-heal
  }
}, 4 * 60 * 1000).unref();

pool.on('error', (err) => {
  console.error('Unexpected error on idle database client', err);
  if ((err as any).code === 'ENOTFOUND' || (err as any).code === 'ECONNREFUSED' || (err as any).code === '28P01') {
    isDatabaseAvailable = false;
  }
});

export async function initDatabase() {
  let client;
  let retries = 2;
  let delay = 1000;
  
  while (retries > 0) {
    try {
      console.log(`🐘 Connecting to PostgreSQL (Attempts left: ${retries})...`);
      if (!process.env.DATABASE_URL) {
        console.warn("⚠️ DATABASE_URL is not set. Database initialization skipped.");
        isDatabaseAvailable = false;
        return;
      }
      client = await pool.connect();
      console.log("✅ Connected to PostgreSQL");
      isDatabaseAvailable = true;
      break;
    } catch (err) {
      retries--;
      const errCode = (err as any)?.code;
      const errMsg = (err as Error)?.message || '';
      console.error(`❌ Database connection attempt failed: ${errMsg}`);
      
      // If authentication failed (wrong password / user / SASL), don't retry in loops
      if (errCode === '28P01' || errMsg.includes('SASL') || errMsg.includes('password authentication')) {
        console.warn("⚠️ Database authentication credentials invalid. Skipping retry loop to maintain server availability.");
        isDatabaseAvailable = false;
        return;
      }

      if (retries === 0) {
        isDatabaseAvailable = false;
        if (errCode === 'ENOTFOUND' || errCode === 'ECONNREFUSED') {
          console.error(`❌ Database connection failed (${errCode}): The host could not be reached. Continuing in sandbox/offline mode.`);
        } else {
          console.error("❌ Database initialization failed:", err);
        }
        return;
      }
      console.log(`Waiting ${delay}ms before retrying database connection...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 1.5;
    }
  }

  try {
    // 0. Instant Fast-Path: If schema meta exists and version >= 26, exit immediately with zero DDL overhead (< 5ms)
    try {
      const metaRes = await client.query(`SELECT version FROM _systo_schema_meta WHERE key = 'schema_version' LIMIT 1`);
      if (metaRes.rows.length > 0 && metaRes.rows[0].version >= 28) {
        console.log(`⚡ PostgreSQL Database ready (schema cached v${metaRes.rows[0].version}). Fast-path startup complete.`);
        return;
      }
    } catch (_tableNotExists) {
      // Schema meta table doesn't exist yet, proceed with full setup
    }

    // 0.1 If core tables exist, ensure high-frequency performance indexes are created non-blockingly, then update version
    try {
      const usersCheck = await client.query(`SELECT to_regclass('public.users') as tbl_exists`);
      if (usersCheck.rows.length > 0 && usersCheck.rows[0].tbl_exists) {
        await client.query(`
          CREATE TABLE IF NOT EXISTS _systo_schema_meta (
            key TEXT PRIMARY KEY,
            version INT NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          -- High-frequency performance indexes requested for instant query response
          CREATE INDEX IF NOT EXISTS idx_tasks_company_id ON tasks(company_id);
          CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
          CREATE INDEX IF NOT EXISTS idx_tasks_company_status ON tasks(company_id, status);
          CREATE INDEX IF NOT EXISTS idx_tasks_company_created ON tasks(company_id, created_at DESC);

          CREATE INDEX IF NOT EXISTS idx_departments_company_id ON departments(company_id);
          CREATE INDEX IF NOT EXISTS idx_departments_head ON departments(department_head_id);
          CREATE INDEX IF NOT EXISTS idx_departments_comp_name ON departments(company_id, name);

          CREATE INDEX IF NOT EXISTS idx_hr_custom_field_values_company_id ON hr_custom_field_values(company_id);
          CREATE INDEX IF NOT EXISTS idx_hr_custom_field_values_entity_id ON hr_custom_field_values(entity_id);
          CREATE INDEX IF NOT EXISTS idx_hr_custom_field_values_field_id ON hr_custom_field_values(field_id);
          CREATE INDEX IF NOT EXISTS idx_hr_custom_field_values_lookup ON hr_custom_field_values(entity_id, field_id);

          CREATE INDEX IF NOT EXISTS idx_roles_company_id ON roles(company_id);
          CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
          CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
          CREATE INDEX IF NOT EXISTS idx_qa_root_cause_presets_type_active ON qa_root_cause_presets(type, is_active);
          CREATE INDEX IF NOT EXISTS idx_notifications_user_company ON notifications(user_id, company_id, created_at DESC);
          CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);

          -- Ensure products table columns for variants and pricing
          ALTER TABLE products ADD COLUMN IF NOT EXISTS has_variants BOOLEAN DEFAULT FALSE;
          ALTER TABLE products ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb;
          ALTER TABLE products ADD COLUMN IF NOT EXISTS is_cost_variable BOOLEAN DEFAULT FALSE;
          ALTER TABLE products ADD COLUMN IF NOT EXISTS is_price_variable BOOLEAN DEFAULT FALSE;

          -- Explicit grants (Supabase RLS & Data API compliance)
          DO $$
          BEGIN
            GRANT ALL ON TABLE public.products TO postgres;
            GRANT ALL ON TABLE public.products TO service_role;
            GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.products TO authenticated;
          EXCEPTION WHEN others THEN
            NULL;
          END $$;

          INSERT INTO _systo_schema_meta (key, version, updated_at) 
          VALUES ('schema_version', 28, CURRENT_TIMESTAMP)
          ON CONFLICT (key) DO UPDATE SET version = 28, updated_at = CURRENT_TIMESTAMP;
        `);
        console.log("⚡ PostgreSQL Database verified & indexes updated to v28. Ready.");
        return;
      }
    } catch (_existingCheckErr) {}

    // Full bootstrap only runs on fresh/uninitialized databases
    await client.query(`
      CREATE TABLE IF NOT EXISTS _systo_schema_meta (
        key TEXT PRIMARY KEY,
        version INT NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure hr_employee_dependents has all expected columns right away
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS hr_employee_dependents (
          id SERIAL PRIMARY KEY,
          user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          name TEXT,
          full_name TEXT,
          relationship TEXT,
          dob DATE,
          date_of_birth DATE,
          gender TEXT,
          national_id TEXT,
          phone TEXT,
          address TEXT,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        ALTER TABLE hr_employee_dependents ADD COLUMN IF NOT EXISTS name TEXT;
        ALTER TABLE hr_employee_dependents ADD COLUMN IF NOT EXISTS full_name TEXT;
        ALTER TABLE hr_employee_dependents ADD COLUMN IF NOT EXISTS relationship TEXT;
        ALTER TABLE hr_employee_dependents ADD COLUMN IF NOT EXISTS dob DATE;
        ALTER TABLE hr_employee_dependents ADD COLUMN IF NOT EXISTS date_of_birth DATE;
        ALTER TABLE hr_employee_dependents ADD COLUMN IF NOT EXISTS gender TEXT;
        ALTER TABLE hr_employee_dependents ADD COLUMN IF NOT EXISTS national_id TEXT;
        ALTER TABLE hr_employee_dependents ADD COLUMN IF NOT EXISTS phone TEXT;
        ALTER TABLE hr_employee_dependents ADD COLUMN IF NOT EXISTS address TEXT;
        ALTER TABLE hr_employee_dependents ADD COLUMN IF NOT EXISTS notes TEXT;
      `);
    } catch (e) {}

    // Performance Indexes: Create high-frequency indexes to eliminate sequential table scans
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_notifications_user_company ON notifications(user_id, company_id, created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);
        CREATE INDEX IF NOT EXISTS idx_tasks_company_status ON tasks(company_id, status);
        CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
        CREATE INDEX IF NOT EXISTS idx_hr_employees_user_id ON hr_employees(user_id);
        CREATE INDEX IF NOT EXISTS idx_hr_action_controls_comp_tab ON hr_action_controls(company_id, tab_id);
        CREATE INDEX IF NOT EXISTS idx_users_company_dept ON users(company_id, department_id);
        CREATE INDEX IF NOT EXISTS idx_job_history_user ON hr_employee_job_history(user_id);
        CREATE INDEX IF NOT EXISTS idx_compensations_user ON hr_employee_compensations(user_id);
        CREATE INDEX IF NOT EXISTS idx_dependents_user ON hr_employee_dependents(user_id);
        CREATE INDEX IF NOT EXISTS idx_trainings_user ON hr_employee_trainings(user_id);
        CREATE INDEX IF NOT EXISTS idx_documents_user ON hr_employee_documents(user_id);
        CREATE INDEX IF NOT EXISTS idx_assets_user ON hr_employee_assets(user_id);
      `);
    } catch (e) {}

    // --- Targeted Migrations ---
    try {
      // Backfill missing department_id in users table from hr_employees personal_info
      try {
        await client.query(`
          UPDATE users u
          SET department_id = d.id
          FROM hr_employees h, departments d
          WHERE u.id = h.user_id
            AND u.department_id IS NULL
            AND LOWER(d.name) = LOWER(COALESCE(h.personal_info->>'department_name', h.personal_info->>'department'))
            AND (u.company_id = d.company_id OR d.company_id IS NULL OR u.company_id IS NULL);
        `);
      } catch (e) {}

      // Add metadata to system_modules
      try {
        await client.query(`ALTER TABLE system_modules ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'`);
      } catch (e) {}

      // Ensure all 25 system modules are seeded and exist in the system_modules table
      try {
        await client.query(`
          INSERT INTO system_modules (id, name, is_active, order_index) VALUES 
          ('dashboard', 'Dashboard', TRUE, 1),
          ('ai-business', 'AI Business', TRUE, 2),
          ('meeting-hub', 'Meeting Hub', TRUE, 3),
          ('business-model', 'Business Model', TRUE, 4),
          ('kpis', 'Performance & KPIs', TRUE, 5),
          ('risk', 'Risk Register', TRUE, 6),
          ('marketing', 'Marketing Hub', TRUE, 7),
          ('leads', 'CRM Leads', TRUE, 8),
          ('crm', 'Sales CRM', TRUE, 9),
          ('operations-hub', 'Operations Hub', TRUE, 10),
          ('acct', 'Accounting', TRUE, 11),
          ('products', 'Products/Services', TRUE, 12),
          ('sops', 'SOP Management', TRUE, 13),
          ('process-mapping', 'Process Mapping', TRUE, 14),
          ('raci', 'RACI Matrix', TRUE, 15),
          ('tasks', 'Tasks', TRUE, 16),
          ('hr', 'HR Management', TRUE, 17),
          ('training', 'Training Hub', TRUE, 18),
          ('kb', 'Knowledge Base', TRUE, 19),
          ('comm', 'Communication', TRUE, 20),
          ('qa', 'Quality Assurance', TRUE, 21),
          ('kaizen', 'Kaizen Improvement', TRUE, 22),
          ('automation', 'Automation', TRUE, 23),
          ('integration', 'Integration Hub', TRUE, 24),
          ('admin', 'Admin Panel', TRUE, 25)
          ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
        `);
      } catch (e) {
        console.error("Error seeding 25 system modules:", e);
      }

      // 1. Add updated_at to users
      try {
        await client.query(`ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
      } catch (e) {}

      // Add is_super_admin to users if missing
      try {
        await client.query(`ALTER TABLE users ADD COLUMN is_super_admin BOOLEAN DEFAULT FALSE`);
      } catch (e) {}

      // Add username to users if missing
      try {
        await client.query(`ALTER TABLE users ADD COLUMN username VARCHAR(255)`);
      } catch (e) {}

      // Add permissions JSONB column to users for individual overrides
      try {
        await client.query(`ALTER TABLE users ADD COLUMN permissions JSONB DEFAULT NULL`);
      } catch (e) {}

      // Add avatar_url to users if missing
      try {
        await client.query(`ALTER TABLE users ADD COLUMN avatar_url TEXT`);
      } catch (e) {}

      // 2. Add updated_at to hr_employees
      try {
        await client.query(`ALTER TABLE hr_employees ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
      } catch (e) {}

      // 3. Add updated_at to hr_leave_requests
      try {
        await client.query(`ALTER TABLE hr_leave_requests ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
      } catch (e) {}

      // 4. Add approver_id, comments, attachments and 2-step approval to hr_leave_requests
      try {
        await client.query(`ALTER TABLE hr_leave_requests ADD COLUMN IF NOT EXISTS approver_id INTEGER REFERENCES users(id)`);
      } catch (e) {}
      try {
        await client.query(`ALTER TABLE hr_leave_requests ADD COLUMN IF NOT EXISTS comments TEXT`);
      } catch (e) {}
      try {
        await client.query(`ALTER TABLE hr_leave_requests ADD COLUMN IF NOT EXISTS attachment_url TEXT`);
        await client.query(`ALTER TABLE hr_leave_requests ADD COLUMN IF NOT EXISTS attachment_name TEXT`);
        await client.query(`ALTER TABLE hr_leave_requests ADD COLUMN IF NOT EXISTS manager_status TEXT DEFAULT 'Pending'`);
        await client.query(`ALTER TABLE hr_leave_requests ADD COLUMN IF NOT EXISTS manager_id INTEGER REFERENCES users(id)`);
        await client.query(`ALTER TABLE hr_leave_requests ADD COLUMN IF NOT EXISTS manager_comment TEXT`);
        await client.query(`ALTER TABLE hr_leave_requests ADD COLUMN IF NOT EXISTS manager_action_at TIMESTAMP`);
        await client.query(`ALTER TABLE hr_leave_requests ADD COLUMN IF NOT EXISTS attendance_status TEXT DEFAULT 'Pending'`);
        await client.query(`ALTER TABLE hr_leave_requests ADD COLUMN IF NOT EXISTS attendance_admin_id INTEGER REFERENCES users(id)`);
        await client.query(`ALTER TABLE hr_leave_requests ADD COLUMN IF NOT EXISTS attendance_comment TEXT`);
        await client.query(`ALTER TABLE hr_leave_requests ADD COLUMN IF NOT EXISTS attendance_action_at TIMESTAMP`);
        await client.query(`ALTER TABLE hr_leave_requests ADD COLUMN IF NOT EXISTS with_deduction BOOLEAN DEFAULT false`);
        await client.query(`ALTER TABLE hr_leave_requests ADD COLUMN IF NOT EXISTS deduction_type TEXT DEFAULT 'none'`);
        await client.query(`ALTER TABLE hr_leave_requests ADD COLUMN IF NOT EXISTS deduction_days NUMERIC(4,1) DEFAULT 0`);
        await client.query(`ALTER TABLE hr_leave_requests ADD COLUMN IF NOT EXISTS approved_period_scope TEXT DEFAULT 'full'`);
        await client.query(`ALTER TABLE hr_leave_requests ADD COLUMN IF NOT EXISTS approved_start_date DATE`);
        await client.query(`ALTER TABLE hr_leave_requests ADD COLUMN IF NOT EXISTS approved_end_date DATE`);
        await client.query(`ALTER TABLE hr_leave_requests ADD COLUMN IF NOT EXISTS approved_days NUMERIC(4,1)`);
      } catch (e) {}

      // 5. Add breakdown to hr_payroll
      try {
        await client.query(`ALTER TABLE hr_payroll ADD COLUMN IF NOT EXISTS breakdown JSONB DEFAULT '{}'`);
      } catch (e) {}
      
      // 6. Ensure unique constraint on hr_payroll
      try {
        await client.query(`ALTER TABLE hr_payroll ADD CONSTRAINT hr_payroll_user_month_year_key UNIQUE (user_id, month, year)`);
      } catch (e) {}

      // Add teams, job_titles, description, department_head_id, company_id, updated_at to departments table
      try {
        await client.query(`ALTER TABLE departments ADD COLUMN IF NOT EXISTS description TEXT`);
      } catch (e) {}
      try {
        await client.query(`ALTER TABLE departments ADD COLUMN IF NOT EXISTS department_head_id INTEGER`);
      } catch (e) {}
      try {
        await client.query(`ALTER TABLE departments ADD COLUMN IF NOT EXISTS teams JSONB DEFAULT '[]'`);
      } catch (e) {}
      try {
        await client.query(`ALTER TABLE departments ADD COLUMN IF NOT EXISTS job_titles JSONB DEFAULT '[]'`);
      } catch (e) {}
      try {
        await client.query(`ALTER TABLE departments ADD COLUMN IF NOT EXISTS company_id INTEGER DEFAULT 1`);
      } catch (e) {}
      try {
        await client.query(`ALTER TABLE departments ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
      } catch (e) {}
      try {
        await client.query(`ALTER TABLE departments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
      } catch (e) {}
      try {
        await client.query(`UPDATE departments SET company_id = 1 WHERE company_id IS NULL`);
      } catch (e) {}
      try {
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS team_name TEXT`);
      } catch (e) {}

      // Ensure job_descriptions, work_teams, and job_titles tables exist
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS job_descriptions (
            id SERIAL PRIMARY KEY,
            company_id INTEGER DEFAULT 1,
            title TEXT,
            department TEXT,
            team TEXT,
            grade TEXT,
            salary_band TEXT,
            reports_to TEXT,
            employment_type TEXT,
            location TEXT,
            status TEXT DEFAULT 'Approved',
            objective TEXT,
            responsibilities TEXT,
            education TEXT,
            technical_skills TEXT,
            soft_skills TEXT,
            certifications TEXT,
            kpis TEXT,
            raci_role TEXT,
            jd_data TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          GRANT ALL ON TABLE job_descriptions TO postgres;
          GRANT ALL ON TABLE job_descriptions TO service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE job_descriptions TO authenticated;

          CREATE TABLE IF NOT EXISTS work_teams (
            id SERIAL PRIMARY KEY,
            company_id INTEGER DEFAULT 1,
            department_id INTEGER,
            department TEXT,
            name TEXT,
            lead TEXT,
            members_count INTEGER DEFAULT 0,
            description TEXT,
            status TEXT DEFAULT 'Active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          GRANT ALL ON TABLE work_teams TO postgres;
          GRANT ALL ON TABLE work_teams TO service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE work_teams TO authenticated;

          CREATE TABLE IF NOT EXISTS job_titles (
            id SERIAL PRIMARY KEY,
            company_id INTEGER DEFAULT 1,
            department_id INTEGER,
            department TEXT,
            title TEXT,
            grade TEXT,
            salary_band TEXT,
            open_positions INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          GRANT ALL ON TABLE job_titles TO postgres;
          GRANT ALL ON TABLE job_titles TO service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE job_titles TO authenticated;

          CREATE TABLE IF NOT EXISTS hr_org_structure_settings (
            id SERIAL PRIMARY KEY,
            company_id INTEGER UNIQUE DEFAULT 1,
            industry_preset TEXT DEFAULT 'corporate',
            job_grades JSONB DEFAULT '[]'::jsonb,
            department_settings JSONB DEFAULT '{}'::jsonb,
            jd_templates JSONB DEFAULT '[]'::jsonb,
            custom_settings JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          GRANT ALL ON TABLE hr_org_structure_settings TO postgres;
          GRANT ALL ON TABLE hr_org_structure_settings TO service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE hr_org_structure_settings TO authenticated;

          -- Seed default Job Descriptions into database table if empty
          INSERT INTO job_descriptions (company_id, title, department, team, grade, salary_band, reports_to, employment_type, location, status, objective, responsibilities, education, technical_skills, soft_skills, certifications, kpis, raci_role)
          SELECT 1, 'Software Engineer', 'Engineering', 'Core API & Backend Team', 'Grade 4 / Senior', '$85,000 - $115,000 / year', 'Engineering Manager', 'Full-Time', 'Hybrid (On-Site 3 days)', 'Approved',
          'Responsible for designing, building, and optimizing core databases and system APIs to ensure high server stability, efficiency, and future platform scalability.',
          '["Architect, write clean, testable, and robust code using React, TypeScript, and Node.js.", "Design, optimize, and maintain relational database queries (PostgreSQL/MySQL) and caching infrastructure.", "Collaborate closely with product management and UX designers to transform product specs into scalable APIs.", "Conduct thorough code reviews, enforce security standards, and debug complex technical issues.", "Maintain automated testing suites, CI/CD pipelines, and application logging for zero-downtime releases."]',
          'Bachelor''s degree in Computer Science, Software Engineering, or equivalent practical experience (3+ years).',
          '["Node.js", "React", "TypeScript", "PostgreSQL", "Docker", "RESTful APIs", "Git", "CI/CD"]',
          '["Analytical Thinking", "Complex Problem Solving", "Technical Communication", "Team Collaboration"]',
          '["AWS Certified Developer - Associate", "Meta Front-End Developer Professional"]',
          '["Sprint Task Completion Rate ≥ 90%", "System Uptime & API Reliability ≥ 99.9%", "Code Review Turnaround Time < 24 hours"]',
          'Responsible'
          WHERE NOT EXISTS (SELECT 1 FROM job_descriptions WHERE LOWER(title) = 'software engineer');

          INSERT INTO job_descriptions (company_id, title, department, team, grade, salary_band, reports_to, employment_type, location, status, objective, responsibilities, education, technical_skills, soft_skills, certifications, kpis, raci_role)
          SELECT 1, 'HR Manager', 'Human Resources', 'People Operations & Culture', 'Grade 2 / Manager', '$75,000 - $95,000 / year', 'Director of Human Resources', 'Full-Time', 'On-Site', 'Approved',
          'Lead talent acquisition, employee relations, organizational culture, payroll processing, and regulatory labor compliance to foster a high-performing workplace.',
          '["Oversee full-cycle recruitment pipelines, onboarding experiences, and employer branding.", "Implement performance evaluation frameworks, OKR tracking, and talent retention strategies.", "Supervise monthly payroll processing, attendance, leave requests, and social insurance.", "Ensure strict adherence to national labor laws, safety policies, and employee contracts.", "Act as a trusted strategic advisor to department heads on personnel management and conflict resolution."]',
          'Bachelor''s degree in Human Resources, Business Administration, or SHRM-CP / PHR certification.',
          '["HRIS Systems", "Payroll Management", "Labor Law Compliance", "Talent Acquisition", "Performance Management"]',
          '["Conflict Resolution", "Empathetic Leadership", "Strategic Planning", "Interpersonal Communication"]',
          '["SHRM Certified Professional (SHRM-CP)", "Professional in Human Resources (PHR)"]',
          '["Employee Retention Rate ≥ 88%", "Average Time-to-Hire < 30 days", "Employee Satisfaction (eNPS) ≥ 80%"]',
          'Accountable'
          WHERE NOT EXISTS (SELECT 1 FROM job_descriptions WHERE LOWER(title) = 'hr manager');

          INSERT INTO job_descriptions (company_id, title, department, team, grade, salary_band, reports_to, employment_type, location, status, objective, responsibilities, education, technical_skills, soft_skills, certifications, kpis, raci_role)
          SELECT 1, 'Financial Analyst', 'Finance', 'Financial Planning & Analysis (FP&A)', 'Grade 3 / Senior', '$70,000 - $90,000 / year', 'Finance Director', 'Full-Time', 'Hybrid', 'Approved',
          'Oversee corporate financial planning, budgeting, audit compliance, financial forecasting, and cash flow analysis to support strategic growth.',
          '["Prepare monthly, quarterly, and annual financial statements, profit & loss, and balance sheets.", "Perform budget variance analysis and provide actionable recommendations to leadership.", "Manage accounts payable, accounts receivable, vendor invoices, and tax reconciliations.", "Ensure compliance with statutory audit standards, IFRS accounting, and internal controls.", "Develop multi-year financial forecasting models for new business ventures and capital allocation."]',
          'Bachelor''s degree in Finance, Accounting, Economics, or CPA/CFA professional credentials.',
          '["Financial Modeling", "IFRS / GAAP Accounting", "ERP Software", "Excel / Power BI", "Corporate Auditing"]',
          '["Data Precision", "Critical Thinking", "Business Acumen", "Executive Reporting"]',
          '["Certified Public Accountant (CPA)", "Chartered Financial Analyst (CFA)"]',
          '["Budget Forecast Variance < ±5%", "Financial Month-End Close < 4 Days", "100% On-Time Tax & Audit Compliance"]',
          'Responsible'
          WHERE NOT EXISTS (SELECT 1 FROM job_descriptions WHERE LOWER(title) = 'financial analyst');

          INSERT INTO job_descriptions (company_id, title, department, team, grade, salary_band, reports_to, employment_type, location, status, objective, responsibilities, education, technical_skills, soft_skills, certifications, kpis, raci_role)
          SELECT 1, 'Marketing Specialist', 'Marketing', 'Growth & Digital Acquisition', 'Grade 4 / Mid-Senior', '$55,000 - $75,000 / year', 'Head of Marketing', 'Full-Time', 'Hybrid', 'Approved',
          'Drive brand awareness, multi-channel marketing campaigns, customer acquisition funnels, and digital content strategy to accelerate customer growth.',
          '["Plan and manage targeted digital advertising campaigns across Google Ads, LinkedIn, and Meta.", "Analyze acquisition funnels, conversion rates, customer acquisition cost (CAC), and ROI.", "Produce compelling copy, newsletters, social media content, and promotional collateral.", "Optimize landing pages, search engine rankings (SEO), and lead capture workflows.", "Partner with Sales teams to align marketing messaging with revenue targets."]',
          'Bachelor''s degree in Marketing, Communications, Business, or equivalent practical experience.',
          '["Google Ads", "SEO / SEM", "Google Analytics", "Content Strategy", "HubSpot / Mailchimp"]',
          '["Creative Storytelling", "Customer Psychology", "Data-Driven Mindset", "Agile Execution"]',
          '["Google Search Ads Certified", "HubSpot Inbound Marketing Professional"]',
          '["Monthly MQL Lead Generation Target ≥ 150", "Return on Ad Spend (ROAS) ≥ 3.5x", "Organic Search Traffic Growth ≥ 20% QoQ"]',
          'Responsible'
          WHERE NOT EXISTS (SELECT 1 FROM job_descriptions WHERE LOWER(title) = 'marketing specialist');

          INSERT INTO job_descriptions (company_id, title, department, team, grade, salary_band, reports_to, employment_type, location, status, objective, responsibilities, education, technical_skills, soft_skills, certifications, kpis, raci_role)
          SELECT 1, 'Sales Executive', 'Sales', 'Enterprise B2B Sales', 'Grade 4 / Mid-Senior', '$60,000 - $80,000 + Commissions', 'Sales Director', 'Full-Time', 'On-Site / Field Visits', 'Approved',
          'Generate revenue growth, qualify prospective B2B accounts, deliver tailored solution demos, and negotiate enterprise contracts.',
          '["Identify prospective clients, initiate cold/warm outreach, and qualify decision-makers.", "Manage end-to-end sales pipelines, contract negotiations, and proposal presentations.", "Nurture ongoing key account relationships to drive renewals and expansion revenue.", "Log deal activities, sales forecasts, and communications accurately in CRM.", "Achieve and consistently exceed monthly and quarterly individual sales quotas."]',
          'Bachelor''s degree in Business Administration, Commercial Strategy, or proven B2B sales track record.',
          '["B2B Consultative Selling", "CRM Management (Salesforce/HubSpot)", "Pipeline Forecasting", "Contract Negotiation"]',
          '["Persuasive Negotiation", "Active Listening", "Resilience", "Relationship Building"]',
          '["Certified Sales Professional (CSP)"]',
          '["Quarterly Quota Achievement ≥ 100%", "Pipeline Lead Conversion Rate ≥ 25%", "Average Deal Closure Time < 45 days"]',
          'Responsible'
          WHERE NOT EXISTS (SELECT 1 FROM job_descriptions WHERE LOWER(title) = 'sales executive');

          INSERT INTO job_descriptions (company_id, title, department, team, grade, salary_band, reports_to, employment_type, location, status, objective, responsibilities, education, technical_skills, soft_skills, certifications, kpis, raci_role)
          SELECT 1, 'Chief Executive Officer (CEO)', 'Executive Leadership', 'Executive Board & Corporate Governance', 'Grade 1 / Executive Leadership (C-Level)', '$180,000 - $250,000 / year', 'No Manager / Board of Directors', 'Full-Time', 'Headquarters / On-Site', 'Approved',
          'Lead overall corporate strategy, organizational governance, financial expansion, and multi-departmental execution to achieve long-term company growth and stakeholder value.',
          '["Define and execute overall corporate strategy, organizational vision, and long-term business objectives.", "Oversee executive leadership team (C-Suite, VP, and Department Directors) to ensure cross-departmental operational alignment.", "Report directly to the Board of Directors on corporate governance, capital allocation, and risk management.", "Steer enterprise performance management, driving key company KPIs, EBIDTA targets, and market expansion.", "Represent the enterprise to investors, major enterprise clients, regulatory authorities, and public media."]',
          'Master of Business Administration (MBA) or equivalent executive management credential.',
          '["Corporate Strategy", "Financial Governance", "Executive Leadership", "Risk Management", "Capital Allocation"]',
          '["Visionary Leadership", "Strategic Decision Making", "Crisis Management", "Executive Communication"]',
          '["Certified Executive Director", "Corporate Governance Charter"]',
          '["Annual Corporate Revenue Growth ≥ Target %", "Company-Wide Profitability & EBIDTA Margin Compliance", "Strategic Initiative & Milestone Achievement ≥ 95%", "Employee Retention & Leadership Development Score ≥ 90%"]',
          'Accountable'
          WHERE NOT EXISTS (SELECT 1 FROM job_descriptions WHERE LOWER(title) LIKE '%ceo%' OR LOWER(title) LIKE '%chief executive%');

          INSERT INTO job_descriptions (company_id, title, department, team, grade, salary_band, reports_to, employment_type, location, status, objective, responsibilities, education, technical_skills, soft_skills, certifications, kpis, raci_role)
          SELECT 1, 'Operations Coordinator', 'Operations', 'Facilities & Administrative Logistics', 'Grade 5 / Associate', '$45,000 - $60,000 / year', 'Operations Manager', 'Full-Time', 'On-Site', 'Approved',
          'Ensure seamless daily operational workflows, office logistics, procurement, vendor coordination, and facility maintenance.',
          '["Coordinate office inventory procurement, equipment tracking, and vendor contracts.", "Manage workplace safety protocols, facility maintenance, and administrative schedules.", "Streamline operational workflows to reduce processing delays and operational overhead.", "Assist in compiling inter-departmental operational reports and audit documentation."]',
          'Bachelor''s degree in Business Administration, Operations, or Logistics.',
          '["Procurement Management", "Vendor Relations", "Inventory Management", "ERP Operations"]',
          '["Organization", "Multitasking", "Detail Orientation", "Cross-Functional Coordination"]',
          '["Certified Associate in Project Management (CAPM)"]',
          '["Vendor SLA Fulfillment Rate ≥ 95%", "Office Supply Procurement Variance < 3%", "Operational Request Resolution Time < 4 Hours"]',
          'Responsible'
          WHERE NOT EXISTS (SELECT 1 FROM job_descriptions WHERE LOWER(title) = 'operations coordinator');

          -- Seed default Job Titles into database table if empty
          INSERT INTO job_titles (company_id, department, title, grade, salary_band, open_positions)
          SELECT 1, 'Engineering', 'Software Engineer', 'Grade 4 / Senior', '$85,000 - $115,000 / year', 2
          WHERE NOT EXISTS (SELECT 1 FROM job_titles WHERE LOWER(title) = 'software engineer');

          INSERT INTO job_titles (company_id, department, title, grade, salary_band, open_positions)
          SELECT 1, 'Human Resources', 'HR Manager', 'Grade 2 / Manager', '$75,000 - $95,000 / year', 1
          WHERE NOT EXISTS (SELECT 1 FROM job_titles WHERE LOWER(title) = 'hr manager');

          INSERT INTO job_titles (company_id, department, title, grade, salary_band, open_positions)
          SELECT 1, 'Finance', 'Financial Analyst', 'Grade 3 / Senior', '$70,000 - $90,000 / year', 1
          WHERE NOT EXISTS (SELECT 1 FROM job_titles WHERE LOWER(title) = 'financial analyst');

          INSERT INTO job_titles (company_id, department, title, grade, salary_band, open_positions)
          SELECT 1, 'Marketing', 'Marketing Specialist', 'Grade 4 / Mid-Senior', '$55,000 - $75,000 / year', 1
          WHERE NOT EXISTS (SELECT 1 FROM job_titles WHERE LOWER(title) = 'marketing specialist');

          INSERT INTO job_titles (company_id, department, title, grade, salary_band, open_positions)
          SELECT 1, 'Sales', 'Sales Executive', 'Grade 4 / Mid-Senior', '$60,000 - $80,000 + Commissions', 3
          WHERE NOT EXISTS (SELECT 1 FROM job_titles WHERE LOWER(title) = 'sales executive');

          INSERT INTO job_titles (company_id, department, title, grade, salary_band, open_positions)
          SELECT 1, 'Executive Leadership', 'Chief Executive Officer (CEO)', 'Grade 1 / Executive Leadership (C-Level)', '$180,000 - $250,000 / year', 1
          WHERE NOT EXISTS (SELECT 1 FROM job_titles WHERE LOWER(title) LIKE '%ceo%' OR LOWER(title) LIKE '%chief executive%');

          INSERT INTO job_titles (company_id, department, title, grade, salary_band, open_positions)
          SELECT 1, 'Operations', 'Operations Coordinator', 'Grade 5 / Associate', '$45,000 - $60,000 / year', 1
          WHERE NOT EXISTS (SELECT 1 FROM job_titles WHERE LOWER(title) = 'operations coordinator');
        `);
      } catch (e) {
        console.warn('Error creating job_descriptions / work_teams / job_titles tables:', e);
      }

      // Add technical assessment columns to hr_interviews
      try {
        await client.query(`ALTER TABLE hr_interviews ADD COLUMN IF NOT EXISTS technical_score INTEGER`);
      } catch (e) {}
      try {
        await client.query(`ALTER TABLE hr_interviews ADD COLUMN IF NOT EXISTS technical_notes TEXT`);
      } catch (e) {}

      // Add Custom Fields engine tables
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS hr_custom_fields (
            id SERIAL PRIMARY KEY,
            company_id INTEGER DEFAULT 1,
            entity_type TEXT NOT NULL,
            field_name TEXT NOT NULL,
            field_label_ar TEXT NOT NULL,
            field_label_en TEXT NOT NULL,
            field_type TEXT NOT NULL,
            is_required BOOLEAN DEFAULT false,
            options TEXT,
            default_value TEXT,
            relation_target_table TEXT,
            relation_display_column TEXT,
            order_index INTEGER DEFAULT 0,
            allow_search BOOLEAN DEFAULT false,
            add_to_filter BOOLEAN DEFAULT false,
            hidden BOOLEAN DEFAULT false,
            bold BOOLEAN DEFAULT false,
            allow_in_quick_entry BOOLEAN DEFAULT false,
            translatable BOOLEAN DEFAULT false,
            print_hide BOOLEAN DEFAULT false,
            report_hide BOOLEAN DEFAULT false,
            in_list_view BOOLEAN DEFAULT false,
            in_list_filter BOOLEAN DEFAULT false,
            in_preview BOOLEAN DEFAULT false,
            sticky BOOLEAN DEFAULT false,
            in_filter BOOLEAN DEFAULT false,
            in_global_search BOOLEAN DEFAULT false,
            read_only BOOLEAN DEFAULT false,
            allow_on_submit BOOLEAN DEFAULT false,
            perm_level INTEGER DEFAULT 0,
            ignore_xss_filter BOOLEAN DEFAULT false,
            own_only BOOLEAN DEFAULT false,
            mask_value BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          ALTER TABLE hr_custom_fields ADD COLUMN IF NOT EXISTS default_value TEXT;
          ALTER TABLE hr_custom_fields ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
          ALTER TABLE hr_custom_fields ADD COLUMN IF NOT EXISTS allow_search BOOLEAN DEFAULT false;
          ALTER TABLE hr_custom_fields ADD COLUMN IF NOT EXISTS add_to_filter BOOLEAN DEFAULT false;
          ALTER TABLE hr_custom_fields ADD COLUMN IF NOT EXISTS hidden BOOLEAN DEFAULT false;
          ALTER TABLE hr_custom_fields ADD COLUMN IF NOT EXISTS bold BOOLEAN DEFAULT false;
          ALTER TABLE hr_custom_fields ADD COLUMN IF NOT EXISTS allow_in_quick_entry BOOLEAN DEFAULT false;
          ALTER TABLE hr_custom_fields ADD COLUMN IF NOT EXISTS translatable BOOLEAN DEFAULT false;
          ALTER TABLE hr_custom_fields ADD COLUMN IF NOT EXISTS print_hide BOOLEAN DEFAULT false;
          ALTER TABLE hr_custom_fields ADD COLUMN IF NOT EXISTS report_hide BOOLEAN DEFAULT false;
          ALTER TABLE hr_custom_fields ADD COLUMN IF NOT EXISTS in_list_view BOOLEAN DEFAULT false;
          ALTER TABLE hr_custom_fields ADD COLUMN IF NOT EXISTS in_list_filter BOOLEAN DEFAULT false;
          ALTER TABLE hr_custom_fields ADD COLUMN IF NOT EXISTS in_preview BOOLEAN DEFAULT false;
          ALTER TABLE hr_custom_fields ADD COLUMN IF NOT EXISTS sticky BOOLEAN DEFAULT false;
          ALTER TABLE hr_custom_fields ADD COLUMN IF NOT EXISTS in_filter BOOLEAN DEFAULT false;
          ALTER TABLE hr_custom_fields ADD COLUMN IF NOT EXISTS in_global_search BOOLEAN DEFAULT false;
          ALTER TABLE hr_custom_fields ADD COLUMN IF NOT EXISTS read_only BOOLEAN DEFAULT false;
          ALTER TABLE hr_custom_fields ADD COLUMN IF NOT EXISTS allow_on_submit BOOLEAN DEFAULT false;
          ALTER TABLE hr_custom_fields ADD COLUMN IF NOT EXISTS perm_level INTEGER DEFAULT 0;
          ALTER TABLE hr_custom_fields ADD COLUMN IF NOT EXISTS ignore_xss_filter BOOLEAN DEFAULT false;
          ALTER TABLE hr_custom_fields ADD COLUMN IF NOT EXISTS own_only BOOLEAN DEFAULT false;
          ALTER TABLE hr_custom_fields ADD COLUMN IF NOT EXISTS mask_value BOOLEAN DEFAULT false;

          -- Clean up duplicate custom field overrides if any exist
          DELETE FROM hr_custom_fields
          WHERE id NOT IN (
            SELECT MAX(id)
            FROM hr_custom_fields
            GROUP BY company_id, entity_type, field_name
          );

          CREATE TABLE IF NOT EXISTS hr_custom_field_values (
            id SERIAL PRIMARY KEY,
            company_id INTEGER DEFAULT 1,
            field_id INTEGER REFERENCES hr_custom_fields(id) ON DELETE CASCADE,
            entity_id INTEGER NOT NULL,
            value TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT hr_custom_field_values_unique_entity_field UNIQUE (field_id, entity_id)
          );

          GRANT ALL ON TABLE hr_custom_fields TO postgres;
          GRANT ALL ON TABLE hr_custom_fields TO service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE hr_custom_fields TO authenticated;

          GRANT ALL ON TABLE hr_custom_field_values TO postgres;
          GRANT ALL ON TABLE hr_custom_field_values TO service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE hr_custom_field_values TO authenticated;

          CREATE TABLE IF NOT EXISTS hr_action_controls (
            id SERIAL PRIMARY KEY,
            company_id INTEGER DEFAULT 1,
            action_key TEXT NOT NULL,
            tab_id TEXT NOT NULL,
            section_name TEXT NOT NULL,
            label_en TEXT NOT NULL,
            label_ar TEXT,
            state TEXT NOT NULL DEFAULT 'active',
            permission_scope TEXT NOT NULL DEFAULT 'everyone',
            tooltip_text TEXT DEFAULT 'You are not authorized to perform this action',
            order_index INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT hr_action_controls_unique_key UNIQUE (company_id, action_key)
          );

          GRANT ALL ON TABLE hr_action_controls TO postgres;
          GRANT ALL ON TABLE hr_action_controls TO service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE hr_action_controls TO authenticated;

          CREATE TABLE IF NOT EXISTS company_schema_customizations (
            id SERIAL PRIMARY KEY,
            company_id INTEGER DEFAULT 1,
            module_name TEXT NOT NULL DEFAULT 'hr',
            page_key TEXT NOT NULL,
            schema_config JSONB NOT NULL DEFAULT '{}'::jsonb,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT company_schema_customizations_unique UNIQUE (company_id, module_name, page_key)
          );

          GRANT ALL ON TABLE company_schema_customizations TO postgres;
          GRANT ALL ON TABLE company_schema_customizations TO service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE company_schema_customizations TO authenticated;
        `);
        console.log("✅ Custom Fields engine tables and grants initialized.");
      } catch (err) {
        console.error("❌ Failed to create Custom Fields engine tables:", err);
      }

      // Ensure HR scalar columns and sub-tables exist
      try {
        await client.query(`
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS first_name TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS middle_name TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS last_name TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS preferred_name TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS personal_email TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS work_email TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS mobile_phone TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS home_phone TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS street_1 TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS street_2 TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS city TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS county TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS country TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS postcode TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS national_id TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS passport_number TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS shirt_size TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS bank_name TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS account_number TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS iban TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS swift_code TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS bank_details_copy TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS emergency_contact_relation TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS emergency_contact_address TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS team_name TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS manager_name TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS potential_bonus_percent NUMERIC(5, 2) DEFAULT 0;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS potential_bonus_amount NUMERIC(12, 2) DEFAULT 0;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS kpi_amount NUMERIC(12, 2) DEFAULT 0;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS kpi_frequency TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS kpi_payout_mechanism TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS kpi_payout_date DATE;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS gender TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS nationality TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS marital_status TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS date_of_birth DATE;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS address TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS work_location TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS job_grade TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS assets_list JSONB DEFAULT '[]';
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS benefits_info JSONB DEFAULT '{}';
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS onboarding_tasks JSONB DEFAULT '[]';
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS offboarding_tasks JSONB DEFAULT '[]';
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS system_logins JSONB DEFAULT '[]';
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS trainings_list JSONB DEFAULT '[]';
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS notes_list JSONB DEFAULT '[]';
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS email TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS department TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS position TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';
          ALTER TABLE hr_leave_requests ADD COLUMN IF NOT EXISTS employee_id INTEGER;
          ALTER TABLE hr_leave_requests ADD COLUMN IF NOT EXISTS leave_type TEXT;
          ALTER TABLE hr_payroll ADD COLUMN IF NOT EXISTS total_gross NUMERIC DEFAULT 0;
          ALTER TABLE hr_payroll ADD COLUMN IF NOT EXISTS total_deductions NUMERIC DEFAULT 0;

          CREATE TABLE IF NOT EXISTS hr_performance_evaluations (
            id SERIAL PRIMARY KEY,
            company_id INTEGER,
            employee_id INTEGER,
            user_id INTEGER,
            evaluation_period TEXT,
            overall_rating NUMERIC,
            status TEXT DEFAULT 'Completed',
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS hr_employee_job_history (
            id SERIAL PRIMARY KEY,
            user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            job_title TEXT NOT NULL,
            department_name TEXT,
            team_name TEXT,
            reporting_to TEXT,
            location TEXT,
            effective_date DATE,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS hr_employee_compensations (
            id SERIAL PRIMARY KEY,
            user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            pay_rate NUMERIC(12, 2) NOT NULL DEFAULT 0,
            pay_frequency TEXT DEFAULT 'Monthly',
            currency TEXT DEFAULT 'EGP',
            effective_date DATE,
            change_reason TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS hr_employee_bonuses (
            id SERIAL PRIMARY KEY,
            user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            bonus_type TEXT,
            amount NUMERIC(12, 2) DEFAULT 0,
            percent NUMERIC(5, 2) DEFAULT 0,
            frequency TEXT,
            payout_date DATE,
            status TEXT DEFAULT 'Pending',
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS hr_employee_commissions (
            id SERIAL PRIMARY KEY,
            user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            commission_rate NUMERIC(5, 2) DEFAULT 0,
            target_amount NUMERIC(12, 2) DEFAULT 0,
            payout_frequency TEXT,
            status TEXT DEFAULT 'Active',
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS hr_employee_equities (
            id SERIAL PRIMARY KEY,
            user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            equity_type TEXT NOT NULL,
            total_units NUMERIC(12, 2) DEFAULT 0,
            vesting_schedule TEXT,
            grant_date DATE,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS hr_employee_shift_allowances (
            id SERIAL PRIMARY KEY,
            user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            allowance_type TEXT NOT NULL,
            rate NUMERIC(12, 2) DEFAULT 0,
            frequency TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS hr_employee_employment_statuses (
            id SERIAL PRIMARY KEY,
            user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            status TEXT NOT NULL,
            effective_date DATE,
            reason TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS hr_employee_penalties (
            id SERIAL PRIMARY KEY,
            user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            penalty_type TEXT NOT NULL,
            reason TEXT,
            amount NUMERIC(12, 2) DEFAULT 0,
            date_issued DATE,
            status TEXT DEFAULT 'Active',
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS hr_employee_assets (
            id SERIAL PRIMARY KEY,
            user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            category TEXT,
            description TEXT,
            serial_number TEXT,
            date_loaned DATE,
            date_returned DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS hr_employee_dependents (
            id SERIAL PRIMARY KEY,
            user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            relationship TEXT,
            dob DATE,
            gender TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS hr_employee_benefit_history (
            id SERIAL PRIMARY KEY,
            user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            benefit_name TEXT NOT NULL,
            change_type TEXT,
            effective_date DATE,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS hr_employee_onboarding_tasks (
            id SERIAL PRIMARY KEY,
            user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            category TEXT,
            title TEXT NOT NULL,
            assignee TEXT,
            due_date DATE,
            completed BOOLEAN DEFAULT false,
            completed_by TEXT,
            completed_date DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS hr_employee_offboarding_tasks (
            id SERIAL PRIMARY KEY,
            user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            category TEXT,
            title TEXT NOT NULL,
            assignee TEXT,
            due_date DATE,
            completed BOOLEAN DEFAULT false,
            completed_by TEXT,
            completed_date DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS hr_employee_trainings (
            id SERIAL PRIMARY KEY,
            user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            course_name TEXT NOT NULL,
            provider TEXT,
            completion_date DATE,
            expiry_date DATE,
            score NUMERIC(5, 2),
            status TEXT DEFAULT 'Completed',
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS hr_employee_documents (
            id SERIAL PRIMARY KEY,
            user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            document_type TEXT NOT NULL,
            document_name TEXT NOT NULL,
            file_url TEXT,
            expiry_date DATE,
            status TEXT DEFAULT 'Active',
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS hr_employee_system_logins (
            id SERIAL PRIMARY KEY,
            user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            system_name TEXT NOT NULL,
            username TEXT,
            role TEXT,
            access_level TEXT,
            status TEXT DEFAULT 'Active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS hr_employee_notes (
            id SERIAL PRIMARY KEY,
            user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            author_id INT,
            author_name TEXT,
            title TEXT,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          -- EXPLICIT GRANTS for Supabase Data API (May 2026 update compliance)
          GRANT ALL ON TABLE hr_employees TO postgres, service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE hr_employees TO authenticated, anon;

          GRANT ALL ON TABLE hr_employee_job_history TO postgres, service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE hr_employee_job_history TO authenticated, anon;

          GRANT ALL ON TABLE hr_employee_compensations TO postgres, service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE hr_employee_compensations TO authenticated, anon;

          GRANT ALL ON TABLE hr_employee_bonuses TO postgres, service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE hr_employee_bonuses TO authenticated, anon;

          GRANT ALL ON TABLE hr_employee_commissions TO postgres, service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE hr_employee_commissions TO authenticated, anon;

          GRANT ALL ON TABLE hr_employee_equities TO postgres, service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE hr_employee_equities TO authenticated, anon;

          GRANT ALL ON TABLE hr_employee_shift_allowances TO postgres, service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE hr_employee_shift_allowances TO authenticated, anon;

          GRANT ALL ON TABLE hr_employee_employment_statuses TO postgres, service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE hr_employee_employment_statuses TO authenticated, anon;

          GRANT ALL ON TABLE hr_employee_penalties TO postgres, service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE hr_employee_penalties TO authenticated, anon;

          GRANT ALL ON TABLE hr_employee_assets TO postgres, service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE hr_employee_assets TO authenticated, anon;

          GRANT ALL ON TABLE hr_employee_dependents TO postgres, service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE hr_employee_dependents TO authenticated, anon;

          GRANT ALL ON TABLE hr_employee_benefit_history TO postgres, service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE hr_employee_benefit_history TO authenticated, anon;

          GRANT ALL ON TABLE hr_employee_onboarding_tasks TO postgres, service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE hr_employee_onboarding_tasks TO authenticated, anon;

          GRANT ALL ON TABLE hr_employee_offboarding_tasks TO postgres, service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE hr_employee_offboarding_tasks TO authenticated, anon;

          GRANT ALL ON TABLE hr_employee_trainings TO postgres, service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE hr_employee_trainings TO authenticated, anon;

          GRANT ALL ON TABLE hr_employee_documents TO postgres, service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE hr_employee_documents TO authenticated, anon;

          GRANT ALL ON TABLE hr_employee_system_logins TO postgres, service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE hr_employee_system_logins TO authenticated, anon;

          GRANT ALL ON TABLE hr_employee_notes TO postgres, service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE hr_employee_notes TO authenticated, anon;
        `);
        console.log("✅ HR explicit scalar columns & relational sub-tables initialized.");
      } catch (hrInitErr) {
        console.error("❌ Failed to initialize HR scalar columns or sub-tables:", hrInitErr);
      }

      // Add Pipelines / Custom Statuses table
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS hr_pipelines (
            id SERIAL PRIMARY KEY,
            company_id INTEGER DEFAULT 1,
            module_key TEXT NOT NULL,
            name_en TEXT NOT NULL,
            name_ar TEXT NOT NULL,
            color TEXT DEFAULT '#3b82f6',
            order_index INTEGER DEFAULT 0,
            is_default BOOLEAN DEFAULT false,
            has_popup BOOLEAN DEFAULT false,
            popup_config JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          ALTER TABLE hr_pipelines ADD COLUMN IF NOT EXISTS has_popup BOOLEAN DEFAULT false;
          ALTER TABLE hr_pipelines ADD COLUMN IF NOT EXISTS popup_config JSONB DEFAULT '{}'::jsonb;

          GRANT ALL ON TABLE hr_pipelines TO postgres;
          GRANT ALL ON TABLE hr_pipelines TO service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE hr_pipelines TO authenticated;
        `);
        
        // Ensure "Hired" stage default popup config
        await client.query(`
          UPDATE hr_pipelines 
          SET has_popup = true,
              popup_config = $1::jsonb
          WHERE module_key = 'recruitment' 
            AND LOWER(name_en) = 'hired' 
            AND (has_popup IS FALSE OR popup_config IS NULL OR popup_config = '{}'::jsonb)
        `, [JSON.stringify({
          title: "[Candidate Name] got the job!",
          message: "Add [Candidate Name] as a new employee now.",
          checkbox_label: "Close this job opening and remove the public posting",
          button_label: "Add New Employee",
          action_type: "navigate_employee",
          action_target: "directory"
        })]);
        
        // Seed default pipelines if empty
        const countRes = await client.query("SELECT COUNT(*) FROM hr_pipelines");
        if (parseInt(countRes.rows[0].count, 10) === 0) {
          console.log("🌱 Seeding default HR pipelines...");
          const defaults = [
            // Recruitment (Candidate stages)
            { module: 'recruitment', en: 'Applied', ar: 'تم التقديم', color: '#3b82f6', ord: 1 },
            { module: 'recruitment', en: 'Screened', ar: 'تمت التصفية', color: '#8b5cf6', ord: 2 },
            { module: 'recruitment', en: 'Interviewing', ar: 'المقابلة', color: '#f59e0b', ord: 3 },
            { module: 'recruitment', en: 'Technical Assessment', ar: 'التقييم التقني', color: '#6366f1', ord: 4 },
            { module: 'recruitment', en: 'Job Offer Sent', ar: 'تم إرسال العرض', color: '#ec4899', ord: 5 },
            { module: 'recruitment', en: 'Hired', ar: 'تم التعيين', color: '#10b981', ord: 6 },
            { module: 'recruitment', en: 'Rejected', ar: 'مرفوض', color: '#ef4444', ord: 7 },

            // Attendance / Leave
            { module: 'leave_requests', en: 'Pending', ar: 'معلق', color: '#f59e0b', ord: 1 },
            { module: 'leave_requests', en: 'Approved', ar: 'مقبول', color: '#10b981', ord: 2 },
            { module: 'leave_requests', en: 'Rejected', ar: 'مرفوض', color: '#ef4444', ord: 3 },

            // Payroll
            { module: 'payroll', en: 'Draft', ar: 'مسودة', color: '#64748b', ord: 1 },
            { module: 'payroll', en: 'Pending Approval', ar: 'بانتظار الموافقة', color: '#f59e0b', ord: 2 },
            { module: 'payroll', en: 'Paid', ar: 'مدفوع', color: '#10b981', ord: 3 },

            // Performance
            { module: 'performance', en: 'Draft', ar: 'مسودة', color: '#64748b', ord: 1 },
            { module: 'performance', en: 'In Progress', ar: 'قيد التنفيذ', color: '#3b82f6', ord: 2 },
            { module: 'performance', en: 'Completed', ar: 'مكتمل', color: '#10b981', ord: 3 },

            // Directory / Employees
            { module: 'directory', en: 'Active', ar: 'نشط', color: '#10b981', ord: 1 },
            { module: 'directory', en: 'Suspended', ar: 'موقوف', color: '#f59e0b', ord: 2 },
            { module: 'directory', en: 'Terminated', ar: 'منهى الخدمة', color: '#ef4444', ord: 3 }
          ];

          for (const item of defaults) {
            await client.query(`
              INSERT INTO hr_pipelines (module_key, name_en, name_ar, color, order_index, is_default)
              VALUES ($1, $2, $3, $4, $5, true)
            `, [item.module, item.en, item.ar, item.color, item.ord]);
          }
          console.log("✅ Seeding default HR pipelines completed.");
        }
        console.log("✅ Pipelines tables and grants initialized.");
      } catch (err) {
        console.error("❌ Failed to create Pipelines engine table:", err);
      }

      console.log("✅ Basic migrations completed.");
    } catch (e) {
      console.error("❌ Error running basic migrations:", e);
    }
    
    console.log("🛠️ Initializing Core Schemas...");
    
    try {
      await client.query(`
        -- Baseline Tables
        CREATE TABLE IF NOT EXISTS companies (
          id SERIAL PRIMARY KEY,
          name TEXT UNIQUE NOT NULL,
          subdomain TEXT UNIQUE,
          corporate_domain TEXT,
          logo_url TEXT,
          settings JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        ALTER TABLE companies ADD COLUMN IF NOT EXISTS corporate_domain TEXT;
        ALTER TABLE companies ADD COLUMN IF NOT EXISTS corporate_domains JSONB DEFAULT '[]'::jsonb;
        ALTER TABLE companies ADD COLUMN IF NOT EXISTS logo_url TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_method TEXT DEFAULT 'standard';

        CREATE TABLE IF NOT EXISTS hr_shifts (
          id SERIAL PRIMARY KEY,
          company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          type TEXT DEFAULT 'Fixed',
          start_time TIME NOT NULL,
          end_time TIME NOT NULL,
          grace_period_mins INTEGER DEFAULT 15,
          required_hours NUMERIC(10,2) DEFAULT 8.00,
          color TEXT DEFAULT '#3b82f6',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        ALTER TABLE hr_shifts ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Fixed';
        ALTER TABLE hr_shifts ADD COLUMN IF NOT EXISTS grace_period_mins INTEGER DEFAULT 15;
        ALTER TABLE hr_shifts ADD COLUMN IF NOT EXISTS required_hours NUMERIC(10,2) DEFAULT 8.00;
        ALTER TABLE hr_shifts ADD COLUMN IF NOT EXISTS attendance_method TEXT DEFAULT 'Both';
        ALTER TABLE hr_shifts ALTER COLUMN required_hours TYPE NUMERIC(10,2) USING required_hours::NUMERIC(10,2);

        CREATE TABLE IF NOT EXISTS hr_shift_assignments (
          id SERIAL PRIMARY KEY,
          company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          shift_id INTEGER REFERENCES hr_shifts(id) ON DELETE CASCADE,
          day_of_week INTEGER NOT NULL, -- 0-6 (Sunday to Saturday)
          start_date TEXT,
          end_date TEXT,
          recurrence TEXT DEFAULT 'weekly',
          notification_sent BOOLEAN DEFAULT false,
          employee_visibility TEXT DEFAULT 'published_all',
          is_published BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        ALTER TABLE hr_shift_assignments ADD COLUMN IF NOT EXISTS start_date TEXT;
        ALTER TABLE hr_shift_assignments ADD COLUMN IF NOT EXISTS end_date TEXT;
        ALTER TABLE hr_shift_assignments ADD COLUMN IF NOT EXISTS recurrence TEXT DEFAULT 'weekly';
        ALTER TABLE hr_shift_assignments ADD COLUMN IF NOT EXISTS notification_sent BOOLEAN DEFAULT false;
        ALTER TABLE hr_shift_assignments ADD COLUMN IF NOT EXISTS employee_visibility TEXT DEFAULT 'published_all';
        ALTER TABLE hr_shift_assignments ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true;

        -- Drop any legacy unique constraints on hr_shift_assignments to allow date-specific assignments
        DO $$
        DECLARE
            r RECORD;
        BEGIN
            FOR r IN (
                SELECT constraint_name 
                FROM information_schema.table_constraints 
                WHERE table_name = 'hr_shift_assignments' 
                  AND constraint_type = 'UNIQUE'
            ) LOOP
                EXECUTE 'ALTER TABLE hr_shift_assignments DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name);
            END LOOP;
        END $$;

        CREATE TABLE IF NOT EXISTS hr_shift_swaps (
          id SERIAL PRIMARY KEY,
          company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
          requester_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          counterpart_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          swap_date DATE NOT NULL,
          requester_shift_id INTEGER REFERENCES hr_shifts(id) ON DELETE SET NULL,
          counterpart_shift_id INTEGER REFERENCES hr_shifts(id) ON DELETE SET NULL,
          reason TEXT,
          manager_status TEXT DEFAULT 'Pending',
          manager_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          manager_comment TEXT,
          manager_action_at TIMESTAMP,
          attendance_status TEXT DEFAULT 'Pending',
          attendance_admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          attendance_comment TEXT,
          attendance_action_at TIMESTAMP,
          status TEXT DEFAULT 'Pending Manager',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Company Geofence Locations for Mobile Biometric Attendance
        CREATE TABLE IF NOT EXISTS public.company_geofence_locations (
          id SERIAL PRIMARY KEY,
          company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          code VARCHAR(50) DEFAULT 'HQ-01',
          latitude NUMERIC(10, 7) NOT NULL,
          longitude NUMERIC(10, 7) NOT NULL,
          allowed_radius_meters INTEGER NOT NULL DEFAULT 100,
          is_active BOOLEAN DEFAULT true,
          address TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
        );

        GRANT ALL ON TABLE public.company_geofence_locations TO postgres;
        GRANT ALL ON TABLE public.company_geofence_locations TO service_role;
        GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.company_geofence_locations TO authenticated;

        ALTER TABLE public.company_geofence_locations ENABLE ROW LEVEL SECURITY;

        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies WHERE tablename = 'company_geofence_locations' AND policyname = 'Allow access to geofence locations'
          ) THEN
            CREATE POLICY "Allow access to geofence locations"
              ON public.company_geofence_locations
              FOR ALL
              TO public, authenticated, service_role
              USING (true)
              WITH CHECK (true);
          END IF;
        END $$;

        -- Seed initial headquarters if empty
        INSERT INTO public.company_geofence_locations (company_id, name, code, latitude, longitude, allowed_radius_meters, is_active, address)
        SELECT 1, 'Main Corporate Headquarters', 'HQ-MAIN', 30.0444, 31.2357, 100, true, 'Main Head Office, Downtown Central Tower, Cairo, Egypt'
        WHERE NOT EXISTS (SELECT 1 FROM public.company_geofence_locations WHERE company_id = 1);

        CREATE TABLE IF NOT EXISTS roles (
          id SERIAL PRIMARY KEY,
          company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          description TEXT DEFAULT '',
          permissions JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(company_id, name)
        );

        CREATE TABLE IF NOT EXISTS departments (
          id SERIAL PRIMARY KEY,
          company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          description TEXT,
          department_head_id INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(company_id, name)
        );

        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          username VARCHAR(255),
          password TEXT NOT NULL,
          role_id INTEGER REFERENCES roles(id),
          department_id INTEGER REFERENCES departments(id),
          job_title TEXT,
          reporting_to INTEGER REFERENCES users(id),
          status TEXT DEFAULT 'active',
          is_super_admin BOOLEAN DEFAULT FALSE,
          training_points INTEGER DEFAULT 0,
          avatar_url TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Process/Workflow Tables
        CREATE TABLE IF NOT EXISTS sops (
          id SERIAL PRIMARY KEY,
          company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          department_id INTEGER REFERENCES departments(id),
          process_type TEXT,
          owner_id INTEGER REFERENCES users(id),
          approver_id INTEGER REFERENCES users(id),
          objective TEXT,
          scope TEXT,
          roles_responsibilities TEXT,
          required_documentation TEXT,
          reporting_line TEXT,
          tools_channels_used TEXT,
          kpis TEXT,
          flowchart_data TEXT,
          tags TEXT,
          parent_id INTEGER REFERENCES sops(id),
          review_date TIMESTAMP,
          status TEXT DEFAULT 'Draft',
          version_number TEXT DEFAULT '1.0',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS sop_steps (
          id SERIAL PRIMARY KEY,
          sop_id INTEGER REFERENCES sops(id) ON DELETE CASCADE,
          step_number INTEGER NOT NULL,
          step_description TEXT NOT NULL,
          expected_result TEXT,
          attachment_url TEXT,
          required_course_id INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- CRM Base
        CREATE TABLE IF NOT EXISTS crm_stages (
          id SERIAL PRIMARY KEY,
          company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          order_index INTEGER NOT NULL,
          color TEXT DEFAULT '#10b981'
        );

        CREATE TABLE IF NOT EXISTS crm_customers (
          id SERIAL PRIMARY KEY,
          company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          company TEXT,
          source TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(company_id, email),
          UNIQUE(company_id, phone)
        );

        CREATE TABLE IF NOT EXISTS crm_leads (
          id SERIAL PRIMARY KEY,
          company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          email TEXT,
          status TEXT DEFAULT 'new',
          phone TEXT,
          whatsapp TEXT,
          value REAL DEFAULT 0,
          items JSONB DEFAULT '[]',
          assigned_to INTEGER REFERENCES users(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(company_id, email)
        );

        CREATE TABLE IF NOT EXISTS crm_deals (
          id SERIAL PRIMARY KEY,
          company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
          customer_id INTEGER REFERENCES crm_customers(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          description TEXT,
          value REAL DEFAULT 0,
          stage_id INTEGER REFERENCES crm_stages(id),
          assigned_to INTEGER REFERENCES users(id),
          service_type TEXT,
          product TEXT,
          items JSONB DEFAULT '[]',
          sop_id INTEGER REFERENCES sops(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS orders (
          id SERIAL PRIMARY KEY,
          company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
          lead_id INTEGER REFERENCES crm_leads(id) ON DELETE SET NULL,
          total_amount REAL,
          status TEXT DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          description TEXT,
          price REAL DEFAULT 0,
          currency TEXT DEFAULT 'EGP',
          category TEXT,
          type TEXT DEFAULT 'product',
          status TEXT DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(company_id, name)
        ); 

        CREATE TABLE IF NOT EXISTS order_items (
          id SERIAL PRIMARY KEY,
          order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
          product_id INTEGER REFERENCES products(id),
          quantity INTEGER DEFAULT 1,
          unit_price REAL,
          total_price REAL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS risks (
          id SERIAL PRIMARY KEY,
          company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
          department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
          name TEXT NOT NULL,
          description TEXT,
          category TEXT,
          probability INTEGER DEFAULT 1,
          impact INTEGER DEFAULT 1,
          risk_score INTEGER GENERATED ALWAYS AS (probability * impact) STORED,
          mitigation_plan TEXT,
          contingency_plan TEXT,
          owner_id INTEGER REFERENCES users(id),
          sop_id INTEGER REFERENCES sops(id) ON DELETE SET NULL,
          kpi_id INTEGER REFERENCES kpis(id) ON DELETE SET NULL,
          status TEXT DEFAULT 'Open',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Migrations for risks table
        DO $$ 
        BEGIN 
          BEGIN
            ALTER TABLE risks ADD COLUMN IF NOT EXISTS kpi_id INTEGER REFERENCES kpis(id) ON DELETE SET NULL;
          EXCEPTION WHEN others THEN 
            RAISE NOTICE 'kpi_id already exists or error adding it';
          END;

          BEGIN
            ALTER TABLE risks ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL;
          EXCEPTION WHEN others THEN 
            RAISE NOTICE 'department_id already exists or error adding it';
          END;

          BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='risks' AND column_name='risk_score') THEN
              ALTER TABLE risks ADD COLUMN risk_score INTEGER GENERATED ALWAYS AS (probability * impact) STORED;
            END IF;
          EXCEPTION WHEN others THEN 
            RAISE NOTICE 'risk_score already exists or error adding it';
          END;

          BEGIN
            ALTER TABLE risks ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE;
          EXCEPTION WHEN others THEN
            RAISE NOTICE 'company_id already exists or error adding it';
          END;
        END $$;
      `);

      // Products/Services extended fields and pricing/discounts tables
      await client.query(`
        DO $$ 
        BEGIN 
          BEGIN
            ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT;
          EXCEPTION WHEN others THEN RAISE NOTICE 'sku column issue';
          END;

          BEGIN
            ALTER TABLE products ADD COLUMN IF NOT EXISTS cost REAL DEFAULT 0;
          EXCEPTION WHEN others THEN RAISE NOTICE 'cost column issue';
          END;

          BEGIN
            ALTER TABLE products ADD COLUMN IF NOT EXISTS tax REAL DEFAULT 0;
          EXCEPTION WHEN others THEN RAISE NOTICE 'tax column issue';
          END;

          BEGIN
            ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_qty INTEGER DEFAULT 0;
          EXCEPTION WHEN others THEN RAISE NOTICE 'stock_qty column issue';
          END;

          BEGIN
            ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 10;
          EXCEPTION WHEN others THEN RAISE NOTICE 'low_stock_threshold column issue';
          END;

          BEGIN
            ALTER TABLE products ADD COLUMN IF NOT EXISTS service_duration_hours REAL DEFAULT 0;
          EXCEPTION WHEN others THEN RAISE NOTICE 'service_duration_hours column issue';
          END;

          BEGIN
            ALTER TABLE products ADD COLUMN IF NOT EXISTS service_duration_unit VARCHAR(20) DEFAULT 'hours';
          EXCEPTION WHEN others THEN RAISE NOTICE 'service_duration_unit column issue';
          END;

          BEGIN
            ALTER TABLE products ADD COLUMN IF NOT EXISTS sop_id INTEGER REFERENCES sops(id) ON DELETE SET NULL;
          EXCEPTION WHEN others THEN RAISE NOTICE 'sop_id column issue';
          END;

          BEGIN
            ALTER TABLE products ADD COLUMN IF NOT EXISTS process_mapping_id INTEGER REFERENCES process_maps(id) ON DELETE SET NULL;
          EXCEPTION WHEN others THEN RAISE NOTICE 'process_mapping_id column issue';
          END;

          BEGIN
            ALTER TABLE products ADD COLUMN IF NOT EXISTS is_cost_variable BOOLEAN DEFAULT FALSE;
          EXCEPTION WHEN others THEN RAISE NOTICE 'is_cost_variable column issue';
          END;

          BEGIN
            ALTER TABLE products ADD COLUMN IF NOT EXISTS is_price_variable BOOLEAN DEFAULT FALSE;
          EXCEPTION WHEN others THEN RAISE NOTICE 'is_price_variable column issue';
          END;

          BEGIN
            ALTER TABLE products ADD COLUMN IF NOT EXISTS has_variants BOOLEAN DEFAULT FALSE;
          EXCEPTION WHEN others THEN RAISE NOTICE 'has_variants column issue';
          END;

          BEGIN
            ALTER TABLE products ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb;
          EXCEPTION WHEN others THEN RAISE NOTICE 'variants column issue';
          END;
        END $$;

        -- Create Price Lists table
        CREATE TABLE IF NOT EXISTS price_lists (
          id SERIAL PRIMARY KEY,
          company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          description TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Create Price List Items table for overrides
        CREATE TABLE IF NOT EXISTS price_list_items (
          id SERIAL PRIMARY KEY,
          price_list_id INTEGER REFERENCES price_lists(id) ON DELETE CASCADE,
          product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
          override_price REAL NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(price_list_id, product_id)
        );

        -- Create Promo Codes table
        CREATE TABLE IF NOT EXISTS promo_codes (
          id SERIAL PRIMARY KEY,
          company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
          code TEXT NOT NULL UNIQUE,
          discount_type TEXT DEFAULT 'percentage',
          discount_value REAL NOT NULL,
          expiry_date TIMESTAMP,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Accounting Module Tables (Unified Schema)
        CREATE TABLE IF NOT EXISTS acct_coa (
          id TEXT NOT NULL,
          company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
          name_en TEXT NOT NULL,
          name_ar TEXT,
          type TEXT NOT NULL, -- assets, liabilities, equity, revenue, expenses
          is_active BOOLEAN DEFAULT TRUE,
          parent_id TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (company_id, id)
        );

        CREATE TABLE IF NOT EXISTS acct_banks_wallets (
          id TEXT NOT NULL,
          company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
          name_en TEXT NOT NULL,
          name_ar TEXT,
          type TEXT NOT NULL, -- bank, cash_box
          currency TEXT DEFAULT 'SAR',
          account_number TEXT,
          iban TEXT,
          bank_name TEXT,
          balance REAL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (company_id, id)
        );

        CREATE TABLE IF NOT EXISTS acct_journal_entries (
          id TEXT NOT NULL,
          company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
          date DATE NOT NULL,
          reference TEXT,
          description TEXT,
          lines JSONB DEFAULT '[]', -- Array of JournalLine
          is_system BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (company_id, id)
        );

        CREATE TABLE IF NOT EXISTS acct_invoices (
          id TEXT NOT NULL,
          company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
          customer_name TEXT NOT NULL,
          customer_id TEXT,
          deal_id TEXT,
          date DATE NOT NULL,
          due_date DATE NOT NULL,
          items JSONB DEFAULT '[]', -- Array of InvoiceItem
          subtotal REAL DEFAULT 0,
          vat_amount REAL DEFAULT 0,
          discount_amount REAL DEFAULT 0,
          total_amount REAL DEFAULT 0,
          status TEXT DEFAULT 'draft', -- draft, sent, paid, overdue
          reminder_sent BOOLEAN DEFAULT FALSE,
          currency TEXT DEFAULT 'SAR',
          exchange_rate REAL DEFAULT 1,
          vat_number TEXT,
          po_number TEXT,
          payment_terms TEXT,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (company_id, id)
        );

        CREATE TABLE IF NOT EXISTS acct_bills (
          id TEXT NOT NULL,
          company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
          supplier_name TEXT NOT NULL,
          account_id TEXT NOT NULL,
          date DATE NOT NULL,
          due_date DATE NOT NULL,
          description TEXT,
          amount REAL DEFAULT 0,
          vat_rate REAL DEFAULT 15,
          vat_amount REAL DEFAULT 0,
          total_amount REAL DEFAULT 0,
          status TEXT DEFAULT 'unpaid', -- unpaid, paid
          is_copq BOOLEAN DEFAULT FALSE,
          ncr_id INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (company_id, id)
        );

        CREATE TABLE IF NOT EXISTS acct_bank_statements (
          id TEXT NOT NULL,
          company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
          date DATE NOT NULL,
          description TEXT,
          amount REAL NOT NULL,
          reconciled BOOLEAN DEFAULT FALSE,
          matched_journal_id TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (company_id, id)
        );

        CREATE TABLE IF NOT EXISTS acct_report_notes (
          company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
          period TEXT NOT NULL, -- e.g. '2026-Q2'
          notes JSONB DEFAULT '[]',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (company_id, period)
        );

        -- CRITICAL: Explicit Permissions Grants for the May 2026 Supabase Update
        GRANT ALL ON TABLE acct_coa TO postgres;
        GRANT ALL ON TABLE acct_coa TO service_role;
        GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE acct_coa TO authenticated;

        GRANT ALL ON TABLE acct_banks_wallets TO postgres;
        GRANT ALL ON TABLE acct_banks_wallets TO service_role;
        GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE acct_banks_wallets TO authenticated;

        GRANT ALL ON TABLE acct_journal_entries TO postgres;
        GRANT ALL ON TABLE acct_journal_entries TO service_role;
        GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE acct_journal_entries TO authenticated;

        GRANT ALL ON TABLE acct_invoices TO postgres;
        GRANT ALL ON TABLE acct_invoices TO service_role;
        GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE acct_invoices TO authenticated;

        GRANT ALL ON TABLE acct_bills TO postgres;
        GRANT ALL ON TABLE acct_bills TO service_role;
        GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE acct_bills TO authenticated;

        GRANT ALL ON TABLE acct_bank_statements TO postgres;
        GRANT ALL ON TABLE acct_bank_statements TO service_role;
        GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE acct_bank_statements TO authenticated;

        GRANT ALL ON TABLE acct_report_notes TO postgres;
        GRANT ALL ON TABLE acct_report_notes TO service_role;
        GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE acct_report_notes TO authenticated;
      `);

      console.log("✅ Main tables initialized.");
    } catch (e) { console.error("❌ Error creating main tables:", e); }


    try {
      await client.query(`
        -- Case Study/Improvement Module
        CREATE TABLE IF NOT EXISTS kaizen_suggestions (
          id SERIAL PRIMARY KEY,
          company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          problem_description TEXT,
          proposed_solution TEXT,
          expected_benefit TEXT,
          submitted_by INTEGER REFERENCES users(id),
          department_id INTEGER REFERENCES departments(id),
          sop_id INTEGER REFERENCES sops(id) ON DELETE SET NULL,
          status TEXT DEFAULT 'New', -- New, Reviewing, Approved, Implementing, Done, Rejected
          priority TEXT DEFAULT 'Medium',
          score INTEGER DEFAULT 0,
          impact_time_saving REAL,
          impact_cost_saving REAL,
          kpi_id INTEGER,
          improvement_type TEXT DEFAULT 'Time Reduction',
          impact_rating INTEGER DEFAULT 3,
          effort_rating INTEGER DEFAULT 3,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        DO $$
        BEGIN
          BEGIN
            ALTER TABLE kaizen_suggestions ADD COLUMN IF NOT EXISTS improvement_type TEXT DEFAULT 'Time Reduction';
            ALTER TABLE kaizen_suggestions ADD COLUMN IF NOT EXISTS impact_rating INTEGER DEFAULT 3;
            ALTER TABLE kaizen_suggestions ADD COLUMN IF NOT EXISTS effort_rating INTEGER DEFAULT 3;
            ALTER TABLE kaizen_suggestions ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Medium';
            ALTER TABLE kaizen_suggestions ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;
          EXCEPTION WHEN others THEN
            RAISE NOTICE 'kaizen_suggestions columns already exist';
          END;
        END $$;

        CREATE TABLE IF NOT EXISTS kaizen_pdca (
          id SERIAL PRIMARY KEY,
          suggestion_id INTEGER REFERENCES kaizen_suggestions(id) ON DELETE CASCADE,
          phase TEXT NOT NULL, -- Plan, Do, Check, Act
          description TEXT,
          status TEXT DEFAULT 'Pending', -- Pending, In Progress, Completed
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Transactional Tables (Module specific)
        CREATE TABLE IF NOT EXISTS crm_interactions (
          id SERIAL PRIMARY KEY,
          company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
          customer_id INTEGER REFERENCES crm_customers(id) ON DELETE CASCADE,
          deal_id INTEGER REFERENCES crm_deals(id) ON DELETE SET NULL,
          type TEXT NOT NULL, -- Note, Chat, Call, Email, SMS, WhatsApp, Facebook
          content TEXT,
          sender_id INTEGER REFERENCES users(id), -- NULL if from customer
          external_id TEXT, -- ID from external API (Twilio/Meta)
          sentiment TEXT, -- Positive, Neutral, Negative, Angry
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS crm_attachments (
          id SERIAL PRIMARY KEY,
          company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
          customer_id INTEGER REFERENCES crm_customers(id) ON DELETE CASCADE,
          deal_id INTEGER REFERENCES crm_deals(id) ON DELETE SET NULL,
          file_name TEXT NOT NULL,
          file_url TEXT NOT NULL,
          file_type TEXT,
          uploaded_by INTEGER REFERENCES users(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS crm_assignment_rules (
          id SERIAL PRIMARY KEY,
          company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
          department_id INTEGER REFERENCES departments(id),
          service_type TEXT,
          product TEXT,
          user_id INTEGER REFERENCES users(id),
          is_active BOOLEAN DEFAULT TRUE
        );
      `);
      console.log("✅ Basic CRM & Product tables created.");
    } catch (e) {
      console.error("❌ Error creating CRM tables:", e);
    }

    // Multi-tenancy Migration Section
    try {
      await client.query(`
        DO $$
        DECLARE
          main_company_id INTEGER;
          target_table TEXT;
          tables_to_update TEXT[] := ARRAY[
            'roles', 'departments', 'users', 'sops', 'sop_steps', 'crm_stages', 'crm_customers', 
            'crm_leads', 'crm_deals', 'orders', 'products', 'crm_interactions', 
            'crm_attachments', 'crm_assignment_rules', 'article_categories', 'knowledge_articles', 
            'knowledge_article_revisions', 'kpis', 'kpi_history', 'process_maps', 'process_nodes',
            'process_edges', 'tasks', 'task_checklists', 'automation_rules', 'automation_logs', 
            'internal_messages', 'integrations', 'integration_logs', 'risk_register', 'risk_log',
            'kaizen_ideas', 'kaizen_suggestions', 'global_statuses', 'system_logs', 'qa_forms', 
            'qa_evaluations', 'qa_ncr', 'raci_assignments', 'training_courses', 'course_enrollments',
            'training_modules', 'training_lessons', 'training_lesson_progress', 'training_quizzes',
            'training_questions', 'training_quiz_attempts', 'chat_rooms', 'chat_messages',
            'user_presence', 'audit_logs', 'notifications'
          ];
        BEGIN
          -- 1. Ensure a default company exists
          IF NOT EXISTS (SELECT 1 FROM companies) THEN
            INSERT INTO companies (name, subdomain) VALUES ('Main Office', 'main') RETURNING id INTO main_company_id;
          ELSE
            SELECT id INTO main_company_id FROM companies ORDER BY id LIMIT 1;
          END IF;

          -- 2. Dynamically add company_id to tables if missing
          FOREACH target_table IN ARRAY tables_to_update
          LOOP
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = target_table AND table_schema = 'public') THEN
              IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = target_table AND column_name = 'company_id') THEN
                BEGIN
                  EXECUTE format('ALTER TABLE %I ADD COLUMN company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE', target_table);
                  EXECUTE format('UPDATE %I SET company_id = %L WHERE company_id IS NULL', target_table, main_company_id);
                EXCEPTION WHEN others THEN
                  RAISE NOTICE 'Could not add company_id to table %', target_table;
                END;
              END IF;
            END IF;
          END LOOP;
        END $$;
      `);
      console.log("✅ Multi-tenant schema migration completed.");
    } catch (e) {
      console.error("❌ Error during multi-tenant migration:", e);
    }

    try {
      await client.query(`
        -- Seed CRM Stages if empty
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM crm_stages) THEN
            INSERT INTO crm_stages (name, order_index, color) VALUES 
            ('Leads', 1, '#64748b'),
            ('Meeting', 2, '#3b82f6'),
            ('Proposal', 3, '#f59e0b'),
            ('Implementation', 4, '#8b5cf6'),
            ('Done', 5, '#10b981');
          END IF;
        END $$;
      `);
    } catch (e) { console.error("❌ Error seeding CRM stages:", e); }

    try {
      await client.query(`
        -- Global Seeds
        DO $$
        BEGIN
          -- Seed roles
          IF NOT EXISTS (SELECT 1 FROM roles) THEN
            INSERT INTO roles (id, name, permissions) VALUES 
            (1, 'Admin', '{"*": {"view": true, "create": true, "edit": true, "delete": true, "export": true}}'),
            (2, 'Manager', '{"CRM": {"view": true, "create": true, "edit": true}, "SOP": {"view": true, "create": true}}'),
            (3, 'Employee', '{"CRM": {"view": true}, "SOP": {"view": true}}');
            PERFORM setval('roles_id_seq', (SELECT MAX(id) FROM roles));
          END IF;
        END $$;
      `);
    } catch (e) { console.error("❌ Error seeding roles:", e); }

    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS departments (
          id SERIAL PRIMARY KEY,
          name TEXT UNIQUE NOT NULL,
          description TEXT,
          department_head_id INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          username VARCHAR(255),
          password TEXT NOT NULL,
          role_id INTEGER REFERENCES roles(id),
          department_id INTEGER REFERENCES departments(id),
          job_title TEXT,
          reporting_to INTEGER REFERENCES users(id),
          status TEXT DEFAULT 'active', -- active, inactive
          is_super_admin BOOLEAN DEFAULT FALSE,
          training_points INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log("✅ Auth & Dept tables created.");
    } catch (e) { console.error("❌ Error creating auth tables:", e); }

    try {
      await client.query(`
        -- Migration for users table
        DO $$ 
        BEGIN 
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='job_title') THEN
            ALTER TABLE users ADD COLUMN job_title TEXT;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='reporting_to') THEN
            ALTER TABLE users ADD COLUMN reporting_to INTEGER REFERENCES users(id);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='status') THEN
            ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active';
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_super_admin') THEN
            ALTER TABLE users ADD COLUMN is_super_admin BOOLEAN DEFAULT FALSE;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='updated_at') THEN
            ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='username') THEN
            ALTER TABLE users ADD COLUMN username VARCHAR(255);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='has_portal_access') THEN
            ALTER TABLE users ADD COLUMN has_portal_access BOOLEAN DEFAULT TRUE;
          END IF;
        END $$;

        -- Migration for roles table
        DO $$ 
        BEGIN 
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='roles' AND column_name='permissions') THEN
            ALTER TABLE roles ADD COLUMN permissions JSONB DEFAULT '{}';
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='roles' AND column_name='description') THEN
            ALTER TABLE roles ADD COLUMN description TEXT DEFAULT '';
          END IF;
        END $$;

        -- CRM Module
        CREATE TABLE IF NOT EXISTS crm_leads (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE,
          status TEXT DEFAULT 'new',
          phone TEXT,
          whatsapp TEXT,
          value REAL DEFAULT 0,
          items JSONB DEFAULT '[]',
          assigned_to INTEGER REFERENCES users(id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        DO $$ 
        BEGIN 
          -- Check for sentiment in crm_interactions
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='crm_interactions' AND column_name='sentiment') THEN
            ALTER TABLE crm_interactions ADD COLUMN sentiment TEXT;
          END IF;

          -- Add phone unique constraint to crm_customers if it's missing
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='crm_customers') THEN
            IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='crm_customers' AND constraint_name='crm_customers_phone_key') THEN
              BEGIN
                ALTER TABLE crm_customers ADD CONSTRAINT crm_customers_phone_key UNIQUE (phone);
              EXCEPTION WHEN others THEN
                RAISE NOTICE 'Could not add unique constraint to crm_customers.phone because of existing duplicates.';
              END;
            END IF;
          END IF;

          -- Rename leads to crm_leads if it exists
          IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leads') THEN
            IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_leads') THEN
              ALTER TABLE leads RENAME TO crm_leads;
            END IF;
          END IF;

          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='crm_leads' AND column_name='value') THEN
            ALTER TABLE crm_leads ADD COLUMN value REAL DEFAULT 0;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='crm_leads' AND column_name='assigned_to') THEN
            ALTER TABLE crm_leads ADD COLUMN assigned_to INTEGER REFERENCES users(id);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='crm_leads' AND column_name='phone') THEN
            ALTER TABLE crm_leads ADD COLUMN phone TEXT;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='crm_leads' AND column_name='whatsapp') THEN
            ALTER TABLE crm_leads ADD COLUMN whatsapp TEXT;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='crm_leads' AND column_name='items') THEN
            ALTER TABLE crm_leads ADD COLUMN items JSONB DEFAULT '[]';
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='crm_leads' AND column_name='created_at') THEN
            ALTER TABLE crm_leads ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='crm_leads' AND column_name='updated_at') THEN
            ALTER TABLE crm_leads ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
          END IF;

          -- Migration for crm_deals table
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='crm_deals' AND column_name='items') THEN
            ALTER TABLE crm_deals ADD COLUMN items JSONB DEFAULT '[]';
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='crm_deals' AND column_name='service_type') THEN
            ALTER TABLE crm_deals ADD COLUMN service_type TEXT;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='crm_deals' AND column_name='product') THEN
            ALTER TABLE crm_deals ADD COLUMN product TEXT;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='crm_deals' AND column_name='history_logs') THEN
            ALTER TABLE crm_deals ADD COLUMN history_logs JSONB DEFAULT '[]';
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='crm_deals' AND column_name='reminders') THEN
            ALTER TABLE crm_deals ADD COLUMN reminders JSONB DEFAULT '[]';
          END IF;

          -- Migration for crm_stages table
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='crm_stages' AND column_name='is_won') THEN
            ALTER TABLE crm_stages ADD COLUMN is_won BOOLEAN DEFAULT FALSE;
          END IF;

          -- Add unique constraint if not exists
          -- crm_leads cleanup and unique constraint
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc 
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name 
            WHERE tc.table_name = 'crm_leads' AND kcu.column_name = 'email' AND tc.constraint_type = 'UNIQUE'
          ) THEN
            DELETE FROM crm_leads a USING crm_leads b WHERE a.id < b.id AND a.email = b.email AND a.email IS NOT NULL;
            ALTER TABLE crm_leads ADD CONSTRAINT crm_leads_email_unique UNIQUE (email);
          END IF;

          -- crm_customers cleanup and unique email
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc 
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name 
            WHERE tc.table_name = 'crm_customers' AND kcu.column_name = 'email' AND tc.constraint_type = 'UNIQUE'
          ) THEN
            DELETE FROM crm_customers a USING crm_customers b WHERE a.id < b.id AND a.email = b.email AND a.email IS NOT NULL;
            ALTER TABLE crm_customers ADD CONSTRAINT crm_customers_email_unique UNIQUE (email);
          END IF;

          -- products cleanup and unique name
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc 
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name 
            WHERE tc.table_name = 'products' AND kcu.column_name = 'name' AND tc.constraint_type = 'UNIQUE'
          ) THEN
            DELETE FROM products a USING products b WHERE a.id < b.id AND a.name = b.name;
            ALTER TABLE products ADD CONSTRAINT products_name_unique UNIQUE (name);
          END IF;
        END $$;

        CREATE TABLE IF NOT EXISTS orders (
          id SERIAL PRIMARY KEY,
          lead_id INTEGER REFERENCES crm_leads(id),
          total_amount REAL,
          status TEXT DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- SOP Module
        -- Table sops already created in Baseline, adding migrations if needed
        DO $$ 
        BEGIN 
          -- Check for missing columns in sops if any
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sops' AND column_name='approver_id') THEN
            ALTER TABLE sops ADD COLUMN approver_id INTEGER REFERENCES users(id);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sops' AND column_name='roles_responsibilities') THEN
            ALTER TABLE sops ADD COLUMN roles_responsibilities TEXT;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sops' AND column_name='required_documentation') THEN
            ALTER TABLE sops ADD COLUMN required_documentation TEXT;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sops' AND column_name='reporting_line') THEN
            ALTER TABLE sops ADD COLUMN reporting_line TEXT;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sops' AND column_name='tools_channels_used') THEN
            ALTER TABLE sops ADD COLUMN tools_channels_used TEXT;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sops' AND column_name='kpis') THEN
            ALTER TABLE sops ADD COLUMN kpis TEXT;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sops' AND column_name='flowchart_data') THEN
            ALTER TABLE sops ADD COLUMN flowchart_data TEXT;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sops' AND column_name='tags') THEN
            ALTER TABLE sops ADD COLUMN tags TEXT;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sops' AND column_name='parent_id') THEN
            ALTER TABLE sops ADD COLUMN parent_id INTEGER REFERENCES sops(id);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sops' AND column_name='review_date') THEN
            ALTER TABLE sops ADD COLUMN review_date TIMESTAMP;
          END IF;
        END $$;

        -- Migration for departments table
        DO $$ 
        BEGIN 
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='departments' AND column_name='description') THEN
            ALTER TABLE departments ADD COLUMN description TEXT;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='departments' AND column_name='department_head_id') THEN
            ALTER TABLE departments ADD COLUMN department_head_id INTEGER;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='departments' AND column_name='teams') THEN
            ALTER TABLE departments ADD COLUMN teams JSONB DEFAULT '[]';
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='departments' AND column_name='job_titles') THEN
            ALTER TABLE departments ADD COLUMN job_titles JSONB DEFAULT '[]';
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='departments' AND column_name='company_id') THEN
            ALTER TABLE departments ADD COLUMN company_id INTEGER DEFAULT 1;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='departments' AND column_name='is_executive') THEN
            ALTER TABLE departments ADD COLUMN is_executive BOOLEAN DEFAULT false;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='departments' AND column_name='updated_at') THEN
            ALTER TABLE departments ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='departments' AND column_name='created_at') THEN
            ALTER TABLE departments ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
          END IF;
        END $$;

        -- Automated Department Deduplication (Cleans up any duplicate Executive Leadership or other departments)
        DO $$ 
        DECLARE
          dup RECORD;
          canonical_id INTEGER;
        BEGIN
          FOR dup IN 
            SELECT MIN(id) as keep_id, ARRAY_AGG(id) as all_ids, LOWER(TRIM(name)) as dept_name, COALESCE(company_id, 1) as comp_id
            FROM departments 
            GROUP BY COALESCE(company_id, 1), LOWER(TRIM(name))
            HAVING count(*) > 1
          LOOP
            canonical_id := dup.keep_id;
            
            -- Merge / Preserve Executive flags or descriptions if available
            UPDATE departments SET 
              is_executive = true,
              teams = CASE WHEN teams IS NULL OR teams = '[]'::jsonb THEN '["Executive Board & Corporate Governance"]'::jsonb ELSE teams END,
              job_titles = CASE WHEN job_titles IS NULL OR job_titles = '[]'::jsonb THEN '["Chief Executive Officer (CEO)"]'::jsonb ELSE job_titles END
            WHERE id = canonical_id AND (LOWER(TRIM(name)) LIKE '%executive leadership%' OR LOWER(TRIM(name)) LIKE '%إدارة تنفيذية%');

            -- Re-link all referencing tables to canonical ID
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='department_id') THEN
              UPDATE users SET department_id = canonical_id WHERE department_id = ANY(dup.all_ids) AND department_id != canonical_id;
            END IF;
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sops') THEN
              UPDATE sops SET department_id = canonical_id WHERE department_id = ANY(dup.all_ids) AND department_id != canonical_id;
            END IF;
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kpis') THEN
              UPDATE kpis SET department_id = canonical_id WHERE department_id = ANY(dup.all_ids) AND department_id != canonical_id;
            END IF;
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'training_courses') THEN
              UPDATE training_courses SET department_id = canonical_id WHERE department_id = ANY(dup.all_ids) AND department_id != canonical_id;
            END IF;
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'training_quizzes') THEN
              UPDATE training_quizzes SET department_id = canonical_id WHERE department_id = ANY(dup.all_ids) AND department_id != canonical_id;
            END IF;
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'risks') THEN
              UPDATE risks SET department_id = canonical_id WHERE department_id = ANY(dup.all_ids) AND department_id != canonical_id;
            END IF;
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'kaizen_suggestions') THEN
              UPDATE kaizen_suggestions SET department_id = canonical_id WHERE department_id = ANY(dup.all_ids) AND department_id != canonical_id;
            END IF;
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'performance_reviews') THEN
              UPDATE performance_reviews SET department_id = canonical_id WHERE department_id = ANY(dup.all_ids) AND department_id != canonical_id;
            END IF;
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'job_openings') THEN
              UPDATE job_openings SET department_id = canonical_id WHERE department_id = ANY(dup.all_ids) AND department_id != canonical_id;
            END IF;
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_customers') THEN
              UPDATE crm_customers SET department_id = canonical_id WHERE department_id = ANY(dup.all_ids) AND department_id != canonical_id;
            END IF;

            -- Delete all duplicate records
            DELETE FROM departments WHERE id = ANY(dup.all_ids) AND id != canonical_id;
          END LOOP;
        END $$;

        -- Create unique index to permanently prevent duplicate department names per company
        CREATE UNIQUE INDEX IF NOT EXISTS idx_departments_unique_company_name 
        ON departments (COALESCE(company_id, 1), LOWER(TRIM(name)));

        -- Migration for roles table
        DO $$ 
        BEGIN 
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='roles' AND column_name='created_at') THEN
            ALTER TABLE roles ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
          END IF;
        END $$;
      `);
      console.log("✅ User, Role, and SOP migrations completed.");
    } catch (e) {
      console.error("❌ Error during intermediate migrations:", e);
    }


      console.log("🛠️ Creating Automation and Chat tables...");
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS automation_rules (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            trigger_type TEXT NOT NULL,
            conditions JSONB DEFAULT '[]',
            actions JSONB DEFAULT '[]',
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS automation_logs (
            id SERIAL PRIMARY KEY,
            rule_id INTEGER REFERENCES automation_rules(id) ON DELETE CASCADE,
            trigger_data JSONB,
            execution_status TEXT, -- success, failed
            error_message TEXT,
            executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS internal_messages (
            id SERIAL PRIMARY KEY,
            sender_id INTEGER REFERENCES users(id),
            receiver_id INTEGER REFERENCES users(id),
            subject TEXT,
            content TEXT NOT NULL,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
        console.log("✅ Automation & Chat tables created.");
      } catch (e) {
        console.error("❌ Error creating Automation/Chat tables:", e);
      }

      console.log("🛠️ Creating SOP & Task tables...");
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS sops (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            department_id INTEGER REFERENCES departments(id),
            process_type TEXT,
            version_number TEXT DEFAULT '1.0',
            status TEXT DEFAULT 'Draft', -- Draft, Pending Approval, Published, Archived
            owner_id INTEGER REFERENCES users(id),
            approver_id INTEGER REFERENCES users(id),
            objective TEXT,
            scope TEXT,
            roles_responsibilities TEXT,
            required_documentation TEXT,
            reporting_line TEXT,
            tools_channels_used TEXT,
            kpis TEXT,
            flowchart_data TEXT,
            tags TEXT,
            parent_id INTEGER REFERENCES sops(id),
            review_date TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS sop_steps (
            id SERIAL PRIMARY KEY,
            sop_id INTEGER REFERENCES sops(id) ON DELETE CASCADE,
            step_number INTEGER NOT NULL,
            step_description TEXT NOT NULL,
            attachment_url TEXT,
            required_course_id INTEGER, -- Link to training course for proctoring
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          DO $$ 
          BEGIN 
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sop_steps' AND column_name='expected_result') THEN
              ALTER TABLE sop_steps ADD COLUMN expected_result TEXT;
            END IF;
          END $$;

          CREATE TABLE IF NOT EXISTS tasks (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT DEFAULT 'pending',
            priority TEXT DEFAULT 'medium',
            due_date TIMESTAMP,
            assigned_to INTEGER REFERENCES users(id),
            sop_step_id INTEGER REFERENCES sop_steps(id) ON DELETE SET NULL,
            deal_id INTEGER REFERENCES crm_deals(id) ON DELETE SET NULL,
            module_id TEXT,
            related_id INTEGER,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          -- Migration for tasks table
          DO $$ 
          BEGIN 
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='sop_step_id') THEN
              ALTER TABLE tasks ADD COLUMN sop_step_id INTEGER REFERENCES sop_steps(id) ON DELETE SET NULL;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='deal_id') THEN
              ALTER TABLE tasks ADD COLUMN deal_id INTEGER REFERENCES crm_deals(id) ON DELETE SET NULL;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='module_id') THEN
              ALTER TABLE tasks ADD COLUMN module_id TEXT;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='related_id') THEN
              ALTER TABLE tasks ADD COLUMN related_id INTEGER;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='updated_at') THEN
              ALTER TABLE tasks ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
            END IF;
          END $$;

          CREATE TABLE IF NOT EXISTS task_checklists (
            id SERIAL PRIMARY KEY,
            task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            is_completed BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
        console.log("✅ SOP & Task tables created.");
      } catch (e) { console.error("❌ Error creating SOP/Task tables:", e); }

      console.log("🛠️ Creating Knowledge Base tables...");
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS article_categories (
            id SERIAL PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            department_id INTEGER REFERENCES departments(id),
            parent_id INTEGER REFERENCES article_categories(id)
          );

          CREATE TABLE IF NOT EXISTS knowledge_articles (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT,
            category_id INTEGER REFERENCES article_categories(id),
            author_id INTEGER REFERENCES users(id),
            approver_id INTEGER REFERENCES users(id),
            status TEXT DEFAULT 'Draft',
            content_type TEXT DEFAULT 'Article',
            external_url TEXT,
            tags TEXT,
            attachments TEXT, -- JSON array of URLs
            related_sop_id INTEGER REFERENCES sops(id),
            helpful_count INTEGER DEFAULT 0,
            not_helpful_count INTEGER DEFAULT 0,
            view_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS knowledge_article_revisions (
            id SERIAL PRIMARY KEY,
            article_id INTEGER REFERENCES knowledge_articles(id) ON DELETE CASCADE,
            version_number INTEGER NOT NULL,
            content TEXT,
            change_summary TEXT,
            updated_by INTEGER REFERENCES users(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          -- Migration for article_categories
          DO $$ 
          BEGIN 
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='article_categories' AND column_name='description') THEN
              ALTER TABLE article_categories ADD COLUMN description TEXT;
            END IF;
          END $$;

          -- Migration for knowledge_articles to add visible_departments
          DO $$
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='knowledge_articles' AND column_name='visible_departments') THEN
              ALTER TABLE knowledge_articles ADD COLUMN visible_departments TEXT DEFAULT '[]';
            END IF;
          END $$;

          -- Migration for knowledge_articles to add product_id
          DO $$
          BEGIN
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='knowledge_articles' AND column_name='product_id') THEN
              ALTER TABLE knowledge_articles ADD COLUMN product_id INTEGER;
            END IF;
          END $$;
        `);
        console.log("✅ KB tables created.");
      } catch (e) { console.error("❌ Error creating KB tables:", e); }

      console.log("🛠️ Creating Risk & QA tables...");
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS risk_log (
            id SERIAL PRIMARY KEY,
            description TEXT NOT NULL,
            probability TEXT,
            impact TEXT,
            mitigation_plan TEXT,
            owner_id INTEGER REFERENCES users(id),
            status TEXT DEFAULT 'open',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS qa_forms (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            department_id INTEGER REFERENCES departments(id),
            items JSONB DEFAULT '[]', -- Array of { id, text, max_score }
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS qa_evaluations (
            id SERIAL PRIMARY KEY,
            form_id INTEGER REFERENCES qa_forms(id) ON DELETE CASCADE,
            reviewer_id INTEGER REFERENCES users(id),
            employee_id INTEGER REFERENCES users(id),
            process_name TEXT,
            department_id INTEGER REFERENCES departments(id),
            interaction_id INTEGER REFERENCES crm_interactions(id), -- Link to CRM/Chat
            scores JSONB DEFAULT '{}', -- { item_id: score }
            total_score REAL,
            comments TEXT,
            status TEXT DEFAULT 'completed',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
        console.log("✅ Risk & QA tables created.");
      } catch (e) { console.error("❌ Error creating Risk/QA tables:", e); }

      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS qa_ncr (
            id SERIAL PRIMARY KEY,
            evaluation_id INTEGER REFERENCES qa_evaluations(id) ON DELETE SET NULL,
            description TEXT NOT NULL,
            severity TEXT DEFAULT 'medium', -- low, medium, high, critical
            reported_by INTEGER REFERENCES users(id),
            assigned_to INTEGER REFERENCES users(id),
            status TEXT DEFAULT 'open', -- open, investigating, resolved, closed
            risk_id INTEGER REFERENCES risk_log(id), -- Link to Risk Register
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS qa_capa (
            id SERIAL PRIMARY KEY,
            ncr_id INTEGER REFERENCES qa_ncr(id) ON DELETE SET NULL,
            title TEXT NOT NULL,
            department_id INTEGER REFERENCES departments(id),
            root_cause TEXT NOT NULL,
            action_plan TEXT NOT NULL,
            assigned_to INTEGER REFERENCES users(id),
            status TEXT DEFAULT 'open', -- open, in_progress, verified, closed
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          -- Transactions Audit Tables
          CREATE TABLE IF NOT EXISTS qa_transaction_audits (
            id SERIAL PRIMARY KEY,
            type TEXT NOT NULL, -- 'complaint', 'delay', 'refund', 'cancellation'
            transaction_id TEXT NOT NULL,
            qa_reference_number TEXT,
            handled_by TEXT,
            agent_name TEXT,
            customer_name TEXT,
            order_amount NUMERIC DEFAULT 0,
            order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            sla_status TEXT DEFAULT 'Met SLA',
            auditor_name TEXT,
            qa_status TEXT DEFAULT 'Pass',
            department TEXT DEFAULT 'Operations',
            root_cause TEXT,
            sub_reason TEXT,
            error_classification TEXT,
            switches JSONB DEFAULT '{}',
            refund_amount NUMERIC DEFAULT 0,
            corrective_action TEXT,
            manager_approval TEXT DEFAULT 'Pending',
            assigned_manager TEXT,
            current_step INTEGER DEFAULT 1,
            workflow_status TEXT DEFAULT 'Under Review',
            details JSONB DEFAULT '{}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS qa_root_cause_presets (
            id SERIAL PRIMARY KEY,
            type TEXT NOT NULL, -- 'complaint', 'delay', 'refund', 'cancellation'
            department TEXT NOT NULL,
            root_cause_name TEXT NOT NULL,
            weight NUMERIC DEFAULT 100,
            sub_reasons JSONB DEFAULT '[]',
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          ALTER TABLE qa_root_cause_presets ADD COLUMN IF NOT EXISTS weight NUMERIC DEFAULT 100;

          CREATE TABLE IF NOT EXISTS qa_nps_feedbacks (
            id SERIAL PRIMARY KEY,
            transaction_id TEXT NOT NULL,
            customer_name TEXT NOT NULL,
            agent_name TEXT NOT NULL,
            rating INTEGER NOT NULL,
            category TEXT,
            feedback_text TEXT,
            delay_linked BOOLEAN DEFAULT FALSE,
            root_cause TEXT,
            corrective_action TEXT,
            status TEXT DEFAULT 'Reviewed',
            auditor_name TEXT DEFAULT 'Sarah Jenkins',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          ALTER TABLE qa_nps_feedbacks ADD COLUMN IF NOT EXISTS auditor_name TEXT DEFAULT 'Sarah Jenkins';

          -- QA Action Plans (Incident Audit & QA Stepper)
          CREATE TABLE IF NOT EXISTS qa_action_plans (
            id SERIAL PRIMARY KEY,
            plan_code TEXT NOT NULL,
            title TEXT NOT NULL,
            incident_type TEXT NOT NULL, -- 'complaint', 'delay', 'refund', 'cancellation', 'nps'
            transaction_id TEXT,
            audit_id INTEGER REFERENCES qa_transaction_audits(id) ON DELETE SET NULL,
            checklist_id INTEGER REFERENCES qa_root_cause_presets(id) ON DELETE SET NULL,
            customer_name TEXT,
            agent_name TEXT,
            department TEXT DEFAULT 'Operations',
            severity TEXT DEFAULT 'Medium', -- 'Low', 'Medium', 'High', 'Critical'
            status TEXT DEFAULT 'Open', -- 'Draft', 'Root Cause Analysis', 'In Progress', 'Verification', 'Closed'
            current_step INTEGER DEFAULT 1, -- 1: Detection, 2: Root Cause, 3: Action Rules, 4: Action Details & Tasks, 5: Verification & Closure
            root_cause_category TEXT,
            root_cause_name TEXT,
            root_cause_analysis TEXT,
            five_whys JSONB DEFAULT '[]',
            action_rules JSONB DEFAULT '[]',
            action_details JSONB DEFAULT '[]',
            verification_notes TEXT,
            verified_by TEXT,
            verified_at TIMESTAMP,
            effectiveness_score INTEGER DEFAULT 100,
            assigned_to TEXT,
            target_completion_date DATE,
            created_by TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          ALTER TABLE qa_action_plans ADD COLUMN IF NOT EXISTS action_plan_type TEXT DEFAULT 'Quality Action';
          ALTER TABLE qa_action_plans ADD COLUMN IF NOT EXISTS agent_id TEXT;
          ALTER TABLE qa_action_plans ADD COLUMN IF NOT EXISTS owner_id TEXT;
          ALTER TABLE qa_action_plans ADD COLUMN IF NOT EXISTS reviewer_id TEXT;
          ALTER TABLE qa_transaction_audits ADD COLUMN IF NOT EXISTS action_plan_required BOOLEAN DEFAULT FALSE;
          ALTER TABLE qa_transaction_audits ADD COLUMN IF NOT EXISTS action_plan_type TEXT DEFAULT 'Training Action';
          ALTER TABLE qa_transaction_audits ADD COLUMN IF NOT EXISTS customer_phone TEXT;
          ALTER TABLE qa_transaction_audits ADD COLUMN IF NOT EXISTS owner TEXT;
          ALTER TABLE qa_transaction_audits ADD COLUMN IF NOT EXISTS operations_owner TEXT;
          ALTER TABLE qa_transaction_audits ADD COLUMN IF NOT EXISTS comment TEXT;
          ALTER TABLE qa_transaction_audits ADD COLUMN IF NOT EXISTS status_on_system TEXT;
          ALTER TABLE qa_transaction_audits ADD COLUMN IF NOT EXISTS system_remarks TEXT;
          ALTER TABLE qa_transaction_audits ADD COLUMN IF NOT EXISTS rating NUMERIC;
          ALTER TABLE qa_transaction_audits ADD COLUMN IF NOT EXISTS category TEXT;
          ALTER TABLE qa_transaction_audits ADD COLUMN IF NOT EXISTS bucket_1_category TEXT;
          ALTER TABLE qa_transaction_audits ADD COLUMN IF NOT EXISTS bucket_2_area TEXT;
          ALTER TABLE qa_transaction_audits ADD COLUMN IF NOT EXISTS bucket_3_root_cause TEXT;
          ALTER TABLE qa_transaction_audits ADD COLUMN IF NOT EXISTS other_reason TEXT;
          ALTER TABLE qa_transaction_audits ADD COLUMN IF NOT EXISTS manager_notes TEXT;
          ALTER TABLE qa_transaction_audits ADD COLUMN IF NOT EXISTS request_type TEXT;
          ALTER TABLE qa_transaction_audits ADD COLUMN IF NOT EXISTS request_sub_type TEXT;
          ALTER TABLE qa_transaction_audits ADD COLUMN IF NOT EXISTS request_date TIMESTAMP;
          ALTER TABLE qa_transaction_audits ADD COLUMN IF NOT EXISTS operations_status TEXT;
          ALTER TABLE qa_transaction_audits ADD COLUMN IF NOT EXISTS operation_owner TEXT;
          ALTER TABLE qa_transaction_audits ADD COLUMN IF NOT EXISTS survey_date TIMESTAMP;
          ALTER TABLE qa_transaction_audits ADD COLUMN IF NOT EXISTS refund_reason TEXT;
          ALTER TABLE qa_transaction_audits ADD COLUMN IF NOT EXISTS refund_sub_reason TEXT;
          ALTER TABLE qa_transaction_audits ADD COLUMN IF NOT EXISTS complaint_reason TEXT;
          ALTER TABLE qa_transaction_audits ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
          ALTER TABLE qa_transaction_audits ADD COLUMN IF NOT EXISTS delay_reason TEXT;
          ALTER TABLE qa_transaction_audits ADD COLUMN IF NOT EXISTS channel TEXT;
          ALTER TABLE qa_transaction_audits ADD COLUMN IF NOT EXISTS priority TEXT;
          ALTER TABLE qa_transaction_audits ADD COLUMN IF NOT EXISTS lose_on_employee BOOLEAN DEFAULT FALSE;
          ALTER TABLE qa_transaction_audits ADD COLUMN IF NOT EXISTS lose_employee_id TEXT;
          ALTER TABLE qa_transaction_audits ADD COLUMN IF NOT EXISTS lose_employee_name TEXT;
          ALTER TABLE qa_transaction_audits ADD COLUMN IF NOT EXISTS lose_status TEXT DEFAULT 'Accepted';
          ALTER TABLE qa_transaction_audits ADD COLUMN IF NOT EXISTS lose_amount NUMERIC DEFAULT 0;
          ALTER TABLE qa_transaction_audits ADD COLUMN IF NOT EXISTS action_required TEXT;
          ALTER TABLE qa_transaction_audits ADD COLUMN IF NOT EXISTS qa_reference_number TEXT;
          ALTER TABLE qa_transaction_audits ADD COLUMN IF NOT EXISTS handled_by TEXT;
          ALTER TABLE qa_transaction_audits ADD COLUMN IF NOT EXISTS agent_id TEXT;
          ALTER TABLE qa_transaction_audits ADD COLUMN IF NOT EXISTS auditor_id TEXT;
          ALTER TABLE qa_transaction_audits ADD COLUMN IF NOT EXISTS reviewer_id TEXT;
          ALTER TABLE qa_transaction_audits ADD COLUMN IF NOT EXISTS owner_id TEXT;
          ALTER TABLE qa_transaction_audits ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
          ALTER TABLE qa_transaction_audits ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
          
          -- Create view/alias qa_transactions_audit if not exists for Supabase & queries compatibility
          CREATE OR REPLACE VIEW qa_transactions_audit AS SELECT * FROM qa_transaction_audits;
          ALTER TABLE qa_nps_feedbacks ADD COLUMN IF NOT EXISTS qa_reference_number TEXT;
          ALTER TABLE qa_nps_feedbacks ADD COLUMN IF NOT EXISTS agent_id TEXT;
          ALTER TABLE qa_nps_feedbacks ADD COLUMN IF NOT EXISTS survey_date TIMESTAMP WITH TIME ZONE;
          ALTER TABLE qa_nps_feedbacks ADD COLUMN IF NOT EXISTS date TIMESTAMP WITH TIME ZONE;
          ALTER TABLE qa_nps_feedbacks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
          ALTER TABLE qa_nps_feedbacks ADD COLUMN IF NOT EXISTS comment TEXT;
          ALTER TABLE qa_nps_feedbacks ADD COLUMN IF NOT EXISTS owner TEXT;
          ALTER TABLE qa_nps_feedbacks ADD COLUMN IF NOT EXISTS operations_owner TEXT;
          ALTER TABLE qa_nps_feedbacks ADD COLUMN IF NOT EXISTS owner_id TEXT;
          ALTER TABLE qa_nps_feedbacks ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb;

          GRANT ALL ON TABLE public.qa_nps_feedbacks TO postgres;
          GRANT ALL ON TABLE public.qa_nps_feedbacks TO service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.qa_nps_feedbacks TO authenticated;

          GRANT ALL ON TABLE public.qa_transaction_audits TO postgres;
          GRANT ALL ON TABLE public.qa_transaction_audits TO service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.qa_transaction_audits TO authenticated;

          ALTER TABLE qa_action_plans ADD COLUMN IF NOT EXISTS discovered_date DATE;

          -- Automatically populate existing audits with unique QA reference numbers if empty
          UPDATE qa_transaction_audits 
          SET qa_reference_number = CONCAT('QA-', UPPER(SUBSTRING(COALESCE(type, 'AUD') FROM 1 FOR 3)), '-', LPAD(id::text, 6, '0'))
          WHERE qa_reference_number IS NULL OR qa_reference_number = '';

          UPDATE qa_nps_feedbacks 
          SET qa_reference_number = CONCAT('QA-NPS-', LPAD(id::text, 6, '0'))
          WHERE qa_reference_number IS NULL OR qa_reference_number = '';

          -- QA Action Required Options Preset Catalog
          CREATE TABLE IF NOT EXISTS qa_action_options (
            id SERIAL PRIMARY KEY,
            action_name TEXT NOT NULL UNIQUE,
            category TEXT DEFAULT 'General',
            description TEXT,
            auto_plan_type TEXT DEFAULT 'Quality Action',
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          -- QA Action Rules Engine
          CREATE TABLE IF NOT EXISTS qa_action_rules (
            id SERIAL PRIMARY KEY,
            rule_name TEXT NOT NULL,
            incident_type TEXT NOT NULL DEFAULT 'all', -- 'all', 'complaint', 'delay', 'refund', 'cancellation', 'nps'
            trigger_condition TEXT NOT NULL,
            severity_level TEXT DEFAULT 'Medium',
            assigned_department TEXT,
            assigned_role TEXT,
            sla_hours INTEGER DEFAULT 24,
            default_root_cause TEXT,
            auto_actions JSONB DEFAULT '[]',
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );

          GRANT ALL ON TABLE qa_action_plans TO postgres;
          GRANT ALL ON TABLE qa_action_plans TO service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE qa_action_plans TO authenticated;

          GRANT ALL ON TABLE qa_action_rules TO postgres;
          GRANT ALL ON TABLE qa_action_rules TO service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE qa_action_rules TO authenticated;

          GRANT ALL ON TABLE qa_action_options TO postgres;
          GRANT ALL ON TABLE qa_action_options TO service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE qa_action_options TO authenticated;

          -- QA Employee Recommendations
          CREATE TABLE IF NOT EXISTS qa_employee_recommendations (
            id SERIAL PRIMARY KEY,
            employee_id INTEGER,
            employee_name TEXT,
            department TEXT,
            author_name TEXT,
            title TEXT,
            content TEXT NOT NULL,
            priority TEXT DEFAULT 'Medium',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
          GRANT ALL ON TABLE qa_employee_recommendations TO postgres;
          GRANT ALL ON TABLE qa_employee_recommendations TO service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE qa_employee_recommendations TO authenticated;

          -- QA Field Options
          CREATE TABLE IF NOT EXISTS qa_field_options (
            id SERIAL PRIMARY KEY,
            field_key TEXT NOT NULL,
            option_value TEXT NOT NULL,
            option_label TEXT NOT NULL,
            is_default BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT qa_field_options_unique UNIQUE(field_key, option_value)
          );
          GRANT ALL ON TABLE qa_field_options TO postgres;
          GRANT ALL ON TABLE qa_field_options TO service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE qa_field_options TO authenticated;

          -- RACI Matrix
          CREATE TABLE IF NOT EXISTS raci_assignments (
            id SERIAL PRIMARY KEY,
            sop_id INTEGER REFERENCES sops(id) ON DELETE CASCADE,
            sop_step_id INTEGER REFERENCES sop_steps(id) ON DELETE CASCADE,
            role_type TEXT NOT NULL, -- 'R', 'A', 'C', 'I'
            user_id INTEGER REFERENCES users(id),
            role_id INTEGER REFERENCES roles(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT one_accountable_per_entity CHECK (role_type != 'A' OR (sop_id IS NOT NULL OR sop_step_id IS NOT NULL))
          );
        `);
        console.log("✅ NCR & RACI tables created.");
      } catch (e) {
        console.error("❌ Error creating NCR/RACI tables:", e);
      }

      console.log("🛠️ Creating HR Management tables...");
      try {
        await client.query(`
          -- Employee specific details (Extension of users)
          CREATE TABLE IF NOT EXISTS hr_employees (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
            company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
            id_number TEXT,
            phone TEXT,
            salary_base REAL DEFAULT 0,
            allowances REAL DEFAULT 0,
            contract_type TEXT DEFAULT 'Full-time',
            contract_start_date DATE,
            contract_end_date DATE,
            vacation_balance REAL DEFAULT 21,
            sick_leave_balance REAL DEFAULT 7,
            bereavement_used REAL DEFAULT 0,
            documents JSONB DEFAULT '[]',
            penalty_history JSONB DEFAULT '[]',
            personal_info JSONB DEFAULT '{}',
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS personal_info JSONB DEFAULT '{}';

          -- Attendance Records
          CREATE TABLE IF NOT EXISTS hr_attendance (
            id SERIAL PRIMARY KEY,
            company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            date DATE NOT NULL,
            clock_in TIMESTAMP,
            clock_out TIMESTAMP,
            status TEXT DEFAULT 'Present', -- Present, Absent, Late, Half-Day, On Leave
            shift_name TEXT,
            late_minutes INTEGER DEFAULT 0,
            worked_hours NUMERIC(10,2) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, date)
          );

          ALTER TABLE hr_attendance ADD COLUMN IF NOT EXISTS late_minutes INTEGER DEFAULT 0;
          ALTER TABLE hr_attendance ADD COLUMN IF NOT EXISTS worked_hours NUMERIC(10,2) DEFAULT 0;
          ALTER TABLE hr_attendance ALTER COLUMN worked_hours TYPE NUMERIC(10,2) USING worked_hours::NUMERIC(10,2);
          ALTER TABLE hr_attendance ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

          -- 12.1 Biometric Devices (ZKTeco K14 Pro & Hardware Integration)
          CREATE TABLE IF NOT EXISTS hr_biometric_devices (
            id SERIAL PRIMARY KEY,
            company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
            device_name TEXT NOT NULL,
            serial_number TEXT,
            model TEXT,
            mac_address TEXT,
            ip_address TEXT,
            port INTEGER DEFAULT 4370,
            comm_key TEXT DEFAULT '0',
            firmware_platform TEXT,
            fingerprint_algorithm TEXT,
            manufacturer TEXT,
            connection_mode TEXT DEFAULT 'lan_bridge',
            status TEXT DEFAULT 'offline',
            last_seen_at TIMESTAMP,
            last_sync_at TIMESTAMP,
            punches_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS hr_biometric_punches (
            id SERIAL PRIMARY KEY,
            company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
            device_sn TEXT,
            device_id INTEGER REFERENCES hr_biometric_devices(id) ON DELETE SET NULL,
            user_pin TEXT NOT NULL,
            punch_time TIMESTAMP NOT NULL,
            punch_type INTEGER DEFAULT 0,
            verify_type INTEGER DEFAULT 1,
            matched_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            sync_status TEXT DEFAULT 'processed',
            raw_line TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          -- Seed User's Physical ZKTeco K14 Pro Device
          INSERT INTO hr_biometric_devices (
            company_id, device_name, serial_number, model, mac_address, ip_address, port, comm_key,
            firmware_platform, fingerprint_algorithm, manufacturer, connection_mode, status
          )
          SELECT 1, 'K14 Pro (Office)', 'CJMS213560354', 'K14 Pro', '00:17:61:11:70:94', '192.168.110.201', 4370, '0',
                 'ZLM60_TFT', 'ZKFinger VX10.0', 'ZKTECO CO., LTD.', 'lan_bridge', 'offline'
          WHERE NOT EXISTS (
            SELECT 1 FROM hr_biometric_devices WHERE serial_number = 'CJMS213560354' OR ip_address = '192.168.110.201'
          );
          

          -- Leave Requests
          CREATE TABLE IF NOT EXISTS hr_leave_requests (
            id SERIAL PRIMARY KEY,
            company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            type TEXT NOT NULL, -- Annual, Sick, Unpaid, Maternity, Other
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            status TEXT DEFAULT 'Pending', -- Pending, Approved, Rejected
            reason TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          -- Payroll Records
          CREATE TABLE IF NOT EXISTS hr_payroll (
            id SERIAL PRIMARY KEY,
            company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            month INTEGER NOT NULL,
            year INTEGER NOT NULL,
            base_salary REAL NOT NULL,
            allowances REAL DEFAULT 0,
            deductions REAL DEFAULT 0,
            bonuses REAL DEFAULT 0,
            commissions REAL DEFAULT 0,
            total_net REAL NOT NULL,
            breakdown JSONB DEFAULT '{}',
            status TEXT DEFAULT 'Draft', -- Draft, Paid
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, month, year)
          );

          -- Performance Reviews
          CREATE TABLE IF NOT EXISTS hr_performance_reviews (
            id SERIAL PRIMARY KEY,
            company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            reviewer_id INTEGER REFERENCES users(id),
            period TEXT NOT NULL, -- Month/Quarter/Year
            score REAL DEFAULT 0,
            productivity_rate REAL DEFAULT 0,
            strengths TEXT,
            areas_for_improvement TEXT,
            status TEXT DEFAULT 'Draft', -- Draft, Finalized
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          -- Performance Frameworks
          CREATE TABLE IF NOT EXISTS hr_performance_frameworks (
            id SERIAL PRIMARY KEY,
            company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
            code VARCHAR(50) NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            default_weights JSONB DEFAULT '{}',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(company_id, code)
          );

          -- Performance Settings & Evaluation Rules
          CREATE TABLE IF NOT EXISTS hr_performance_settings (
            id SERIAL PRIMARY KEY,
            company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
            department_id INTEGER REFERENCES departments(id) ON DELETE CASCADE,
            team_name TEXT,
            job_title TEXT,
            framework_code TEXT NOT NULL DEFAULT 'hybrid',
            evaluation_weights JSONB DEFAULT '{"manager": 40, "peers": 20, "subordinates": 10, "self": 10, "okrs": 20}',
            cycle_frequency TEXT NOT NULL DEFAULT 'Quarterly',
            enable_self_appraisal BOOLEAN DEFAULT TRUE,
            approval_workflow JSONB DEFAULT '["Direct Manager", "Department Head", "HR"]',
            competencies JSONB DEFAULT '["Leadership & Initiative", "Communication & Impact", "Teamwork & Collaboration", "Problem Solving & Innovation"]',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
        console.log("✅ HR Management tables created.");
        
        // Migrate columns if table already exists
        await client.query(`
          ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id TEXT;
          ALTER TABLE users ADD COLUMN IF NOT EXISTS extension_number TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS id_number TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS employee_id TEXT;
          ALTER TABLE hr_employees ALTER COLUMN user_id DROP NOT NULL;
          ALTER TABLE hr_attendance ADD COLUMN IF NOT EXISTS employee_id TEXT;
          ALTER TABLE hr_attendance ALTER COLUMN user_id DROP NOT NULL;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS phone TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS contract_start_date DATE;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS contract_end_date DATE;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS vacation_balance REAL DEFAULT 21;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS sick_leave_balance REAL DEFAULT 7;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS bereavement_used REAL DEFAULT 0;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]';
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS penalty_history JSONB DEFAULT '[]';
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS job_informations JSONB DEFAULT '[]';
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS compensations JSONB DEFAULT '[]';
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS bonuses_list JSONB DEFAULT '[]';
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS commissions_list JSONB DEFAULT '[]';
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS equities_list JSONB DEFAULT '[]';
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS shift_allowances_list JSONB DEFAULT '[]';
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS potential_bonus JSONB DEFAULT '{}';
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS employment_statuses JSONB DEFAULT '[]';
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS attendance_method TEXT DEFAULT 'Login System';
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS assigned_shift_id INTEGER;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS reporting_to INTEGER REFERENCES users(id);
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS job_title TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS department_id INTEGER;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS gender TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS nationality TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS marital_status TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS date_of_birth DATE;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS address TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS work_location TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS job_grade TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS assets_list JSONB DEFAULT '[]';
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS benefits_info JSONB DEFAULT '{}';
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS onboarding_tasks JSONB DEFAULT '[]';
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS offboarding_tasks JSONB DEFAULT '[]';
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS system_logins JSONB DEFAULT '[]';
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS first_name TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS middle_name TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS last_name TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS preferred_name TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS personal_email TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS work_email TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS mobile_phone TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS home_phone TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS street_1 TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS street_2 TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS city TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS county TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS country TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS postcode TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS national_id TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS passport_number TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS shirt_size TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS bank_name TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS account_number TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS iban TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS swift_code TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS bank_details_copy TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS emergency_contact_relation TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS emergency_contact_address TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS team_name TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS manager_name TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS potential_bonus_percent REAL DEFAULT 0;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS potential_bonus_amount REAL DEFAULT 0;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS kpi_amount REAL DEFAULT 0;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS kpi_frequency TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS kpi_payout_mechanism TEXT;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS kpi_payout_date DATE;
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS trainings_list JSONB DEFAULT '[]';
          ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS notes_list JSONB DEFAULT '[]';

          -- Sub-tables column migrations
          ALTER TABLE hr_employee_documents ADD COLUMN IF NOT EXISTS folder TEXT DEFAULT 'Employee Uploads';
          ALTER TABLE hr_employee_documents ADD COLUMN IF NOT EXISTS size TEXT;
          ALTER TABLE hr_employee_documents ADD COLUMN IF NOT EXISTS file_url TEXT;
          ALTER TABLE hr_employee_documents ADD COLUMN IF NOT EXISTS document_name TEXT;
          ALTER TABLE hr_employee_documents ADD COLUMN IF NOT EXISTS document_type TEXT;
          ALTER TABLE hr_employee_documents ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';
          ALTER TABLE hr_employee_documents ADD COLUMN IF NOT EXISTS notes TEXT;
          ALTER TABLE hr_employee_documents ADD COLUMN IF NOT EXISTS expiry_date DATE;
          ALTER TABLE hr_employee_documents ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

          ALTER TABLE hr_employee_system_logins ADD COLUMN IF NOT EXISTS url TEXT;
          ALTER TABLE hr_employee_system_logins ADD COLUMN IF NOT EXISTS email TEXT;
          ALTER TABLE hr_employee_system_logins ADD COLUMN IF NOT EXISTS password TEXT;
          ALTER TABLE hr_employee_system_logins ADD COLUMN IF NOT EXISTS extensions TEXT;

          ALTER TABLE hr_employee_dependents ADD COLUMN IF NOT EXISTS name TEXT;
          ALTER TABLE hr_employee_dependents ADD COLUMN IF NOT EXISTS full_name TEXT;
          ALTER TABLE hr_employee_dependents ADD COLUMN IF NOT EXISTS relationship TEXT;
          ALTER TABLE hr_employee_dependents ADD COLUMN IF NOT EXISTS dob DATE;
          ALTER TABLE hr_employee_dependents ADD COLUMN IF NOT EXISTS date_of_birth DATE;
          ALTER TABLE hr_employee_dependents ADD COLUMN IF NOT EXISTS gender TEXT;
          ALTER TABLE hr_employee_dependents ADD COLUMN IF NOT EXISTS national_id TEXT;
          ALTER TABLE hr_employee_dependents ADD COLUMN IF NOT EXISTS phone TEXT;
          ALTER TABLE hr_employee_dependents ADD COLUMN IF NOT EXISTS address TEXT;
          ALTER TABLE hr_employee_dependents ADD COLUMN IF NOT EXISTS notes TEXT;
        `);

        // Create relational sub-tables for employee profile tabs
        await client.query(`
          CREATE TABLE IF NOT EXISTS hr_employee_job_history (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            job_title TEXT,
            department_name TEXT,
            team_name TEXT,
            reporting_to TEXT,
            location TEXT,
            effective_date DATE,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS hr_employee_compensations (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            pay_rate REAL,
            pay_frequency TEXT,
            currency TEXT DEFAULT 'EGP',
            effective_date DATE,
            change_reason TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS hr_employee_bonuses (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            title TEXT,
            bonus_type TEXT,
            amount REAL,
            percent REAL,
            frequency TEXT,
            payout_date DATE,
            status TEXT DEFAULT 'Pending',
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS hr_employee_commissions (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            title TEXT,
            commission_rate REAL,
            target_amount REAL,
            payout_frequency TEXT,
            status TEXT DEFAULT 'Active',
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS hr_employee_equities (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            equity_type TEXT,
            total_units REAL,
            vesting_schedule TEXT,
            grant_date DATE,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS hr_employee_shift_allowances (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            allowance_type TEXT,
            rate REAL,
            frequency TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS hr_employee_employment_statuses (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            status TEXT,
            effective_date DATE,
            reason TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS hr_employee_penalties (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            penalty_type TEXT,
            reason TEXT,
            amount REAL,
            date_issued DATE,
            status TEXT DEFAULT 'Active',
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS hr_employee_assets (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            category TEXT,
            description TEXT,
            serial_number TEXT,
            date_loaned DATE,
            date_returned DATE,
            status TEXT DEFAULT 'Loaned',
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS hr_employee_dependents (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            relationship TEXT NOT NULL,
            dob DATE,
            gender TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS hr_employee_benefit_history (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            benefit_name TEXT NOT NULL,
            change_type TEXT NOT NULL,
            effective_date DATE,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS hr_employee_onboarding_tasks (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            category TEXT,
            title TEXT NOT NULL,
            assignee TEXT,
            due_date DATE,
            completed BOOLEAN DEFAULT FALSE,
            completed_by TEXT,
            completed_date DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS hr_employee_offboarding_tasks (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            category TEXT,
            title TEXT NOT NULL,
            assignee TEXT,
            due_date DATE,
            completed BOOLEAN DEFAULT FALSE,
            completed_by TEXT,
            completed_date DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS hr_employee_trainings (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            course_name TEXT NOT NULL,
            provider TEXT,
            completion_date DATE,
            expiry_date DATE,
            score REAL,
            status TEXT DEFAULT 'Completed',
            certificate_url TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS hr_employee_documents (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            document_type TEXT,
            document_name TEXT NOT NULL,
            file_url TEXT,
            expiry_date DATE,
            status TEXT DEFAULT 'Active',
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS hr_employee_system_logins (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            system_name TEXT NOT NULL,
            username TEXT NOT NULL,
            role TEXT,
            access_level TEXT,
            status TEXT DEFAULT 'Active',
            last_login TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS hr_employee_notes (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            author_id INTEGER REFERENCES users(id),
            author_name TEXT,
            title TEXT,
            content TEXT NOT NULL,
            is_private BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);

        // Create hr_complaints table
        await client.query(`
          CREATE TABLE IF NOT EXISTS hr_complaints (
            id SERIAL PRIMARY KEY,
            company_id INTEGER DEFAULT 1,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            description TEXT NOT NULL,
            status TEXT DEFAULT 'Pending',
            admin_notes TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          GRANT ALL ON TABLE hr_complaints TO postgres;
          GRANT ALL ON TABLE hr_complaints TO service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE hr_complaints TO authenticated;

          CREATE TABLE IF NOT EXISTS hr_announcements (
            id SERIAL PRIMARY KEY,
            company_id INTEGER DEFAULT 1,
            author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            author_name TEXT NOT NULL,
            title TEXT NOT NULL,
            category TEXT DEFAULT 'Announcement',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS hr_recognitions (
            id SERIAL PRIMARY KEY,
            company_id INTEGER DEFAULT 1,
            sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            sender_name TEXT NOT NULL,
            recipient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            recipient_name TEXT NOT NULL,
            points INTEGER DEFAULT 25,
            message TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
        console.log("✅ HR Complaints, Announcements and Recognitions tables created.");

        // Create hr_payroll_config table
        await client.query(`
          CREATE TABLE IF NOT EXISTS hr_payroll_config (
            id SERIAL PRIMARY KEY,
            company_id INTEGER DEFAULT 1 UNIQUE,
            start_day INTEGER DEFAULT 1,
            late_deduction_per_hour REAL DEFAULT 0,
            absence_penalty_multiplier REAL DEFAULT 1.0,
            early_departure_deduction REAL DEFAULT 0,
            disciplinary_rules JSONB DEFAULT '[]'::jsonb,
            insurance_benefits JSONB DEFAULT '{}'::jsonb,
            tax_brackets JSONB DEFAULT '[]'::jsonb,
            tardy_deduction_rules JSONB DEFAULT '{}'::jsonb,
            leave_policy_defaults JSONB DEFAULT '{}'::jsonb,
            custom_rules JSONB DEFAULT '{}'::jsonb,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          ALTER TABLE hr_payroll_config ADD COLUMN IF NOT EXISTS tardy_deduction_rules JSONB DEFAULT '{}'::jsonb;
          ALTER TABLE hr_payroll_config ADD COLUMN IF NOT EXISTS leave_policy_defaults JSONB DEFAULT '{}'::jsonb;
          ALTER TABLE hr_payroll_config ADD COLUMN IF NOT EXISTS custom_rules JSONB DEFAULT '{}'::jsonb;

          GRANT ALL ON TABLE hr_payroll_config TO postgres;
          GRANT ALL ON TABLE hr_payroll_config TO service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE hr_payroll_config TO authenticated;
        `);

        // Seed default payroll config for company 1 if not exists
        await client.query(`
          INSERT INTO hr_payroll_config (company_id, start_day, late_deduction_per_hour, absence_penalty_multiplier, early_departure_deduction, disciplinary_rules, insurance_benefits, tax_brackets)
          VALUES (
            1, 
            1, 
            50.0, 
            1.5, 
            30.0, 
            '[
              {"violation": "Late arrival 15-30m / التأخر من ١٥ إلى ٣٠ دقيقة", "penalty_days": 0.25},
              {"violation": "Late arrival 30-60m / التأخر من ٣٠ إلى ٦٠ دقيقة", "penalty_days": 0.50},
              {"violation": "Absent without excuse / الغياب بدون إذن مقبول", "penalty_days": 1.50},
              {"violation": "Early departure / الانصراف قبل مواعيد العمل الرسمية", "penalty_days": 0.50}
            ]'::jsonb,
            '{
              "social_insurance_employee_pct": 11,
              "social_insurance_employer_pct": 18.75,
              "medical_insurance_employee_fee": 150,
              "medical_insurance_employer_fee": 300,
              "enable_social_insurance": true,
              "enable_medical_insurance": true
            }'::jsonb,
            '[
              {"min_salary": 0, "max_salary": 30000, "tax_rate": 0},
              {"min_salary": 30001, "max_salary": 45000, "tax_rate": 10},
              {"min_salary": 45001, "max_salary": 60000, "tax_rate": 15},
              {"min_salary": 60001, "max_salary": 200000, "tax_rate": 20},
              {"min_salary": 200001, "max_salary": 9999999, "tax_rate": 22.5}
            ]'::jsonb
          )
          ON CONFLICT (company_id) DO NOTHING;
        `);
        console.log("✅ HR Payroll Configuration table created and seeded.");
      } catch (e) {
        console.error("❌ Error creating HR tables:", e);
      }

      // Training Hub
      console.log("🛠️ Creating Training & Chat tables...");
      try {
        await client.query(`
          -- Migration for training_courses table to ensure columns exist
          DO $$ 
          BEGIN 
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'training_courses') THEN
              IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='training_courses' AND column_name='status') THEN
                ALTER TABLE training_courses ADD COLUMN status TEXT DEFAULT 'Draft';
              END IF;
              IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='training_courses' AND column_name='start_date') THEN
                ALTER TABLE training_courses ADD COLUMN start_date TIMESTAMP;
              END IF;
              IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='training_courses' AND column_name='end_date') THEN
                ALTER TABLE training_courses ADD COLUMN end_date TIMESTAMP;
              END IF;
              IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='training_courses' AND column_name='objectives') THEN
                ALTER TABLE training_courses ADD COLUMN objectives TEXT;
              END IF;
              IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='training_courses' AND column_name='material_url') THEN
                ALTER TABLE training_courses ADD COLUMN material_url TEXT;
              END IF;
            END IF;
          END $$;

          -- Migration for training_modules and training_lessons
          DO $$ 
          BEGIN 
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'training_modules') THEN
              IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='training_modules' AND column_name='order_index') THEN
                ALTER TABLE training_modules ADD COLUMN order_index INTEGER DEFAULT 0;
              END IF;
            END IF;
            
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'training_lessons') THEN
              IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='training_lessons' AND column_name='order_index') THEN
                ALTER TABLE training_lessons ADD COLUMN order_index INTEGER DEFAULT 0;
              END IF;
            END IF;
          END $$;

          -- Migration for training_courses to ensure category column exists
          DO $$ 
          BEGIN 
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'training_courses') THEN
              IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='training_courses' AND column_name='category') THEN
                ALTER TABLE training_courses ADD COLUMN category TEXT DEFAULT 'Upcoming Training';
              END IF;
            END IF;
          END $$;

          -- Migration for course_enrollments to ensure cost column exists
          DO $$ 
          BEGIN 
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'course_enrollments') THEN
              IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='course_enrollments' AND column_name='cost') THEN
                ALTER TABLE course_enrollments ADD COLUMN cost INTEGER DEFAULT 0;
              END IF;
            END IF;
          END $$;

          CREATE TABLE IF NOT EXISTS training_courses (
            id SERIAL PRIMARY KEY,
            sop_id INTEGER REFERENCES sops(id) ON DELETE SET NULL,
            title TEXT NOT NULL,
            description TEXT,
            objectives TEXT, -- Course objectives
            material_url TEXT, -- Link to material or KB article
            department_id INTEGER REFERENCES departments(id),
            passing_score INTEGER DEFAULT 80,
            points_reward INTEGER DEFAULT 10,
            status TEXT DEFAULT 'Draft', -- Draft, Published, Archived
            category TEXT DEFAULT 'Upcoming Training',
            start_date TIMESTAMP,
            end_date TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS course_enrollments (
            id SERIAL PRIMARY KEY,
            course_id INTEGER REFERENCES training_courses(id) ON DELETE CASCADE,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            status TEXT DEFAULT 'Scheduled', -- Scheduled, In Progress, Completed, Failed
            score INTEGER,
            progress INTEGER DEFAULT 0,
            cost INTEGER DEFAULT 0,
            completed_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(course_id, user_id)
          );

          CREATE TABLE IF NOT EXISTS training_modules (
            id SERIAL PRIMARY KEY,
            course_id INTEGER REFERENCES training_courses(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            sop_step_id INTEGER REFERENCES sop_steps(id) ON DELETE SET NULL,
            order_index INTEGER DEFAULT 0
          );

          CREATE TABLE IF NOT EXISTS training_lessons (
            id SERIAL PRIMARY KEY,
            module_id INTEGER REFERENCES training_modules(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            content_type TEXT DEFAULT 'video', -- video, text, pdf
            content_url TEXT,
            content_body TEXT,
            order_index INTEGER DEFAULT 0
          );

          CREATE TABLE IF NOT EXISTS training_lesson_progress (
            id SERIAL PRIMARY KEY,
            enrollment_id INTEGER REFERENCES course_enrollments(id) ON DELETE CASCADE,
            lesson_id INTEGER REFERENCES training_lessons(id) ON DELETE CASCADE,
            completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(enrollment_id, lesson_id)
          );

          CREATE TABLE IF NOT EXISTS training_quizzes (
            id SERIAL PRIMARY KEY,
            course_id INTEGER REFERENCES training_courses(id) ON DELETE CASCADE,
            module_id INTEGER REFERENCES training_modules(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            description TEXT,
            department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
            passing_score INTEGER DEFAULT 80,
            end_date TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          -- Migration for course_enrollments (ensure progress column exists)
          DO $$ 
          BEGIN 
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'course_enrollments') THEN
              IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='course_enrollments' AND column_name='progress') THEN
                ALTER TABLE course_enrollments ADD COLUMN progress INTEGER DEFAULT 0;
              END IF;
            END IF;
          END $$;

          -- Migration for training_quizzes
          DO $$ 
          BEGIN 
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='training_quizzes' AND column_name='description') THEN
              ALTER TABLE training_quizzes ADD COLUMN description TEXT;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='training_quizzes' AND column_name='department_id') THEN
              ALTER TABLE training_quizzes ADD COLUMN department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='training_quizzes' AND column_name='passing_score') THEN
              ALTER TABLE training_quizzes ADD COLUMN passing_score INTEGER DEFAULT 80;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='training_quizzes' AND column_name='end_date') THEN
              ALTER TABLE training_quizzes ADD COLUMN end_date TIMESTAMP;
            END IF;
          END $$;

          CREATE TABLE IF NOT EXISTS training_questions (
            id SERIAL PRIMARY KEY,
            quiz_id INTEGER REFERENCES training_quizzes(id) ON DELETE CASCADE,
            question_text TEXT NOT NULL,
            question_type TEXT DEFAULT 'multiple_choice',
            correct_answer TEXT,
            options JSONB DEFAULT '[]',
            explanation TEXT
          );

          -- Migration for training_questions
          DO $$ 
          BEGIN 
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='training_questions' AND column_name='explanation') THEN
              ALTER TABLE training_questions ADD COLUMN explanation TEXT;
            END IF;
          END $$;

          CREATE TABLE IF NOT EXISTS training_quiz_attempts (
            id SERIAL PRIMARY KEY,
            quiz_id INTEGER REFERENCES training_quizzes(id) ON DELETE CASCADE,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            score INTEGER,
            passed BOOLEAN,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS chat_rooms (
            id SERIAL PRIMARY KEY,
            name TEXT, -- Null for DMs
            type TEXT NOT NULL, -- 'channel', 'dm', 'contextual'
            department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
            context_type TEXT, -- 'sop', 'crm_deal', 'risk', 'task'
            context_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS user_presence (
            user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            status TEXT DEFAULT 'offline', -- 'online', 'busy', 'offline'
            last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS chat_messages (
            id SERIAL PRIMARY KEY,
            room_id INTEGER REFERENCES chat_rooms(id) ON DELETE CASCADE,
            sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            content TEXT NOT NULL,
            attachment_url TEXT,
            attachment_name TEXT,
            attachment_type TEXT,
            mentions JSONB DEFAULT '[]', -- Array of user IDs
            is_system_message BOOLEAN DEFAULT FALSE,
            is_announcement BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS chat_message_reactions (
            id SERIAL PRIMARY KEY,
            message_id INTEGER REFERENCES chat_messages(id) ON DELETE CASCADE,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            emoji TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(message_id, user_id, emoji)
          );

          CREATE TABLE IF NOT EXISTS chat_room_members (
            room_id INTEGER REFERENCES chat_rooms(id) ON DELETE CASCADE,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            PRIMARY KEY (room_id, user_id)
          );

          -- Migrations for chat_messages and rooms
          DO $$ 
          BEGIN 
            ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS attachment_url TEXT;
            ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS attachment_name TEXT;
            ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS attachment_type TEXT;
            ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES chat_messages(id) ON DELETE CASCADE;
            ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS audio_duration NUMERIC;
            ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS is_announcement BOOLEAN DEFAULT FALSE;
            ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS company_id INTEGER;
            ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE;
            ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS description TEXT;
            ALTER TABLE user_presence ADD COLUMN IF NOT EXISTS custom_status TEXT;

            -- Seed standard channels if none exist
            IF NOT EXISTS (SELECT 1 FROM chat_rooms WHERE type = 'channel') THEN
              INSERT INTO chat_rooms (name, type, description, company_id, is_private) VALUES
                ('general', 'channel', 'General company announcements and discussions', 1, false),
                ('operations', 'channel', 'Daily operational coordination and workflows', 1, false),
                ('sales-growth', 'channel', 'Deals, pipelines, and revenue updates', 1, false),
                ('qa-compliance', 'channel', 'Quality audits, inspections, and standards', 1, false),
                ('tech-support', 'channel', 'IT systems, automation, and tooling support', 1, false);
            END IF;
          EXCEPTION WHEN others THEN 
            RAISE NOTICE 'Migration or seeding completed';
          END $$;
        `);
        console.log("✅ Training & Chat tables created.");
      } catch (e) { console.error("❌ Error creating Training/Chat tables:", e); }

      console.log("🛠️ Creating KPI & Status tables...");
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS kpis (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            target_value REAL NOT NULL,
            actual_value REAL DEFAULT 0,
            source TEXT, -- CRM, SOPs, Manual
            frequency TEXT, -- Daily, Weekly, Monthly
            owner_id INTEGER REFERENCES users(id),
            department_id INTEGER REFERENCES departments(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS kpi_history (
            id SERIAL PRIMARY KEY,
            kpi_id INTEGER REFERENCES kpis(id) ON DELETE CASCADE,
            value REAL NOT NULL,
            recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          -- KPI & Status Tables
          CREATE TABLE IF NOT EXISTS global_statuses (
            id SERIAL PRIMARY KEY,
            module_id TEXT NOT NULL DEFAULT 'crm',
            status_key TEXT NOT NULL,
            value TEXT NOT NULL DEFAULT '',
            label TEXT NOT NULL,
            color TEXT DEFAULT '#64748b',
            is_default BOOLEAN DEFAULT FALSE,
            order_index INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(module_id, status_key)
          );
          CREATE UNIQUE INDEX IF NOT EXISTS global_statuses_module_status_idx ON global_statuses (module_id, status_key);
        `);
        console.log("✅ KPI & Status tables created.");
      } catch (e) { console.error("❌ Error creating KPI/Status tables:", e); }

      try {
        await client.query(`
          -- Seed Training Statuses
          DO $$
          BEGIN
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'global_statuses') THEN
              INSERT INTO global_statuses (module_id, status_key, value, label, color, order_index) VALUES 
              ('training', 'scheduled', 'Scheduled', 'Scheduled', '#64748b', 1),
              ('training', 'in_progress', 'In Progress', 'In Progress', '#3b82f6', 2),
              ('training', 'completed', 'Completed', 'Completed', '#10b981', 3),
              ('training', 'failed', 'Failed', 'Failed', '#ef4444', 4)
              ON CONFLICT (module_id, status_key) DO NOTHING;
            END IF;
          END $$;
        `);
      } catch (e) { console.error("❌ Error seeding training statuses:", e); }

      try {
        await client.query(`
          -- Ensure value column exists in global_statuses
          DO $$
          BEGIN
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'global_statuses') THEN
              IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='global_statuses' AND column_name='value') THEN
                RAISE NOTICE 'Adding value to global_statuses';
                ALTER TABLE global_statuses ADD COLUMN value TEXT;
                UPDATE global_statuses SET value = status_key WHERE value IS NULL;
                ALTER TABLE global_statuses ALTER COLUMN value SET NOT NULL;
              END IF;
            END IF;
          END $$;
        `);
        console.log("✅ global_statuses columns verified.");
      } catch (e) {
        console.error("❌ Error verifying global_statuses columns:", e);
      }


      console.log("🛠️ Creating Process Mapping tables...");
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS process_maps (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            sop_id INTEGER REFERENCES sops(id) ON DELETE CASCADE,
            status TEXT DEFAULT 'Draft',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS process_nodes (
            id SERIAL PRIMARY KEY,
            map_id INTEGER REFERENCES process_maps(id) ON DELETE CASCADE,
            type TEXT NOT NULL, -- 'start', 'process', 'decision', 'end', 'sop_step', 'task', 'qa'
            label TEXT NOT NULL,
            position_x REAL NOT NULL,
            position_y REAL NOT NULL,
            data JSONB DEFAULT '{}', -- { sop_step_id: number, task_id: number, etc. }
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS process_edges (
            id SERIAL PRIMARY KEY,
            map_id INTEGER REFERENCES process_maps(id) ON DELETE CASCADE,
            source_node INTEGER REFERENCES process_nodes(id) ON DELETE CASCADE,
            target_node INTEGER REFERENCES process_nodes(id) ON DELETE CASCADE,
            source_handle TEXT,
            target_handle TEXT,
            label TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          -- Migration for process_edges & process_maps
          DO $$ 
          BEGIN 
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='process_edges' AND column_name='source_handle') THEN
              ALTER TABLE process_edges ADD COLUMN source_handle TEXT;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='process_edges' AND column_name='target_handle') THEN
              ALTER TABLE process_edges ADD COLUMN target_handle TEXT;
            END IF;
            IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='process_maps' AND column_name='status') THEN
              ALTER TABLE process_maps ADD COLUMN status TEXT DEFAULT 'Draft';
            END IF;
          END $$;
        `);
        console.log("✅ Process Mapping tables created.");
      } catch (e) { console.error("❌ Error creating Process Mapping tables:", e); }

      try {
        await client.query(`
          -- CRITICAL FIX for "null value in column id" - Ensure ID columns have sequences and defaults
          -- This fixes the issue where tables might have been created without SERIAL in a previous state
          DO $$
          DECLARE
            t text;
            seq_name text;
          BEGIN
            FOR t IN SELECT unnest(ARRAY['process_maps', 'process_nodes', 'process_edges']) LOOP
              IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t) THEN
                -- Check if column id exists
                IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t AND column_name = 'id') THEN
                   seq_name := t || '_id_seq';
                   RAISE NOTICE 'Verifying/Repairing sequence for table: %, sequence: %', t, seq_name;
                   
                   -- Create sequence if not exists
                   EXECUTE 'CREATE SEQUENCE IF NOT EXISTS ' || seq_name;
                   
                   -- Ensure it is NOT NULL
                   EXECUTE 'ALTER TABLE ' || t || ' ALTER COLUMN id SET NOT NULL';
                   
                   -- Always set default to ensure it works even if it was partially set
                   EXECUTE 'ALTER TABLE ' || t || ' ALTER COLUMN id SET DEFAULT nextval(''' || seq_name || ''')';
                   
                   -- Link sequence to column (owned by)
                   EXECUTE 'ALTER SEQUENCE ' || seq_name || ' OWNED BY ' || t || '.id';
                   
                   -- Reset sequence
                   EXECUTE 'SELECT setval(''' || seq_name || ''', COALESCE((SELECT MAX(id) FROM ' || t || '), 0) + 1)';
                END IF;
              END IF;
            END LOOP;
          END $$;

          -- Integration Hub Module
          CREATE TABLE IF NOT EXISTS integrations (
            id SERIAL PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            type TEXT NOT NULL, -- 'google_sheets', 'facebook_leads', 'whatsapp', 'zapier', 'meta_ads'
            status TEXT DEFAULT 'disconnected', -- connected, disconnected, error
            config JSONB DEFAULT '{}',
            last_sync TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS integration_webhooks (
            id SERIAL PRIMARY KEY,
            integration_id INTEGER REFERENCES integrations(id) ON DELETE CASCADE,
            hook_url TEXT NOT NULL,
            event_type TEXT NOT NULL, -- 'lead_created', 'message_received'
            secret_key TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS integration_logs (
            id SERIAL PRIMARY KEY,
            integration_id INTEGER REFERENCES integrations(id) ON DELETE CASCADE,
            action TEXT NOT NULL,
            status TEXT NOT NULL, -- success, failure
            details TEXT,
            error_message TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
        `);
        console.log("✅ Repair sequences & Integration tables created.");
      } catch (e) {
        console.error("❌ Error during sequence repair or integration tables:", e);
      }

    console.log("🛠️ Updating system modules...");
    await client.query(`
      -- System Modules Toggle
      CREATE TABLE IF NOT EXISTS system_modules (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        order_index INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Audit Logs Table
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        action TEXT NOT NULL,
        entity_type TEXT,
        entity_id INTEGER,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Notifications Table
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'info',
        link TEXT,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Seed system modules if empty
      DO $$
      BEGIN
        INSERT INTO system_modules (id, name, is_active, order_index) VALUES 
        ('dashboard', 'Dashboard', TRUE, 1),
        ('ai-business', 'AI Business', TRUE, 2),
        ('meeting-hub', 'Meeting Hub', TRUE, 3),
        ('business-model', 'Business Model', TRUE, 4),
        ('kpis', 'Performance & KPIs', TRUE, 5),
        ('risk', 'Risk Register', TRUE, 6),
        ('marketing', 'Marketing Hub', TRUE, 7),
        ('leads', 'CRM Leads', TRUE, 8),
        ('crm', 'Sales CRM', TRUE, 9),
        ('operations-hub', 'Operations Hub', TRUE, 10),
        ('acct', 'Accounting', TRUE, 11),
        ('products', 'Products/Services', TRUE, 12),
        ('sops', 'SOP Management', TRUE, 13),
        ('process-mapping', 'Process Mapping', TRUE, 14),
        ('raci', 'RACI Matrix', TRUE, 15),
        ('tasks', 'Tasks', TRUE, 16),
        ('hr', 'HR Management', TRUE, 17),
        ('training', 'Training Hub', TRUE, 18),
        ('kb', 'Knowledge Base', TRUE, 19),
        ('comm', 'Communication', TRUE, 20),
        ('qa', 'Quality Assurance', TRUE, 21),
        ('kaizen', 'Kaizen Improvement', TRUE, 22),
        ('automation', 'Automation', TRUE, 23),
        ('integration', 'Integration Hub', TRUE, 24),
        ('admin', 'Admin Panel', TRUE, 25)
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, order_index = EXCLUDED.order_index, is_active = EXCLUDED.is_active;
      END $$;
    `);

    console.log("🌱 Seeding global data...");
    // Seed System Statuses
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS global_statuses_module_status_idx ON global_statuses (module_id, status_key);
      INSERT INTO global_statuses (module_id, status_key, value, label, color, is_default, order_index) VALUES 
      ('crm', 'new', 'new', 'New Lead', '#3b82f6', TRUE, 0),
      ('crm', 'contacted', 'contacted', 'Contacted', '#f59e0b', FALSE, 1),
      ('crm', 'proposal', 'proposal', 'Proposal Sent', '#8b5cf6', FALSE, 2),
      ('crm', 'negotiation', 'negotiation', 'Negotiation', '#ec4899', FALSE, 3),
      ('crm', 'closed_won', 'closed_won', 'Closed Won', '#10b981', FALSE, 4),
      ('crm', 'closed_lost', 'closed_lost', 'Closed Lost', '#ef4444', FALSE, 5),
      ('sop', 'draft', 'draft', 'Draft', '#64748b', TRUE, 0),
      ('sop', 'pending', 'pending', 'Pending Approval', '#f59e0b', FALSE, 1),
      ('sop', 'published', 'published', 'Published', '#10b981', FALSE, 2),
      ('sop', 'archived', 'archived', 'Archived', '#ef4444', FALSE, 3),
      ('kb', 'draft', 'draft', 'Draft', '#64748b', TRUE, 0),
      ('kb', 'pending', 'pending', 'Pending Approval', '#f59e0b', FALSE, 1),
      ('kb', 'published', 'published', 'Published', '#10b981', FALSE, 2)
      ON CONFLICT (module_id, status_key) DO NOTHING
    `);

    const roleRes = await client.query("SELECT count(*) FROM roles");
    if (parseInt(roleRes.rows[0].count) === 0) {
      console.log("🌱 Seeding initial roles...");
      const adminPerms = {
          CRM: { view: true, create: true, edit: true, delete: true, export: true },
          SOPs: { view: true, create: true, edit: true, delete: true, export: true },
          Admin: { view: true, create: true, edit: true, delete: true, export: true }
        };
        const staffPerms = {
          CRM: { view: true, create: true, edit: false, delete: false, export: false },
          SOPs: { view: true, create: false, edit: false, delete: false, export: false }
        };

        await client.query("INSERT INTO roles (name, permissions) VALUES ($1, $2), ($3, $4), ($5, $6) ON CONFLICT DO NOTHING", 
          ['Admin', JSON.stringify(adminPerms), 'Manager', JSON.stringify(adminPerms), 'Staff', JSON.stringify(staffPerms)]
        );
      }

      try {
        await client.query("ALTER TABLE departments ADD COLUMN IF NOT EXISTS is_executive BOOLEAN DEFAULT false;");
        await client.query("UPDATE departments SET is_executive = true WHERE LOWER(name) LIKE '%executive leadership%' OR LOWER(name) LIKE '%إدارة تنفيذية%';");
      } catch (e) {}

      const deptRes = await client.query("SELECT count(*) FROM departments");
      if (parseInt(deptRes.rows[0].count) === 0) {
        await client.query(`
          INSERT INTO departments (name, description, teams, job_titles, is_executive) VALUES 
          ('Executive Leadership', 'Executive leadership, corporate governance, and strategic direction', '["Executive Board & Corporate Governance"]'::jsonb, '["Chief Executive Officer (CEO)"]'::jsonb, true),
          ('Operations', 'Core business operations and logistics', '[]'::jsonb, '[]'::jsonb, false),
          ('Sales', 'Sales and commercial growth', '[]'::jsonb, '[]'::jsonb, false),
          ('QA', 'Quality assurance and compliance', '[]'::jsonb, '[]'::jsonb, false),
          ('Customer Service', 'Client support and retention', '[]'::jsonb, '[]'::jsonb, false),
          ('Product Development', 'Software and product engineering', '[]'::jsonb, '[]'::jsonb, false)
          ON CONFLICT DO NOTHING
        `);
      } else {
        // Ensure Executive Leadership exists without duplicating
        const execCheck = await client.query("SELECT id FROM departments WHERE LOWER(TRIM(name)) = 'executive leadership' OR LOWER(TRIM(name)) = 'إدارة تنفيذية' LIMIT 1");
        if (execCheck.rows.length === 0) {
          await client.query(`
            INSERT INTO departments (name, description, teams, job_titles, is_executive) 
            VALUES ('Executive Leadership', 'Executive leadership, corporate governance, and strategic direction', '["Executive Board & Corporate Governance"]'::jsonb, '["Chief Executive Officer (CEO)"]'::jsonb, true)
            ON CONFLICT DO NOTHING
          `);
        }
      }

      const userRes = await client.query("SELECT count(*) FROM users");
      if (parseInt(userRes.rows[0].count) === 0) {
        console.log("🌱 Seeding initial users...");
        // Note: In production, use a real hashed password. 
        // This is a hash for "core123"
        const placeholderHash = "$2a$10$8.tXG.S6W8/S/6Fm6V6V6u.6V6V6V6V6V6V6V6V6V6V6V6V6"; 
        await client.query("INSERT INTO users (name, email, password, role_id, department_id, job_title, is_super_admin) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING", 
          ["System Administrator", "admin@gmail.com", placeholderHash, 1, 1, "Chief Technology Officer", true]
        );

        // Seed SOPs
        const sopRes = await client.query(`
          INSERT INTO sops (title, department_id, process_type, owner_id, objective, scope, status, version_number) VALUES 
          ('Customer Onboarding Process', 1, 'Operational', 1, 'Standardize the client intake flow', 'All new enterprise clients', 'Published', '1.0'),
          ('IT Incident Management', 1, 'Support', 1, 'Define steps for handling system failures', 'All internal IT issues', 'Published', '1.0')
          ON CONFLICT DO NOTHING RETURNING id
        `);

        if (sopRes.rows.length > 0) {
          const onboardingId = sopRes.rows[0].id;
          await client.query(`
            INSERT INTO sop_steps (sop_id, step_number, step_description) VALUES 
            (${onboardingId}, 1, 'Receive signed contract'),
            (${onboardingId}, 2, 'Create account in CRM'),
            (${onboardingId}, 3, 'Send welcome email kit'),
            (${onboardingId}, 4, 'Schedule kick-off meeting')
          `);
        }

        await client.query("INSERT INTO crm_leads (name, email, status, value, assigned_to) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING", 
          ["Acme Corp", "contact@acme.com", "new", 50000, 1]
        );

        // Seed Knowledge Base Categories
        const catRes = await client.query(`
          INSERT INTO article_categories (name, department_id) VALUES 
          ('Services', 1), 
          ('Products', 5), 
          ('Internal Policies', 1), 
          ('FAQs', 4) 
          ON CONFLICT (name) DO NOTHING
          RETURNING id, name
        `);

        // Only seed articles if we successfully inserted or found categories
        const currentCats = await client.query("SELECT id, name FROM article_categories");
        const catIds: Record<string, number> = {};
        currentCats.rows.forEach(row => catIds[row.name] = row.id);

        if (currentCats.rows.length > 0) {
          // Seed Knowledge Base Articles if KB is empty
          const kbCount = await client.query("SELECT count(*) FROM knowledge_articles");
          if (parseInt(kbCount.rows[0].count) === 0) {
            await client.query(`
              INSERT INTO knowledge_articles (title, content, category_id, author_id, status, content_type, tags, view_count) VALUES 
              ('Onboarding Service Guide', '# Service Onboarding\nWelcome to our professional onboarding service. This guide covers the initial steps for new clients.\n\n## Steps\n1. Initial Consultation\n2. Requirement Gathering\n3. Implementation Plan', ${catIds['Services'] || 1}, 1, 'Published', 'Article', 'onboarding, services', 120),
              ('Product Roadmap 2026', '# Product Roadmap\nOur vision for the upcoming year focuses on AI integration and user experience enhancements.\n\n## Key Milestones\n- Q1: Mobile App Revamp\n- Q2: API v3 Release\n- Q3: AI Assistant Beta', ${catIds['Products'] || 1}, 1, 'Published', 'Article', 'roadmap, product', 85),
              ('Remote Work Policy', '# Remote Work Policy\nThis document outlines the guidelines and expectations for remote work within The Business Core.\n\n## Guidelines\n- Core hours: 10 AM - 4 PM\n- Communication via Slack\n- Weekly sync meetings', ${catIds['Internal Policies'] || 1}, 1, 'Published', 'Article', 'policy, hr, remote', 240),
              ('Customer Support FAQ', '# Frequently Asked Questions\nCommon questions regarding our support services and response times.\n\n## Support Tiers\n- Tier 1: General Inquiries\n- Tier 2: Technical Support\n- Tier 3: Engineering Escalation', ${catIds['FAQs'] || 1}, 1, 'Published', 'Article', 'faq, support', 150),
              ('Customer Service Standard', '# Customer Service Excellence\nOur commitment to providing world-class support to every client.\n\n## Core Values\n- Empathy\n- Speed\n- Accuracy', ${catIds['Services'] || 1}, 1, 'Published', 'Article', 'service, standard', 95),
              ('Product Maintenance Guide', '# Maintenance Procedures\nStep-by-step instructions for maintaining our hardware products.\n\n## Schedule\n- Daily: Visual Inspection\n- Weekly: Calibration\n- Monthly: Deep Clean', ${catIds['Products'] || 1}, 1, 'Published', 'Article', 'maintenance, product', 110),
              ('Data Privacy Policy', '# Data Privacy & Security\nHow we protect user data and comply with global regulations like GDPR.\n\n## Principles\n- Minimal Data Collection\n- Encryption at Rest\n- User Consent', ${catIds['Internal Policies'] || 1}, 1, 'Published', 'Article', 'privacy, security, policy', 320),
              ('Employee Code of Conduct', '# Code of Conduct\nProfessional standards and ethical guidelines for all The Business Core employees.\n\n## Expectations\n- Integrity\n- Respect\n- Professionalism', ${catIds['Internal Policies'] || 1}, 1, 'Published', 'Article', 'conduct, ethics, policy', 215)
            `);
          }
        }
      }

      // Seed KPIs
      const kpiRes = await client.query("SELECT count(*) FROM kpis");
      if (parseInt(kpiRes.rows[0].count) === 0) {
        await client.query(`
          INSERT INTO kpis (name, target_value, actual_value, source, frequency, owner_id, department_id) VALUES 
          ('Avg SOP Execution Time', 30, 35, 'SOPs', 'Daily', 1, 1),
          ('Lead Conversion Rate', 25, 22, 'CRM', 'Weekly', 1, 2),
          ('QA Compliance Score', 95, 98, 'Manual', 'Monthly', 1, 3),
          ('Training Completion', 100, 0, 'Training', 'Monthly', 1, 1),
          ('Training Completion', 100, 0, 'Training', 'Monthly', 1, 2),
          ('Training Completion', 100, 0, 'Training', 'Monthly', 1, 3),
          ('Training Completion', 100, 0, 'Training', 'Monthly', 1, 4),
          ('Training Completion', 100, 0, 'Training', 'Monthly', 1, 5)
        `);
      }

      // Seed Automation Rules
      const automationRes = await client.query("SELECT count(*) FROM automation_rules");
      if (parseInt(automationRes.rows[0].count) === 0) {
        await client.query(`
          INSERT INTO automation_rules (name, trigger_type, actions) VALUES 
          ('Alert Manager on NCR', 'qa:ncr:created', '[{"type": "notification", "params": {"channel": "internal", "message": "Critical NCR Reported: {{description}}", "recipient_id": 1}}]'),
          ('Angry Customer Alert', 'qa:angry_customer:alert', '[{"type": "notification", "params": {"channel": "internal", "message": "Angry Customer Detected! Content: {{content}}", "recipient_id": 1}}]'),
          ('RACI: Task Completed Alert', 'raci:task:completed', '[{"type": "notification", "params": {"channel": "internal", "message": "Task Completed and requires your review: {{task_title}}", "recipient_id": "{{recipient_id}}"}}]'),
          ('RACI: Informed Update', 'raci:task:informed', '[{"type": "notification", "params": {"channel": "internal", "message": "Update on task you are following: {{task_title}} is now {{status}}", "recipient_id": "{{recipient_id}}"}}]')
        `);
      }

      // Seed Integrations
      const integrationRes = await client.query("SELECT count(*) FROM integrations");
      if (parseInt(integrationRes.rows[0].count) === 0) {
        await client.query(`
          INSERT INTO integrations (name, type, status, config) VALUES 
          ('Sales Google Sheet', 'google_sheets', 'connected', '{"sheet_id": "1abc-def", "worksheet": "Sheet1"}'),
          ('Facebook Lead Ads', 'facebook_leads', 'connected', '{"page_id": "987654321"}'),
          ('Zapier Webhook', 'zapier', 'disconnected', '{"webhook_url": "https://hooks.zapier.com/..."}')
          ON CONFLICT (name) DO NOTHING;
        `);
      }

      // Seed AI Agents Table
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS company_ai_agents (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
            agent_role TEXT NOT NULL, -- (CEO, SOP_Manager, Process_Architect, CFO)
            agent_name TEXT NOT NULL, -- اسم يختاره العميل للاجينت
            is_active BOOLEAN DEFAULT TRUE,
            system_prompt TEXT NOT NULL, -- التعليمات الصارمة لشخصية العميل
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
          );

          -- EXPLICIT GRANTS
          GRANT ALL ON TABLE company_ai_agents TO postgres;
          GRANT ALL ON TABLE company_ai_agents TO service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE company_ai_agents TO authenticated;
        `);
        console.log("✅ company_ai_agents Table and Grants Configured.");

        // Safe setup of RLS & Policies
        try {
          await client.query(`ALTER TABLE company_ai_agents ENABLE ROW LEVEL SECURITY;`);
          await client.query(`
            DROP POLICY IF EXISTS "Companies can manage their AI Agents" ON company_ai_agents;
            CREATE POLICY "Companies can manage their AI Agents" 
            ON company_ai_agents FOR all TO authenticated 
            USING (auth.jwt() ->> 'company_id' = company_id::text);
          `);
        } catch (e) {
          console.warn("⚠️ Row Level Security or Policy setup failed (Possibly missing Supabase auth schema):", (e as any).message);
        }
      } catch (err) {
        console.error("❌ Failed to create company_ai_agents:", err);
      }

      // Seed Work Orders Table
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS work_orders (
            id SERIAL PRIMARY KEY,
            deal_id INTEGER REFERENCES crm_deals(id) ON DELETE SET NULL,
            customer_name TEXT,
            title TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'Pending', -- Pending, Executing, Ready for Delivery, Delivered
            execution_agent_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            delivery_agent_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            items JSONB DEFAULT '[]'::jsonb, -- Array of itemized services/products
            actual_cost_total REAL DEFAULT 0.0,
            sale_value REAL DEFAULT 0.0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          -- EXPLICIT GRANTS
          GRANT ALL ON TABLE work_orders TO postgres;
          GRANT ALL ON TABLE work_orders TO service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE work_orders TO authenticated;
        `);
        console.log("✅ work_orders Table and Grants Configured.");
      } catch (err) {
        console.error("❌ Failed to create work_orders table:", err);
      }

      // Seed company_meetings and meeting_attendees tables
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS company_meetings (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            meeting_time TIMESTAMP NOT NULL,
            type TEXT NOT NULL DEFAULT 'online', -- online or offline
            meeting_link TEXT, -- Google Meet or Zoom link
            location TEXT, -- offline room/office
            ai_summary TEXT, -- AI-powered summary and action items
            company_id INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          CREATE TABLE IF NOT EXISTS meeting_attendees (
            meeting_id INTEGER REFERENCES company_meetings(id) ON DELETE CASCADE,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            PRIMARY KEY (meeting_id, user_id)
          );

          -- EXPLICIT GRANTS (CRITICAL: Do this before RLS policies)
          GRANT ALL ON TABLE company_meetings TO postgres;
          GRANT ALL ON TABLE company_meetings TO service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE company_meetings TO authenticated;

          GRANT ALL ON TABLE meeting_attendees TO postgres;
          GRANT ALL ON TABLE meeting_attendees TO service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE meeting_attendees TO authenticated;
        `);
        console.log("✅ company_meetings and meeting_attendees tables and grants configured.");
      } catch (err) {
        console.error("❌ Failed to create company_meetings/attendees tables:", err);
      }

      // Create Recruitment tables: hr_job_openings, hr_candidates, hr_interviews
      try {
        await client.query(`
          CREATE TABLE IF NOT EXISTS hr_job_openings (
            id SERIAL PRIMARY KEY,
            company_id INTEGER DEFAULT 1,
            title TEXT NOT NULL,
            department_id INTEGER,
            headcount_needed INTEGER DEFAULT 1,
            status TEXT DEFAULT 'Active',
            salary_range TEXT,
            experience_requirements TEXT,
            description TEXT,
            requirements TEXT,
            budget_status TEXT DEFAULT 'Pending Approval',
            description_blocks TEXT DEFAULT '[]',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          ALTER TABLE hr_job_openings ADD COLUMN IF NOT EXISTS description TEXT;
          ALTER TABLE hr_job_openings ADD COLUMN IF NOT EXISTS requirements TEXT;
          ALTER TABLE hr_job_openings ADD COLUMN IF NOT EXISTS budget_status TEXT DEFAULT 'Pending Approval';
          ALTER TABLE hr_job_openings ADD COLUMN IF NOT EXISTS description_blocks TEXT DEFAULT '[]';
          ALTER TABLE hr_job_openings ADD COLUMN IF NOT EXISTS location TEXT DEFAULT 'Marseille, Provence';
          ALTER TABLE hr_job_openings ADD COLUMN IF NOT EXISTS employment_type TEXT DEFAULT 'Full-Time';
          ALTER TABLE hr_job_openings ADD COLUMN IF NOT EXISTS hiring_lead TEXT DEFAULT 'Debra Tuescher';
          ALTER TABLE hr_job_openings ADD COLUMN IF NOT EXISTS days_open INTEGER DEFAULT 7;

          CREATE TABLE IF NOT EXISTS hr_candidates (
            id SERIAL PRIMARY KEY,
            company_id INTEGER DEFAULT 1,
            job_opening_id INTEGER REFERENCES hr_job_openings(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            email TEXT,
            linkedin_url TEXT,
            cv_url TEXT,
            stage TEXT DEFAULT 'Applied',
            score NUMERIC DEFAULT 0,
            notes TEXT,
            phone TEXT DEFAULT '+33 4 567 4321',
            location TEXT DEFAULT 'Marseille, Provence',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          ALTER TABLE hr_candidates ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '+33 4 567 4321';
          ALTER TABLE hr_candidates ADD COLUMN IF NOT EXISTS location TEXT DEFAULT 'Marseille, Provence';
          ALTER TABLE hr_candidates ALTER COLUMN score TYPE NUMERIC USING score::NUMERIC;

          -- Deduplicate if duplicates exist to prevent constraint/index failure
          DELETE FROM hr_candidates WHERE id NOT IN (SELECT MIN(id) FROM hr_candidates GROUP BY email);
          CREATE UNIQUE INDEX IF NOT EXISTS hr_candidates_email_idx ON hr_candidates (email);

          CREATE TABLE IF NOT EXISTS hr_interviews (
            id SERIAL PRIMARY KEY,
            company_id INTEGER DEFAULT 1,
            candidate_id INTEGER REFERENCES hr_candidates(id) ON DELETE CASCADE,
            title TEXT,
            interview_date TIMESTAMP NOT NULL,
            interviewer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            meeting_link TEXT,
            notes TEXT,
            technical_score INTEGER,
            technical_notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          -- EXPLICIT GRANTS (CRITICAL: Do this before RLS policies)
          GRANT ALL ON TABLE hr_job_openings TO postgres;
          GRANT ALL ON TABLE hr_job_openings TO service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE hr_job_openings TO authenticated;

          GRANT ALL ON TABLE hr_candidates TO postgres;
          GRANT ALL ON TABLE hr_candidates TO service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE hr_candidates TO authenticated;

          GRANT ALL ON TABLE hr_interviews TO postgres;
          GRANT ALL ON TABLE hr_interviews TO service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE hr_interviews TO authenticated;

          CREATE TABLE IF NOT EXISTS hr_candidate_comments (
            id SERIAL PRIMARY KEY,
            company_id INTEGER DEFAULT 1,
            candidate_id INTEGER REFERENCES hr_candidates(id) ON DELETE CASCADE,
            author_name TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          GRANT ALL ON TABLE hr_candidate_comments TO postgres;
          GRANT ALL ON TABLE hr_candidate_comments TO service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE hr_candidate_comments TO authenticated;

          CREATE TABLE IF NOT EXISTS hr_candidate_logs (
            id SERIAL PRIMARY KEY,
            company_id INTEGER DEFAULT 1,
            candidate_id INTEGER REFERENCES hr_candidates(id) ON DELETE CASCADE,
            action_type TEXT NOT NULL,
            details TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          GRANT ALL ON TABLE hr_candidate_logs TO postgres;
          GRANT ALL ON TABLE hr_candidate_logs TO service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE hr_candidate_logs TO authenticated;

          CREATE TABLE IF NOT EXISTS hr_candidate_emails (
            id SERIAL PRIMARY KEY,
            company_id INTEGER DEFAULT 1,
            candidate_id INTEGER REFERENCES hr_candidates(id) ON DELETE CASCADE,
            subject TEXT NOT NULL,
            body TEXT NOT NULL,
            sender TEXT NOT NULL,
            receiver TEXT NOT NULL,
            status TEXT DEFAULT 'Sent',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          GRANT ALL ON TABLE hr_candidate_emails TO postgres;
          GRANT ALL ON TABLE hr_candidate_emails TO service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE hr_candidate_emails TO authenticated;

          CREATE TABLE IF NOT EXISTS hr_email_templates (
            id SERIAL PRIMARY KEY,
            company_id INTEGER DEFAULT 1,
            name TEXT NOT NULL,
            subject TEXT NOT NULL,
            body TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          ALTER TABLE hr_email_templates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

          GRANT ALL ON TABLE hr_email_templates TO postgres;
          GRANT ALL ON TABLE hr_email_templates TO service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE hr_email_templates TO authenticated;

          CREATE TABLE IF NOT EXISTS hr_email_config (
            id SERIAL PRIMARY KEY,
            company_id INTEGER DEFAULT 1,
            smtp_host TEXT,
            smtp_port INTEGER,
            smtp_user TEXT,
            smtp_pass TEXT,
            sender_name TEXT,
            sender_email TEXT,
            is_active BOOLEAN DEFAULT false,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );

          ALTER TABLE hr_email_config ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT false;
          ALTER TABLE hr_email_config ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

          GRANT ALL ON TABLE hr_email_config TO postgres;
          GRANT ALL ON TABLE hr_email_config TO service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE hr_email_config TO authenticated;
        `);
        console.log("✅ Recruitment tables and grants configured.");

        // Initial recruitment table setup (automatic demo seeding disabled for clean environment)
        console.log("✅ Recruitment tables ready.");
      } catch (err) {
        console.error("❌ Failed to create or seed Recruitment tables:", err);
      }

      // Additional Core Module Schemas (Operations, Marketing, RACI, Tasks)
      try {
        await client.query(`
          -- Operations Hub Stages
          CREATE TABLE IF NOT EXISTS operation_stages (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            color TEXT DEFAULT '#3b82f6',
            order_index INTEGER DEFAULT 0,
            is_completed BOOLEAN DEFAULT FALSE
          );
          GRANT ALL ON TABLE operation_stages TO postgres;
          GRANT ALL ON TABLE operation_stages TO service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE operation_stages TO authenticated;

          -- Work Orders QA Additions
          ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS qa_status TEXT DEFAULT 'Pending Review';
          ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS qa_feedback TEXT;
          ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS expected_start_date TEXT;
          ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS due_date TEXT;
          ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS supervisor_id INTEGER;
          ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS assignment_date TEXT;
          ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS completion_date TEXT;

          -- Work Order QA Tickets
          CREATE TABLE IF NOT EXISTS work_order_qa_tickets (
            id SERIAL PRIMARY KEY,
            work_order_id INTEGER REFERENCES work_orders(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT NOT NULL DEFAULT 'Open',
            severity TEXT DEFAULT 'medium',
            reported_by INTEGER REFERENCES users(id),
            assigned_to INTEGER REFERENCES users(id),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          GRANT ALL ON TABLE work_order_qa_tickets TO postgres;
          GRANT ALL ON TABLE work_order_qa_tickets TO service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE work_order_qa_tickets TO authenticated;

          -- Tasks Extra Columns & Comments
          ALTER TABLE tasks ADD COLUMN IF NOT EXISTS depends_on_task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL;
          ALTER TABLE tasks ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER DEFAULT 0;

          CREATE TABLE IF NOT EXISTS task_comments (
            id SERIAL PRIMARY KEY,
            task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
            user_id INTEGER,
            user_name TEXT,
            comment TEXT NOT NULL,
            attachment_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          GRANT ALL ON TABLE task_comments TO postgres;
          GRANT ALL ON TABLE task_comments TO service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE task_comments TO authenticated;

          -- RACI Clarity Survey
          CREATE TABLE IF NOT EXISTS raci_clarity_survey (
            id SERIAL PRIMARY KEY,
            user_id INTEGER,
            user_name TEXT,
            score INTEGER NOT NULL,
            feedback TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          GRANT ALL ON TABLE raci_clarity_survey TO postgres;
          GRANT ALL ON TABLE raci_clarity_survey TO service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE raci_clarity_survey TO authenticated;

          -- Marketing Hub
          CREATE TABLE IF NOT EXISTS marketing_campaigns (
            id SERIAL PRIMARY KEY,
            company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            goal TEXT,
            platform TEXT NOT NULL,
            budget NUMERIC DEFAULT 0,
            spend NUMERIC DEFAULT 0,
            leads_generated INTEGER DEFAULT 0,
            sales_value NUMERIC DEFAULT 0,
            status TEXT DEFAULT 'Planning',
            created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
            updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          GRANT ALL ON TABLE marketing_campaigns TO postgres;
          GRANT ALL ON TABLE marketing_campaigns TO service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE marketing_campaigns TO authenticated;

          CREATE TABLE IF NOT EXISTS marketing_content (
            id SERIAL PRIMARY KEY,
            company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
            campaign_id INTEGER REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            platform TEXT NOT NULL,
            content_text TEXT,
            publish_date DATE,
            status TEXT DEFAULT 'Draft',
            created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
            updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          GRANT ALL ON TABLE marketing_content TO postgres;
          GRANT ALL ON TABLE marketing_content TO service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE marketing_content TO authenticated;

          CREATE TABLE IF NOT EXISTS marketing_attachments (
            id SERIAL PRIMARY KEY,
            company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
            campaign_id INTEGER REFERENCES marketing_campaigns(id) ON DELETE CASCADE,
            content_id INTEGER REFERENCES marketing_content(id) ON DELETE CASCADE,
            file_name TEXT NOT NULL,
            file_url TEXT NOT NULL,
            file_type TEXT,
            uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          GRANT ALL ON TABLE marketing_attachments TO postgres;
          GRANT ALL ON TABLE marketing_attachments TO service_role;
          GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE marketing_attachments TO authenticated;
        `);
      } catch (err) {
        console.error("❌ Failed to create or seed Module extra tables:", err);
      }

    // Record schema version in meta table to enable instant fast-path on future boots
    try {
      await client.query(`
        INSERT INTO _systo_schema_meta (key, version, updated_at) 
        VALUES ('schema_version', 25, CURRENT_TIMESTAMP)
        ON CONFLICT (key) DO UPDATE SET version = 25, updated_at = CURRENT_TIMESTAMP;
      `);
    } catch (_mErr) {}

    console.log("✅ PostgreSQL Database Initialized Successfully");
  } catch (err) {
    isDatabaseAvailable = false;
    if ((err as any).code === 'ENOTFOUND' || (err as any).code === 'ECONNREFUSED') {
      console.error(`❌ Database connection failed (${(err as any).code}): The host could not be found or reached. Falling back to mock/empty data.`);
      console.info("💡 Please check your DATABASE_URL in the Settings menu.");
    } else {
      console.error("❌ Database initialization failed:", err);
    }
    // Don't re-throw, allow the server to start even if DB is down
  } finally {
    if (client) {
      try {
        client.release();
      } catch (relErr) {
        console.warn("Client release notice:", (relErr as Error).message);
      }
    }
  }
}
