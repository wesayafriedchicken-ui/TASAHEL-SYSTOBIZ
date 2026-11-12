import { Request, Response } from "express";
import { pool } from "../../db/schema.js";
import bcrypt from "bcryptjs";
import { logAction } from "../../services/auditLogger.js";
import { memoryCache } from "../../utils/cache.js";

export const getUsers = async (req: Request, res: Response) => {
  const companyId = (req as any).user?.company_id || 1;
  const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : (page ? 25 : undefined);
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

  try {
    let whereClause = `
      WHERE (u.company_id = $1 OR u.company_id IS NULL)
    `;
    const params: any[] = [companyId];

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      whereClause += ` AND (
        LOWER(u.name) LIKE $${params.length} 
        OR LOWER(u.email) LIKE $${params.length} 
        OR LOWER(COALESCE(u.job_title, '')) LIKE $${params.length} 
        OR LOWER(COALESCE(u.employee_id, h.id_number, h.employee_id, '')) LIKE $${params.length}
      )`;
    }

    if (page !== undefined && limit !== undefined) {
      const countRes = await pool.query(`
        SELECT COUNT(u.id) as total
        FROM users u
        LEFT JOIN hr_employees h ON h.user_id = u.id
        ${whereClause}
      `, params);
      const total = parseInt(countRes.rows[0]?.total || '0', 10);
      const offset = Math.max(0, (page - 1) * limit);

      const queryParams = [...params, limit, offset];
      const result = await pool.query(`
        SELECT 
          u.id, u.name, u.email, u.username, u.role_id, u.department_id, u.job_title, 
          u.team_name, u.reporting_to, u.status, u.is_super_admin, u.training_points, 
          u.avatar_url, u.created_at, u.updated_at, u.company_id, u.has_portal_access,
          COALESCE(u.auth_method, 'standard') as auth_method,
          COALESCE(u.employee_id, h.id_number, h.employee_id) as employee_id,
          r.name as role_name, d.name as department_name, m.name as manager_name,
          h.id as hr_employee_id
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN departments d ON u.department_id = d.id
        LEFT JOIN users m ON u.reporting_to = m.id
        LEFT JOIN hr_employees h ON h.user_id = u.id
        ${whereClause}
        ORDER BY u.id ASC
        LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
      `, queryParams);

      return res.json({
        users: result.rows,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      });
    }

    const result = await pool.query(`
      SELECT 
        u.id, u.name, u.email, u.username, u.role_id, u.department_id, u.job_title, 
        u.team_name, u.reporting_to, u.status, u.is_super_admin, u.training_points, 
        u.avatar_url, u.created_at, u.updated_at, u.company_id, u.has_portal_access,
        COALESCE(u.auth_method, 'standard') as auth_method,
        COALESCE(u.employee_id, h.id_number, h.employee_id) as employee_id,
        COALESCE(NULLIF(h.extension_number, ''), NULLIF(h.personal_info->>'extension', ''), NULLIF(h.personal_info->>'ext', '')) as extension_number,
        r.name as role_name, d.name as department_name, m.name as manager_name,
        h.id as hr_employee_id
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN users m ON u.reporting_to = m.id
      LEFT JOIN hr_employees h ON h.user_id = u.id
      ${whereClause}
      ORDER BY u.id ASC
    `, params);
    res.json(result.rows);
  } catch (err) {
    console.error('getUsers error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const companyId = (req as any).user?.company_id || 1;
  try {
    const result = await pool.query(`
      SELECT 
        u.id, u.name, u.email, u.username, u.role_id, u.department_id, u.job_title, 
        u.team_name, u.reporting_to, u.status, u.is_super_admin, u.training_points, 
        u.avatar_url, u.created_at, u.updated_at, u.company_id, u.has_portal_access,
        COALESCE(u.auth_method, 'standard') as auth_method,
        COALESCE(u.employee_id, h.id_number, h.employee_id) as employee_id,
        COALESCE(NULLIF(h.extension_number, ''), NULLIF(h.personal_info->>'extension', ''), NULLIF(h.personal_info->>'ext', '')) as extension_number,
        r.name as role_name, r.description as role_description, r.permissions as role_permissions,
        d.name as department_name,
        m.name as manager_name, m.email as manager_email,
        h.id as hr_employee_id, h.phone, h.contract_type, h.contract_start_date, h.personal_info
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN departments d ON u.department_id = d.id
      LEFT JOIN users m ON u.reporting_to = m.id
      LEFT JOIN hr_employees h ON h.user_id = u.id
      WHERE u.id = $1 AND u.company_id = $2
    `, [id, companyId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('getUserById error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
};

const sanitizeReportingTo = (val: any): number | null => {
  if (val === undefined || val === null || val === '' || val === '—') return null;
  if (typeof val === 'number' && !isNaN(val)) return val;
  const str = String(val).trim();
  if (!str || isNaN(Number(str))) return null;
  return parseInt(str, 10);
};

export const createUser = async (req: Request, res: Response) => {
  const { name, email, username, password, role_id, department_id, job_title, reporting_to, employee_id, is_employee, auth_method } = req.body;
  const companyId = (req as any).user?.company_id || 1;
  const safeReportingTo = sanitizeReportingTo(reporting_to);
  const safeAuthMethod = auth_method === 'corporate_sso' ? 'corporate_sso' : 'standard';

  if (!email || !name) {
    return res.status(400).json({ error: "Name and email are required fields." });
  }

  try {
    const existing = await pool.query(`SELECT id FROM users WHERE email = $1`, [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: `User with email '${email}' already exists.` });
    }

    const hashedPassword = await bcrypt.hash(password || "core123", 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, username, password, role_id, department_id, job_title, reporting_to, company_id, employee_id, auth_method) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
       RETURNING id, name, email, username, role_id, department_id, job_title, reporting_to, company_id, employee_id, auth_method, status, created_at`,
      [name, email, username || null, hashedPassword, role_id || null, department_id || null, job_title || null, safeReportingTo, companyId, employee_id || null, safeAuthMethod]
    );

    const newUser = result.rows[0];

    // If employee_id is set or marked as employee, ensure hr_employees record exists
    if (employee_id || is_employee) {
      const empCode = employee_id || `EMP-${newUser.id}`;
      await pool.query(
        `INSERT INTO hr_employees (user_id, company_id, id_number, employee_id, personal_info)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id) DO UPDATE SET id_number = EXCLUDED.id_number, employee_id = EXCLUDED.employee_id`,
        [newUser.id, companyId, empCode, empCode, JSON.stringify({ full_name: name })]
      );
    }

    res.status(201).json(newUser);
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(400).json({ error: `User with email '${email}' already exists.` });
    }
    console.error("createUser error:", err);
    res.status(500).json({ error: err.message || "Failed to create user" });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const companyId = (req as any).user?.company_id || 1;
  const allowedFields = ['name', 'email', 'username', 'role_id', 'department_id', 'job_title', 'team_name', 'reporting_to', 'status', 'is_super_admin', 'training_points', 'employee_id', 'auth_method'];
  const fields = Object.keys(req.body).filter(f => allowedFields.includes(f));
  if (fields.length === 0) {
     return res.status(400).json({ error: "No valid fields to update" });
  }

  if (req.body.email) {
    const existing = await pool.query(`SELECT id FROM users WHERE email = $1 AND id != $2`, [req.body.email, id]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: `The email '${req.body.email}' is already in use by another user.` });
    }
  }

  const values = fields.map(f => {
    if (f === 'reporting_to') return sanitizeReportingTo(req.body[f]);
    return req.body[f];
  });
  const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(", ");
  
  try {
    const result = await pool.query(
      `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND company_id = $${fields.length + 2} 
       RETURNING id, name, email, username, role_id, department_id, job_title, team_name, reporting_to, status, is_super_admin, training_points, employee_id, auth_method, updated_at`,
      [id, ...values, companyId]
    );
    const updatedUser = result.rows[0];

    if (req.body.employee_id !== undefined || req.body.is_employee) {
      const empCode = req.body.employee_id || `EMP-${id}`;
      await pool.query(
        `INSERT INTO hr_employees (user_id, company_id, id_number, employee_id, personal_info)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id) DO UPDATE SET id_number = EXCLUDED.id_number, employee_id = EXCLUDED.employee_id`,
        [id, companyId, empCode, empCode, JSON.stringify({ full_name: updatedUser.name })]
      );
    }

    res.json(updatedUser);
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(400).json({ error: `The email is already in use by another user.` });
    }
    console.error("updateUser error:", err);
    res.status(500).json({ error: err.message || "Failed to update user" });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const companyId = (req as any).user?.company_id || 1;
  try {
    await pool.query("DELETE FROM users WHERE id = $1 AND company_id = $2", [id, companyId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const getRoles = async (req: Request, res: Response) => {
  const companyId = (req as any).user?.company_id || 1;
  const cacheKey = `admin:roles:${companyId}`;
  const cached = memoryCache.get(cacheKey);
  if (cached) {
    return res.json(cached);
  }
  try {
    const result = await pool.query(
      "SELECT id, name, description, company_id, permissions, mobile_permissions FROM roles WHERE company_id = $1 OR company_id IS NULL ORDER BY id ASC", 
      [companyId]
    );
    memoryCache.set(cacheKey, result.rows, 120); // 2 minutes cache
    res.json(result.rows);
  } catch (err) {
    console.error('getRoles error:', err);
    const fallbackRoles = [
      { id: 1, name: 'Admin', description: 'System Administrator', company_id: companyId, permissions: { Admin: { view: true, edit: true, delete: true } } },
      { id: 2, name: 'Manager', description: 'Department Manager', company_id: companyId, permissions: {} },
      { id: 3, name: 'Staff', description: 'General Staff', company_id: companyId, permissions: {} }
    ];
    res.json(fallbackRoles);
  }
};

export const createRole = async (req: Request, res: Response) => {
  const { name, description, permissions } = req.body;
  const companyId = (req as any).user?.company_id || 1;
  try {
    const result = await pool.query(
      "INSERT INTO roles (name, description, permissions, company_id) VALUES ($1, $2, $3, $4) RETURNING id, name, description, permissions, company_id",
      [name, description || '', JSON.stringify(permissions || {}), companyId]
    );
    memoryCache.del(`admin:roles:${companyId}`);
    memoryCache.del(`admin:all:${companyId}`);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const deleteRole = async (req: Request, res: Response) => {
  const { id } = req.params;
  const companyId = (req as any).user?.company_id || 1;
  try {
    await pool.query("DELETE FROM roles WHERE id = $1", [id]);
    memoryCache.del(`admin:roles:${companyId}`);
    memoryCache.del(`admin:all:${companyId}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

function buildStandardModuleDefinition(perms: any, canonMod: string) {
  if (perms?.screens && typeof perms.screens === 'object') {
    return {
      is_enabled: perms.is_enabled !== false,
      screens: perms.screens
    };
  }

  const isEnabled = perms?.view !== false;
  const levels = perms?.levels || {};
  const scopes = perms?.data_scopes || {};
  const customActions = perms?.custom_actions || {};
  const seePerms = perms?.see_permissions || {};

  const screens: Record<string, any> = {};
  const allScreenKeys = new Set<string>();
  Object.keys(levels).forEach(k => allScreenKeys.add(k.toLowerCase().replace(/[^a-z0-9]/g, '_')));
  Object.keys(scopes).forEach(k => allScreenKeys.add(k.toLowerCase().replace(/[^a-z0-9]/g, '_')));

  if (canonMod === 'HR' && allScreenKeys.size === 0) {
    ['dashboard', 'directory', 'payroll', 'departments', 'attendance', 'org_chart'].forEach(k => allScreenKeys.add(k));
  } else if (canonMod === 'QA' && allScreenKeys.size === 0) {
    ['dashboard', 'audits', 'incidents', 'remediations'].forEach(k => allScreenKeys.add(k));
  } else if (canonMod === 'Knowledge Base' && allScreenKeys.size === 0) {
    ['articles', 'categories', 'tags'].forEach(k => allScreenKeys.add(k));
  }

  for (const scr of allScreenKeys) {
    let lvlVal = levels[scr];
    if (lvlVal === undefined) {
      for (const [k, v] of Object.entries(levels)) {
        if (k.toLowerCase().replace(/[^a-z0-9]/g, '_') === scr) {
          lvlVal = v;
          break;
        }
      }
    }

    let scopeVal = scopes[scr] || scopes.see_scope || perms?.see_scope || 'own';
    if (typeof scopeVal === 'string') {
      scopeVal = scopeVal.toLowerCase();
      if (scopeVal === 'all' || scopeVal === 'company') scopeVal = 'global';
      if (scopeVal === 'branch') scopeVal = 'department';
    }

    const grantedActions: string[] = [];
    for (const [actKey, val] of Object.entries(customActions)) {
      if (val === true) {
        grantedActions.push(actKey);
      }
    }

    const fields: Record<string, string> = {};
    for (const [fk, fVal] of Object.entries(seePerms)) {
      const mode = fVal === 'no' ? 'hidden' : fVal === 'view' ? 'readonly' : 'full_access';
      fields[fk] = mode;
    }

    screens[scr] = {
      level: (lvlVal === 3 || lvlVal === '3' || lvlVal === 'hidden') ? 'hidden' :
             (lvlVal === 2 || lvlVal === '2' || lvlVal === 'readonly') ? 'readonly' :
             (lvlVal === 1 || lvlVal === '1' || lvlVal === 'editable') ? 'editable' : 'default',
      scope: ['own', 'team', 'department', 'global'].includes(scopeVal) ? scopeVal : 'own',
      actions: grantedActions,
      fields
    };
  }

  return {
    is_enabled: isEnabled,
    screens
  };
}

export const updateRolePermissions = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { permissions, description } = req.body;
  const companyId = (req as any).user?.company_id || 1;
  try {
    const cleanPerms = { ...(permissions || {}) };
    if (cleanPerms['QA'] || cleanPerms['Quality Assurance'] || cleanPerms['qa']) {
      const baseQa = cleanPerms['QA'] || cleanPerms['Quality Assurance'] || cleanPerms['qa'];
      cleanPerms['QA'] = baseQa;
      cleanPerms['Quality Assurance'] = baseQa;
      cleanPerms['qa'] = baseQa;
    }
    if (cleanPerms['HR'] || cleanPerms['HR Management']) {
      const baseHr = cleanPerms['HR'] || cleanPerms['HR Management'];
      cleanPerms['HR'] = baseHr;
      cleanPerms['HR Management'] = baseHr;
    }
    if (cleanPerms['Products/Services'] || cleanPerms['Products & Services'] || cleanPerms['products'] || cleanPerms['Catalog'] || cleanPerms['catalog']) {
      const baseProd = cleanPerms['Products/Services'] || cleanPerms['Products & Services'] || cleanPerms['Catalog'] || cleanPerms['products'] || cleanPerms['catalog'];
      cleanPerms['Products/Services'] = baseProd;
      cleanPerms['Products & Services'] = baseProd;
      cleanPerms['Products%2FServices'] = baseProd;
      cleanPerms['Catalog'] = baseProd;
      cleanPerms['catalog'] = baseProd;
      cleanPerms['products'] = baseProd;
    }
    if (cleanPerms['Knowledge Base'] || cleanPerms['Knowledge%20Base'] || cleanPerms['kb'] || cleanPerms['knowledge_base'] || cleanPerms['knowledge']) {
      const baseKB = cleanPerms['Knowledge Base'] || cleanPerms['Knowledge%20Base'] || cleanPerms['kb'] || cleanPerms['knowledge_base'] || cleanPerms['knowledge'];
      cleanPerms['Knowledge Base'] = baseKB;
      cleanPerms['Knowledge%20Base'] = baseKB;
      cleanPerms['kb'] = baseKB;
      cleanPerms['knowledge_base'] = baseKB;
      cleanPerms['knowledge'] = baseKB;
    }

    // Enforce Standardized RolePermissionPayload Schema Contract (Req 1)
    cleanPerms.role_id = String(id);
    if (!cleanPerms.modules || typeof cleanPerms.modules !== 'object') {
      cleanPerms.modules = {};
    }
    for (const [mKey, mVal] of Object.entries(cleanPerms)) {
      if (mKey !== 'modules' && mKey !== 'role_id' && typeof mVal === 'object' && mVal) {
        cleanPerms.modules[mKey] = buildStandardModuleDefinition(mVal, mKey);
      }
    }

    let query = "UPDATE roles SET permissions = $1 WHERE id = $2 AND (company_id = $3 OR company_id IS NULL) RETURNING id, name, description, permissions";
    let params = [JSON.stringify(cleanPerms), id, companyId];
    if (description !== undefined) {
      query = "UPDATE roles SET permissions = $1, description = $2 WHERE id = $3 AND (company_id = $4 OR company_id IS NULL) RETURNING id, name, description, permissions";
      params = [JSON.stringify(cleanPerms), description, id, companyId];
    }
    const result = await pool.query(query, params);
    memoryCache.del(`admin:roles:${companyId}`);
    memoryCache.del(`admin:all:${companyId}`);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const getRoleModulePermissions = async (req: Request, res: Response) => {
  const { roleId, moduleId } = req.params;
  const companyId = (req as any).user?.company_id || 1;
  try {
    let result = await pool.query(
      "SELECT id, name, description, company_id, permissions, mobile_permissions FROM roles WHERE id = $1 AND (company_id = $2 OR company_id IS NULL)",
      [roleId, companyId]
    );
    if (result.rows.length === 0) {
      const numId = parseInt(roleId, 10);
      if (!isNaN(numId) && numId > 0) {
        const ins = await pool.query(
          "INSERT INTO roles (id, name, description, company_id, permissions) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name RETURNING id, name, description, company_id, permissions",
          [numId, `Role #${numId}`, 'Custom Assigned Role', companyId, JSON.stringify({})]
        );
        result = ins;
      }
    }
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Role not found" });
    }
    const role = result.rows[0];
    const perms = role.permissions || {};
    
    let decodedMod = moduleId || '';
    try {
      decodedMod = decodeURIComponent(moduleId || '');
    } catch (e) {
      decodedMod = moduleId || '';
    }
    const lowMod = decodedMod.toLowerCase().trim();
    const isProducts = (
      lowMod.includes('product') ||
      lowMod.includes('catalog') ||
      moduleId === 'Products%2FServices' ||
      moduleId === 'Products/Services'
    );
    const isKB = (
      lowMod.includes('knowledge') ||
      lowMod === 'kb' ||
      lowMod === 'knowledge_base' ||
      lowMod === 'knowledge%20base' ||
      moduleId === 'Knowledge Base' ||
      moduleId === 'Knowledge%20Base'
    );
    const isHome = (
      lowMod === 'home' ||
      lowMod === 'home / workspace' ||
      lowMod.includes('home') ||
      moduleId === 'Home'
    );

    const canon = isProducts ? 'Products/Services' :
                  isKB ? 'Knowledge Base' :
                  isHome ? 'Home' :
                  moduleId === 'HR Management' ? 'HR' :
                  moduleId === 'Sales CRM' ? 'CRM' :
                  moduleId === 'CRM Leads' ? 'Leads' :
                  moduleId === 'SOP Management' ? 'SOPs' :
                  (moduleId === 'Quality Assurance' || moduleId === 'qa' || moduleId === 'QA' || lowMod === 'qa') ? 'QA' :
                  moduleId === 'Training Hub' ? 'Training' :
                  moduleId === 'Kaizen Improvement' ? 'Kaizen' :
                  moduleId === 'Integration Hub' ? 'Integrations' :
                  moduleId === 'Performance & KPIs' ? 'KPIs' :
                  moduleId === 'Risk Register' ? 'Risk' : moduleId;

    const modulePerms = isProducts
      ? (perms['Products/Services'] || perms['Products%2FServices'] || perms['Products & Services'] || perms['Catalog'] || perms['catalog'] || perms['products'] || {})
      : isKB
      ? (perms['Knowledge Base'] || perms['Knowledge%20Base'] || perms['kb'] || perms['knowledge_base'] || perms['knowledge'] || {})
      : isHome
      ? (perms['Home'] || perms['home'] || perms['Home / Workspace'] || {})
      : (perms[canon] || perms[moduleId] || (canon === 'QA' ? (perms['QA'] || perms['Quality Assurance'] || perms['qa']) : null) || {});
    res.json({
      role: {
        id: role.id,
        name: role.name,
        description: role.description
      },
      moduleId,
      canonModule: canon,
      permissions: modulePerms
    });
  } catch (err) {
    console.error('getRoleModulePermissions error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
};

export const updateRoleModulePermissions = async (req: Request, res: Response) => {
  const { roleId, moduleId } = req.params;
  const { permissions } = req.body;
  const companyId = (req as any).user?.company_id || 1;
  try {
    let roleRes = await pool.query(
      "SELECT id, name, description, permissions FROM roles WHERE id = $1 AND (company_id = $2 OR company_id IS NULL)",
      [roleId, companyId]
    );
    if (roleRes.rows.length === 0) {
      const numId = parseInt(roleId, 10);
      if (!isNaN(numId) && numId > 0) {
        const ins = await pool.query(
          "INSERT INTO roles (id, name, description, company_id, permissions) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name RETURNING id, name, description, permissions",
          [numId, `Role #${numId}`, 'Custom Assigned Role', companyId, JSON.stringify({})]
        );
        roleRes = ins;
      }
    }
    if (roleRes.rows.length === 0) {
      return res.status(404).json({ error: "Role not found" });
    }
    const role = roleRes.rows[0];
    const allPerms = role.permissions || {};
    
    let decodedMod = moduleId || '';
    try {
      decodedMod = decodeURIComponent(moduleId || '');
    } catch (e) {
      decodedMod = moduleId || '';
    }
    const lowMod = decodedMod.toLowerCase().trim();
    const isProducts = (
      lowMod.includes('product') ||
      lowMod.includes('catalog') ||
      moduleId === 'Products%2FServices' ||
      moduleId === 'Products/Services'
    );
    const isKB = (
      lowMod.includes('knowledge') ||
      lowMod === 'kb' ||
      lowMod === 'knowledge_base' ||
      lowMod === 'knowledge%20base' ||
      moduleId === 'Knowledge Base' ||
      moduleId === 'Knowledge%20Base'
    );
    const isHome = (
      lowMod === 'home' ||
      lowMod === 'home / workspace' ||
      lowMod.includes('home') ||
      moduleId === 'Home'
    );

    const canon = isProducts ? 'Products/Services' :
                  isKB ? 'Knowledge Base' :
                  isHome ? 'Home' :
                  moduleId === 'HR Management' ? 'HR' :
                  moduleId === 'Sales CRM' ? 'CRM' :
                  moduleId === 'CRM Leads' ? 'Leads' :
                  moduleId === 'SOP Management' ? 'SOPs' :
                  (moduleId === 'Quality Assurance' || moduleId === 'qa' || moduleId === 'QA' || lowMod === 'qa') ? 'QA' :
                  moduleId === 'Training Hub' ? 'Training' :
                  moduleId === 'Kaizen Improvement' ? 'Kaizen' :
                  moduleId === 'Integration Hub' ? 'Integrations' :
                  moduleId === 'Performance & KPIs' ? 'KPIs' :
                  moduleId === 'Risk Register' ? 'Risk' : moduleId;

    allPerms[canon] = permissions;
    if (canon !== moduleId) {
      allPerms[moduleId] = permissions;
    }
    if (isProducts || canon === 'Products/Services') {
      allPerms['Products/Services'] = permissions;
      allPerms['Products%2FServices'] = permissions;
      allPerms['Products & Services'] = permissions;
      allPerms['Catalog'] = permissions;
      allPerms['catalog'] = permissions;
      allPerms['products'] = permissions;
    }
    if (isKB || canon === 'Knowledge Base') {
      allPerms['Knowledge Base'] = permissions;
      allPerms['Knowledge%20Base'] = permissions;
      allPerms['kb'] = permissions;
      allPerms['knowledge_base'] = permissions;
      allPerms['knowledge'] = permissions;
    }
    if (canon === 'QA' || canon === 'Quality Assurance' || lowMod === 'qa') {
      allPerms['QA'] = permissions;
      allPerms['Quality Assurance'] = permissions;
      allPerms['qa'] = permissions;
    }
    if (canon === 'HR' || lowMod === 'hr' || lowMod.includes('human')) {
      allPerms['HR'] = permissions;
      allPerms['HR Management'] = permissions;
      allPerms['hr'] = permissions;
      allPerms['hr_management'] = permissions;
    }
    if (canon === 'Home' || isHome) {
      allPerms['Home'] = permissions;
      allPerms['home'] = permissions;
      allPerms['Home / Workspace'] = permissions;
    }

    // Enforce Standardized RolePermissionPayload Schema Contract (Req 1)
    allPerms.role_id = String(roleId);
    if (!allPerms.modules || typeof allPerms.modules !== 'object') {
      allPerms.modules = {};
    }
    allPerms.modules[canon] = buildStandardModuleDefinition(permissions, canon);
    if (canon !== moduleId) {
      allPerms.modules[moduleId] = allPerms.modules[canon];
    }

    let updateRes = await pool.query(
      "UPDATE roles SET permissions = $1 WHERE id = $2 AND (company_id = $3 OR company_id IS NULL) RETURNING id, name, description, permissions",
      [JSON.stringify(allPerms), roleId, companyId]
    );

    if (!updateRes.rows || updateRes.rows.length === 0) {
      updateRes = await pool.query(
        "UPDATE roles SET permissions = $1 WHERE id = $2 RETURNING id, name, description, permissions",
        [JSON.stringify(allPerms), roleId]
      );
    }

    const updatedRole = (updateRes.rows && updateRes.rows[0]) ? updateRes.rows[0] : {
      id: Number(roleId),
      name: role?.name || `Role #${roleId}`,
      description: role?.description || ''
    };

    memoryCache.del(`admin:roles:${companyId}`);
    memoryCache.del(`admin:all:${companyId}`);

    res.json({
      success: true,
      role: {
        id: updatedRole.id,
        name: updatedRole.name,
        description: updatedRole.description
      },
      moduleId,
      canonModule: canon,
      permissions
    });
  } catch (err) {
    console.error('updateRoleModulePermissions error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
};

export const getRoleMobilePermissions = async (req: Request, res: Response) => {
  const roleId = req.params.id || (req.params as any).roleId;
  try {
    const roleRes = await pool.query(
      "SELECT id, name, description, permissions, mobile_permissions FROM roles WHERE id = $1",
      [roleId]
    );
    if (roleRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Role not found" });
    }
    const role = roleRes.rows[0];

    const defaults: Record<string, boolean> = {
      "/Attendance": true,
      "/Tasks": true,
      "/Chat": true,
      "/Alerts": true,
      "/Delivery": true
    };

    const currentMob = role.mobile_permissions || {};
    const mobile_permissions = { ...defaults, ...currentMob };

    const screens = [
      {
        id: "attendance",
        name: "Attendance",
        arabicName: "الحضور والانصراف",
        route: "/Attendance",
        description: "تسجيل الحضور والانصراف، الورديات، والطلبات الشخصية",
        icon: "Clock",
        enabled: mobile_permissions["/Attendance"] !== false,
        order: 1
      },
      {
        id: "tasks",
        name: "Tasks",
        arabicName: "المهام",
        route: "/Tasks",
        description: "قوائم المهام، المتابعة اليومية، وحالات الإنجاز",
        icon: "ClipboardList",
        enabled: mobile_permissions["/Tasks"] !== false,
        order: 2
      },
      {
        id: "chat",
        name: "Chat",
        arabicName: "المحادثات",
        route: "/Chat",
        description: "المحادثات المباشرة بين فرق العمل والقنوات الخاصة",
        icon: "MessageSquare",
        enabled: mobile_permissions["/Chat"] !== false,
        order: 3
      },
      {
        id: "notifications",
        name: "Notifications",
        arabicName: "الإشعارات",
        route: "/Alerts",
        description: "تنبيهات النظام اللحظية، الإعلانات، وتحديثات العمليات",
        icon: "Bell",
        enabled: mobile_permissions["/Alerts"] !== false,
        order: 4
      },
      {
        id: "delivery",
        name: "Delivery Tracking",
        arabicName: "تتبع التوصيل",
        route: "/Delivery",
        description: "متابعة مسارات المناديب، الطلبيات، والشحنات الحية",
        icon: "Truck",
        enabled: mobile_permissions["/Delivery"] !== false,
        order: 5
      }
    ];

    res.json({
      success: true,
      role_id: Number(role.id),
      role_name: role.name,
      mobile_permissions,
      screens
    });
  } catch (err: any) {
    console.error("getRoleMobilePermissions error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const updateRoleMobilePermissions = async (req: Request, res: Response) => {
  const roleId = req.params.id || (req.params as any).roleId;
  const companyId = (req as any).user?.company_id || 1;
  const incoming = req.body.mobile_permissions || req.body.permissions || req.body;

  try {
    const roleRes = await pool.query(
      "SELECT id, name, description, permissions, mobile_permissions FROM roles WHERE id = $1",
      [roleId]
    );
    if (roleRes.rows.length === 0) {
      return res.status(404).json({ success: false, error: "Role not found" });
    }
    const role = roleRes.rows[0];

    const defaults: Record<string, boolean> = {
      "/Attendance": true,
      "/Tasks": true,
      "/Chat": true,
      "/Alerts": true,
      "/Delivery": true
    };

    const currentMob = role.mobile_permissions || {};
    const newMob = { ...defaults, ...currentMob };

    if (incoming && typeof incoming === "object") {
      if (typeof incoming["/Attendance"] === "boolean") newMob["/Attendance"] = incoming["/Attendance"];
      if (typeof incoming["/Tasks"] === "boolean") newMob["/Tasks"] = incoming["/Tasks"];
      if (typeof incoming["/Chat"] === "boolean") newMob["/Chat"] = incoming["/Chat"];
      if (typeof incoming["/Alerts"] === "boolean") newMob["/Alerts"] = incoming["/Alerts"];
      if (typeof incoming["/Delivery"] === "boolean") newMob["/Delivery"] = incoming["/Delivery"];

      if (typeof incoming["attendance"] === "boolean") newMob["/Attendance"] = incoming["attendance"];
      if (typeof incoming["tasks"] === "boolean") newMob["/Tasks"] = incoming["tasks"];
      if (typeof incoming["chat"] === "boolean") newMob["/Chat"] = incoming["chat"];
      if (typeof incoming["notifications"] === "boolean") newMob["/Alerts"] = incoming["notifications"];
      if (typeof incoming["alerts"] === "boolean") newMob["/Alerts"] = incoming["alerts"];
      if (typeof incoming["delivery"] === "boolean") newMob["/Delivery"] = incoming["delivery"];
      if (typeof incoming["delivery_tracking"] === "boolean") newMob["/Delivery"] = incoming["delivery_tracking"];
    }

    const existingPerms = role.permissions || {};
    const updatedPerms = {
      ...existingPerms,
      mobile_permissions: { ...newMob },
      mobile_app: { ...newMob },
      "Mobile App": { ...newMob },
      "/Attendance": { view: newMob["/Attendance"], access: newMob["/Attendance"] },
      "/Tasks": { view: newMob["/Tasks"], access: newMob["/Tasks"] },
      "/Chat": { view: newMob["/Chat"], access: newMob["/Chat"] },
      "/Alerts": { view: newMob["/Alerts"], access: newMob["/Alerts"] },
      "/Delivery": { view: newMob["/Delivery"], access: newMob["/Delivery"] }
    };

    const updateRes = await pool.query(
      `UPDATE roles 
       SET mobile_permissions = $1, permissions = $2 
       WHERE id = $3 
       RETURNING id, name, description, permissions, mobile_permissions`,
      [JSON.stringify(newMob), JSON.stringify(updatedPerms), roleId]
    );

    memoryCache.del(`admin:roles:${companyId}`);
    memoryCache.del(`admin:all:${companyId}`);

    const screens = [
      {
        id: "attendance",
        name: "Attendance",
        arabicName: "الحضور والانصراف",
        route: "/Attendance",
        description: "تسجيل الحضور والانصراف، الورديات، والطلبات الشخصية",
        icon: "Clock",
        enabled: newMob["/Attendance"] !== false,
        order: 1
      },
      {
        id: "tasks",
        name: "Tasks",
        arabicName: "المهام",
        route: "/Tasks",
        description: "قوائم المهام، المتابعة اليومية، وحالات الإنجاز",
        icon: "ClipboardList",
        enabled: newMob["/Tasks"] !== false,
        order: 2
      },
      {
        id: "chat",
        name: "Chat",
        arabicName: "المحادثات",
        route: "/Chat",
        description: "المحادثات المباشرة بين فرق العمل والقنوات الخاصة",
        icon: "MessageSquare",
        enabled: newMob["/Chat"] !== false,
        order: 3
      },
      {
        id: "notifications",
        name: "Notifications",
        arabicName: "الإشعارات",
        route: "/Alerts",
        description: "تنبيهات النظام اللحظية، الإعلانات، وتحديثات العمليات",
        icon: "Bell",
        enabled: newMob["/Alerts"] !== false,
        order: 4
      },
      {
        id: "delivery",
        name: "Delivery Tracking",
        arabicName: "تتبع التوصيل",
        route: "/Delivery",
        description: "متابعة مسارات المناديب، الطلبيات، والشحنات الحية",
        icon: "Truck",
        enabled: newMob["/Delivery"] !== false,
        order: 5
      }
    ];

    res.json({
      success: true,
      role_id: Number(roleId),
      role_name: role.name,
      mobile_permissions: newMob,
      permissions: updatedPerms,
      screens
    });
  } catch (err: any) {
    console.error("updateRoleMobilePermissions error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const getOrgChart = async (req: Request, res: Response) => {
  const companyId = (req as any).user?.company_id || 1;
  try {
    const result = await pool.query(`
      SELECT u.id, u.name, u.job_title, u.team_name, u.reporting_to, u.department_id, d.name as department_name, u.avatar_url
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.status = 'active' AND u.company_id = $1
    `, [companyId]);
    
    const users = result.rows;
    const userMap: Record<number, any> = {};
    const rootNodes: any[] = [];

    users.forEach(u => {
      userMap[u.id] = { ...u, children: [] };
    });

    users.forEach(u => {
      if (u.reporting_to && userMap[u.reporting_to]) {
        userMap[u.reporting_to].children.push(userMap[u.id]);
      } else {
        rootNodes.push(userMap[u.id]);
      }
    });

    res.json(rootNodes);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

// --- Department Management ---
export const getDepartments = async (req: Request, res: Response) => {
  const companyId = (req as any).user?.company_id || 1;
  const cacheKey = `admin:departments:${companyId}`;
  const cached = memoryCache.get(cacheKey);
  if (cached) {
    return res.json(cached);
  }
  try {
    const result = await pool.query(`
      SELECT d.*, u.name as head_name
      FROM departments d
      LEFT JOIN users u ON d.department_head_id = u.id
      WHERE d.company_id = $1
      ORDER BY d.id ASC
    `, [companyId]);
    memoryCache.set(cacheKey, result.rows, 120); // 2 minutes
    res.json(result.rows);
  } catch (err) {
    console.error('getDepartments error:', err);
    res.json([]);
  }
};

export const createDepartment = async (req: Request, res: Response) => {
  const { name, description, department_head_id, is_executive, teams, job_titles } = req.body;
  const companyId = (req as any).user?.company_id || 1;
  try {
    const safeTeams = typeof teams === 'string' ? teams : JSON.stringify(teams || []);
    const safeJobTitles = typeof job_titles === 'string' ? job_titles : JSON.stringify(job_titles || []);
    const result = await pool.query(
      "INSERT INTO departments (name, description, department_head_id, company_id, is_executive, teams, job_titles) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb) RETURNING *",
      [name, description || '', department_head_id || null, companyId, is_executive || false, safeTeams, safeJobTitles]
    );
    
    // Log action
    await pool.query(
      "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, company_id) VALUES ($1, $2, $3, $4, $5, $6)",
      [1, 'CREATE', 'department', result.rows[0].id, `Created department: ${name}`, companyId]
    );

    memoryCache.del(`admin:departments:${companyId}`);
    memoryCache.del(`admin:all:${companyId}`);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const updateDepartment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, department_head_id, is_executive, teams, job_titles } = req.body;
  const companyId = (req as any).user?.company_id || 1;
  try {
    const safeTeams = typeof teams === 'string' ? teams : JSON.stringify(teams || []);
    const safeJobTitles = typeof job_titles === 'string' ? job_titles : JSON.stringify(job_titles || []);
    const result = await pool.query(
      "UPDATE departments SET name = COALESCE($1, name), description = $2, department_head_id = $3, is_executive = $4, teams = $5::jsonb, job_titles = $6::jsonb, updated_at = CURRENT_TIMESTAMP WHERE id = $7 AND (company_id = $8 OR company_id IS NULL) RETURNING *",
      [name, description || '', department_head_id || null, is_executive || false, safeTeams, safeJobTitles, id, companyId]
    );

    // Log action
    await pool.query(
      "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, company_id) VALUES ($1, $2, $3, $4, $5, $6)",
      [1, 'UPDATE', 'department', id, `Updated department: ${name}`, companyId]
    );

    memoryCache.del(`admin:departments:${companyId}`);
    memoryCache.del(`admin:all:${companyId}`);

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const deleteDepartment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const companyId = (req as any).user?.company_id || 1;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const tablesToNullify = [
      'users',
      'hr_employees',
      'subdepartments',
      'positions',
      'teams',
      'sops',
      'improvements',
      'crm_assignment_rules',
      'article_categories',
      'qa_forms',
      'qa_evaluations',
      'qa_capa',
      'training_quizzes',
      'kpis',
      'hr_job_openings',
      'risks',
      'assets',
      'documents',
      'budgets',
      'tasks',
      'projects'
    ];

    for (const table of tablesToNullify) {
      try {
        await client.query(`UPDATE ${table} SET department_id = NULL WHERE department_id = $1`, [id]);
      } catch (e) {
        // Table or column might not exist or fail if NOT NULL constraint exists; continue safely
      }
    }

    await client.query("DELETE FROM departments WHERE id = $1 AND company_id = $2", [id, companyId]);
    
    // Log action
    await client.query(
      "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, company_id) VALUES ($1, $2, $3, $4, $5, $6)",
      [1, 'DELETE', 'department', id, `Deleted department ID: ${id}`, companyId]
    );

    await client.query('COMMIT');
    memoryCache.del(`admin:departments:${companyId}`);
    memoryCache.del(`admin:all:${companyId}`);
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("❌ Database Query Error in deleteDepartment:", err);
    res.status(500).json({ error: (err as Error).message });
  } finally {
    client.release();
  }
};

// --- System Status Management ---
export const getGlobalStatuses = async (req: Request, res: Response) => {
  const companyId = (req as any).user?.company_id || 1;
  const cacheKey = `admin:statuses:${companyId}`;
  const cached = memoryCache.get(cacheKey);
  if (cached) {
    return res.json(cached);
  }
  try {
    const result = await pool.query("SELECT id, module_id, status_key, value, label, color, is_default, order_index, company_id FROM global_statuses WHERE company_id = $1 ORDER BY module_id, order_index ASC", [companyId]);
    memoryCache.set(cacheKey, result.rows, 120); // 2 minutes
    res.json(result.rows);
  } catch (err) {
    console.error('getGlobalStatuses error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
};

export const createGlobalStatus = async (req: Request, res: Response) => {
  const { module_id, status_key, value, label, color, is_default, order_index } = req.body;
  const companyId = (req as any).user?.company_id || 1;
  const authUserId = (req as any).user?.id || 1;
  try {
    if (!module_id) {
      return res.status(400).json({ error: "module_id is required" });
    }
    if (is_default) {
      await pool.query("UPDATE global_statuses SET is_default = FALSE WHERE module_id = $1 AND company_id = $2", [module_id, companyId]);
    }
    const finalValue = value || status_key;
    const finalKey = status_key || value;

    const result = await pool.query(
      "INSERT INTO global_statuses (module_id, status_key, value, label, color, is_default, order_index, company_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
      [module_id, finalKey, finalValue, label, color, is_default, order_index || 0, companyId]
    );

    await logAction(authUserId, 'CREATE', 'Status', result.rows[0].id, { label, module_id });

    memoryCache.del(`admin:statuses:${companyId}`);
    memoryCache.del(`admin:all:${companyId}`);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('createGlobalStatus error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
};

export const updateGlobalStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { label, color, is_default, module_id, order_index, value, status_key } = req.body;
  const authUserId = parseInt(req.headers['x-user-id'] as string) || 1;
  const companyId = (req as any).user?.company_id || 1;
  try {
    if (is_default) {
      await pool.query("UPDATE global_statuses SET is_default = FALSE WHERE module_id = $1", [module_id]);
    }
    const result = await pool.query(
      "UPDATE global_statuses SET label = $1, color = $2, is_default = $3, order_index = $4, value = $5, status_key = $6 WHERE id = $7 RETURNING *",
      [label, color, is_default, order_index || 0, value || status_key, status_key || value, id]
    );

    await logAction(authUserId, 'UPDATE', 'Status', parseInt(id), { label });

    memoryCache.del(`admin:statuses:${companyId}`);
    memoryCache.del(`admin:all:${companyId}`);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('updateGlobalStatus error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
};

export const deleteGlobalStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const authUserId = parseInt(req.headers['x-user-id'] as string) || 1;
  const companyId = (req as any).user?.company_id || 1;
  try {
    await pool.query("DELETE FROM global_statuses WHERE id = $1", [id]);
    await logAction(authUserId, 'DELETE', 'Status', parseInt(id));

    memoryCache.del(`admin:statuses:${companyId}`);
    memoryCache.del(`admin:all:${companyId}`);

    res.json({ success: true });
  } catch (err) {
    console.error('deleteGlobalStatus error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
};

// --- Module Management ---
export const getSystemModules = async (req: Request, res: Response) => {
  try {
    // Ensure all 25 modules exist in the system_modules table
    await pool.query(`
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

    const result = await pool.query("SELECT * FROM system_modules ORDER BY order_index ASC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const createSystemModule = async (req: Request, res: Response) => {
  const { id, name, is_active, order_index, metadata } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO system_modules (id, name, is_active, order_index, metadata) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [
        id, 
        name, 
        is_active !== undefined ? is_active : true, 
        order_index || 0, 
        metadata ? JSON.stringify(metadata) : '{}'
      ]
    );

    // Log action
    await pool.query(
      "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)",
      [1, 'CREATE_MODULE', 'module', 0, `Created module: ${name} (${id})`]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const updateSystemModule = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { is_active, order_index, name, metadata } = req.body;
  try {
    let query = "UPDATE system_modules SET updated_at = CURRENT_TIMESTAMP";
    const params: any[] = [id];
    let paramCount = 2;

    if (is_active !== undefined) {
      query += `, is_active = $${paramCount++}`;
      params.push(is_active);
    }
    if (order_index !== undefined) {
      query += `, order_index = $${paramCount++}`;
      params.push(order_index);
    }
    if (name !== undefined) {
      query += `, name = $${paramCount++}`;
      params.push(name);
    }
    if (metadata !== undefined) {
      query += `, metadata = $${paramCount++}`;
      params.push(typeof metadata === 'string' ? metadata : JSON.stringify(metadata));
    }

    query += " WHERE id = $1 RETURNING *";

    const result = await pool.query(query, params);

    // Log action
    await pool.query(
      "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)",
      [1, 'UPDATE_MODULE', 'module', 0, `Updated module ${id}`]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const deleteSystemModule = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await pool.query("DELETE FROM system_modules WHERE id = $1", [id]);

    // Log action
    await pool.query(
      "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)",
      [1, 'DELETE_MODULE', 'module', 0, `Deleted module ${id}`]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

// --- Audit Logs ---
export const getAuditLogs = async (req: Request, res: Response) => {
  const companyId = (req as any).user?.company_id || 1;
  const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : (page ? 25 : undefined);
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const moduleQuery = req.query.module ? String(req.query.module) : undefined;
  const userIdQuery = req.query.userId ? String(req.query.userId) : undefined;
  const dateQuery = req.query.date ? String(req.query.date).trim() : undefined;

  try {
    let whereClause = `WHERE a.company_id = $1`;
    const params: any[] = [companyId];

    if (moduleQuery && moduleQuery !== 'all') {
      params.push(moduleQuery);
      whereClause += ` AND a.entity_type = $${params.length}`;
    }

    if (userIdQuery && userIdQuery !== 'all') {
      params.push(parseInt(userIdQuery, 10));
      whereClause += ` AND a.user_id = $${params.length}`;
    }

    if (dateQuery) {
      params.push(dateQuery);
      whereClause += ` AND DATE(a.created_at) = $${params.length}`;
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      whereClause += ` AND (
        LOWER(a.action) LIKE $${params.length} 
        OR LOWER(COALESCE(a.entity_type, '')) LIKE $${params.length} 
        OR LOWER(COALESCE(a.details, '')) LIKE $${params.length} 
        OR LOWER(COALESCE(u.name, '')) LIKE $${params.length}
      )`;
    }

    if (page !== undefined && limit !== undefined) {
      const countRes = await pool.query(`
        SELECT COUNT(a.id) as total
        FROM audit_logs a
        LEFT JOIN users u ON a.user_id = u.id
        ${whereClause}
      `, params);
      const total = parseInt(countRes.rows[0]?.total || '0', 10);
      const offset = Math.max(0, (page - 1) * limit);

      const queryParams = [...params, limit, offset];
      const result = await pool.query(`
        SELECT a.id, a.user_id, a.action, a.entity_type, a.entity_id, a.details, a.created_at, u.name as user_name, u.email as user_email
        FROM audit_logs a
        LEFT JOIN users u ON a.user_id = u.id
        ${whereClause}
        ORDER BY a.created_at DESC
        LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
      `, queryParams);

      return res.json({
        logs: result.rows,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      });
    }

    const result = await pool.query(`
      SELECT a.id, a.user_id, a.action, a.entity_type, a.entity_id, a.details, a.created_at, u.name as user_name, u.email as user_email
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT 100
    `, params);

    res.json(result.rows);
  } catch (err) {
    console.error('getAuditLogs error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
};

export const getAdminData = async (req: Request, res: Response) => {
  const companyId = (req as any).user?.company_id || 1;
  const cacheKey = `admin:all:${companyId}`;
  const cached = memoryCache.get(cacheKey);
  if (cached) {
    return res.json(cached);
  }
  try {
    const [users, roles] = await Promise.all([
      pool.query(`
        SELECT u.id, u.name, u.email, u.username, u.role_id, u.department_id, u.job_title, 
               u.team_name, u.reporting_to, u.status, u.is_super_admin, u.training_points, 
               u.avatar_url, u.company_id, u.created_at,
               r.name as role_name, d.name as department_name, m.name as manager_name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        LEFT JOIN departments d ON u.department_id = d.id
        LEFT JOIN users m ON u.reporting_to = m.id
        WHERE u.company_id = $1
        ORDER BY u.id ASC
      `, [companyId]),
      pool.query("SELECT id, name, description, company_id, permissions, mobile_permissions FROM roles WHERE company_id = $1 OR company_id IS NULL ORDER BY id ASC", [companyId])
    ]);

    const [departments, statuses, modules] = await Promise.all([
      pool.query("SELECT id, name, description, department_head_id, company_id, is_executive, teams, job_titles FROM departments WHERE company_id = $1 ORDER BY id ASC", [companyId]),
      pool.query("SELECT id, module_id, status_key, value, label, color, is_default, order_index, company_id FROM global_statuses WHERE company_id = $1 ORDER BY module_id, order_index ASC", [companyId]),
      pool.query("SELECT id, name, is_active, order_index FROM system_modules ORDER BY order_index ASC")
    ]);

    const payload = {
      users: users.rows,
      roles: roles.rows,
      departments: departments.rows,
      statuses: statuses.rows,
      modules: modules.rows
    };
    memoryCache.set(cacheKey, payload, 300); // 5 minutes cache to prevent repetitive DB queries
    res.json(payload);
  } catch (err) {
    console.error('getAdminData error:', err);
    // Return empty structures if DB is briefly busy during boot
    res.json({ users: [], roles: [], departments: [], statuses: [], modules: [] });
  }
};

export const getSystemHealth = async (req: Request, res: Response) => {
  try {
    const dbCheck = await pool.query("SELECT 1");
    res.json({ 
      status: "ok", 
      database: dbCheck.rows.length > 0 ? "connected" : "error",
      timestamp: new Date().toISOString(),
      modules: 14
    });
  } catch (err) {
    res.status(500).json({ status: "error", database: "disconnected", error: (err as Error).message });
  }
};

export const createAuditLog = async (req: Request, res: Response) => {
  const { module, action, record_id, details, user_id } = req.body;
  const authUserId = (req as any).user?.id || user_id || 1; 
  const companyId = (req as any).user?.company_id || 1;

  try {
    const result = await pool.query(
      "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, company_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [
        authUserId, 
        action, 
        module, 
        record_id && !isNaN(parseInt(record_id)) ? parseInt(record_id) : null, 
        typeof details === 'object' ? JSON.stringify(details) : details,
        companyId
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('createAuditLog error:', err);
    res.status(500).json({ error: (err as Error).message });
  }
};

export const getCompanyDetails = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user?.company_id || 1;
    let result = await pool.query(
      `SELECT id, name, subdomain, corporate_domain, corporate_domains, logo_url, settings, created_at 
       FROM companies 
       WHERE id = $1`,
      [companyId]
    );

    if (result.rows.length === 0) {
      result = await pool.query(
        `SELECT id, name, subdomain, corporate_domain, corporate_domains, logo_url, settings, created_at 
         FROM companies 
         ORDER BY id ASC 
         LIMIT 1`
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Company not found" });
    }

    const company = result.rows[0];
    
    // Normalize corporate_domains
    let domains: string[] = [];
    if (Array.isArray(company.corporate_domains)) {
      domains = company.corporate_domains;
    } else if (company.corporate_domain) {
      domains = company.corporate_domain.split(',').map((d: string) => d.trim()).filter(Boolean);
    }

    // Include primary domain if not in list
    if (company.corporate_domain && !domains.includes(company.corporate_domain)) {
      domains.unshift(company.corporate_domain);
    }

    // Get counts of employees and users
    const countsRes = await pool.query(
      `SELECT 
        (SELECT COUNT(*) FROM hr_employees WHERE company_id = $1) as employees_count,
        (SELECT COUNT(*) FROM users WHERE company_id = $1) as users_count,
        (SELECT COUNT(*) FROM users WHERE company_id = $1 AND auth_method = 'corporate_sso') as sso_users_count`,
      [company.id]
    );

    return res.json({
      ...company,
      corporate_domain: company.corporate_domain || domains[0] || null,
      corporate_domains: domains,
      employees_count: parseInt(countsRes.rows[0]?.employees_count || "0", 10),
      users_count: parseInt(countsRes.rows[0]?.users_count || "0", 10),
      sso_users_count: parseInt(countsRes.rows[0]?.sso_users_count || "0", 10)
    });
  } catch (err: any) {
    console.error("getCompanyDetails error:", err);
    return res.status(500).json({ error: err.message });
  }
};

export const updateCompanyDetails = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user?.company_id || 1;
    const { 
      name, 
      subdomain, 
      corporate_domain, 
      corporate_domains, 
      logo_url, 
      settings 
    } = req.body;

    // Validate and clean corporate domains list
    let cleanDomains: string[] = [];
    if (Array.isArray(corporate_domains)) {
      cleanDomains = corporate_domains
        .map((d: any) => String(d || '').toLowerCase().trim().replace(/^https?:\/\//, '').replace(/^@/, ''))
        .filter((d: string) => d.includes('.') && d.length >= 4);
    } else if (typeof corporate_domain === 'string' && corporate_domain.trim()) {
      cleanDomains = corporate_domain
        .split(',')
        .map((d: string) => d.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/^@/, ''))
        .filter((d: string) => d.includes('.') && d.length >= 4);
    }

    // Deduplicate
    cleanDomains = Array.from(new Set(cleanDomains));

    const primaryDomain = corporate_domain && typeof corporate_domain === 'string' && corporate_domain.trim()
      ? corporate_domain.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/^@/, '')
      : (cleanDomains[0] || null);

    if (primaryDomain && !cleanDomains.includes(primaryDomain)) {
      cleanDomains.unshift(primaryDomain);
    }

    // Fetch existing company record
    let existRes = await pool.query('SELECT * FROM companies WHERE id = $1', [companyId]);
    if (existRes.rows.length === 0) {
      existRes = await pool.query('SELECT * FROM companies ORDER BY id ASC LIMIT 1');
    }
    const existing = existRes.rows[0] || {};
    const targetId = existing.id || companyId;

    const updatedName = name !== undefined ? name : (existing.name || 'Systo Biz');
    const updatedSubdomain = subdomain !== undefined ? subdomain : (existing.subdomain || 'main');
    const targetLogo = logo_url !== undefined ? logo_url : (req.body.logoUrl !== undefined ? req.body.logoUrl : (existing.logo_url || null));
    const updatedLogoUrl = targetLogo;
    const mergedSettings = { ...(existing.settings || {}), ...(settings || {}) };

    const updateRes = await pool.query(
      `UPDATE companies 
       SET name = $1, 
           subdomain = $2, 
           corporate_domain = $3, 
           corporate_domains = $4::jsonb, 
           logo_url = $5, 
           settings = $6::jsonb 
       WHERE id = $7 
       RETURNING *`,
      [
        updatedName,
        updatedSubdomain,
        primaryDomain,
        JSON.stringify(cleanDomains),
        updatedLogoUrl,
        JSON.stringify(mergedSettings),
        targetId
      ]
    );

    const updated = updateRes.rows[0];

    // Audit log
    const authUserId = (req as any).user?.id || 1;
    try {
      await pool.query(
        "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, company_id) VALUES ($1, $2, $3, $4, $5, $6)",
        [
          authUserId,
          'UPDATE_CORPORATE_BRANDING',
          'Company',
          targetId,
          JSON.stringify({ 
            name: updatedName, 
            primaryDomain, 
            corporate_domains: cleanDomains 
          }),
          targetId
        ]
      );
    } catch (e) {
      console.warn("Failed to create audit log for branding update:", e);
    }

    return res.json({
      success: true,
      message: "Company details and corporate domains updated successfully.",
      company: {
        ...updated,
        corporate_domain: primaryDomain,
        corporate_domains: cleanDomains
      }
    });
  } catch (err: any) {
    console.error("updateCompanyDetails error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// ==========================================
// GEOFENCE & ATTENDANCE PERIMETER CONTROLLER
// ==========================================

export function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export const getGeofences = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user?.company_id || 1;
    const result = await pool.query(
      `SELECT id, company_id, name, code, latitude::float, longitude::float, allowed_radius_meters, is_active, address, created_at, updated_at
       FROM public.company_geofence_locations
       WHERE company_id = $1
       ORDER BY is_active DESC, id ASC`,
      [companyId]
    );

    // If empty for this company, ensure a default HQ row exists
    if (result.rows.length === 0) {
      const defaultInsert = await pool.query(
        `INSERT INTO public.company_geofence_locations 
         (company_id, name, code, latitude, longitude, allowed_radius_meters, is_active, address)
         VALUES ($1, 'Main Corporate Headquarters', 'HQ-MAIN', 30.0444, 31.2357, 100, true, 'Main Head Office, Downtown Central Tower, Cairo, Egypt')
         RETURNING id, company_id, name, code, latitude::float, longitude::float, allowed_radius_meters, is_active, address, created_at, updated_at`,
        [companyId]
      );
      return res.json(defaultInsert.rows);
    }

    return res.json(result.rows);
  } catch (err: any) {
    console.error("getGeofences error:", err);
    return res.status(500).json({ error: err.message || "Failed to retrieve geofence locations" });
  }
};

export const createGeofence = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user?.company_id || 1;
    const { name, code, latitude, longitude, allowed_radius_meters, is_active, address } = req.body;

    if (!name || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: "Location name, latitude, and longitude are required." });
    }

    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const radius = parseInt(allowed_radius_meters, 10) || 100;

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({ error: "Invalid latitude or longitude values." });
    }

    const result = await pool.query(
      `INSERT INTO public.company_geofence_locations 
       (company_id, name, code, latitude, longitude, allowed_radius_meters, is_active, address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, company_id, name, code, latitude::float, longitude::float, allowed_radius_meters, is_active, address, created_at, updated_at`,
      [companyId, name.trim(), (code || 'BR-01').trim(), lat, lon, radius, is_active !== false, address?.trim() || null]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err: any) {
    console.error("createGeofence error:", err);
    return res.status(500).json({ error: err.message || "Failed to create geofence location" });
  }
};

export const updateGeofence = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user?.company_id || 1;
    const { id } = req.params;
    const { name, code, latitude, longitude, allowed_radius_meters, is_active, address } = req.body;

    const lat = latitude !== undefined ? parseFloat(latitude) : undefined;
    const lon = longitude !== undefined ? parseFloat(longitude) : undefined;
    const radius = allowed_radius_meters !== undefined ? parseInt(allowed_radius_meters, 10) : undefined;

    const existingRes = await pool.query(
      `SELECT * FROM public.company_geofence_locations WHERE id = $1 AND company_id = $2`,
      [id, companyId]
    );

    if (existingRes.rows.length === 0) {
      return res.status(404).json({ error: "Geofence location not found" });
    }

    const result = await pool.query(
      `UPDATE public.company_geofence_locations
       SET name = COALESCE($1, name),
           code = COALESCE($2, code),
           latitude = COALESCE($3, latitude),
           longitude = COALESCE($4, longitude),
           allowed_radius_meters = COALESCE($5, allowed_radius_meters),
           is_active = COALESCE($6, is_active),
           address = COALESCE($7, address),
           updated_at = NOW()
       WHERE id = $8 AND company_id = $9
       RETURNING id, company_id, name, code, latitude::float, longitude::float, allowed_radius_meters, is_active, address, created_at, updated_at`,
      [
        name ? name.trim() : null,
        code ? code.trim() : null,
        lat !== undefined && !isNaN(lat) ? lat : null,
        lon !== undefined && !isNaN(lon) ? lon : null,
        radius !== undefined && !isNaN(radius) ? radius : null,
        is_active !== undefined ? Boolean(is_active) : null,
        address !== undefined ? address : null,
        id,
        companyId
      ]
    );

    return res.json(result.rows[0]);
  } catch (err: any) {
    console.error("updateGeofence error:", err);
    return res.status(500).json({ error: err.message || "Failed to update geofence location" });
  }
};

export const deleteGeofence = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user?.company_id || 1;
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM public.company_geofence_locations WHERE id = $1 AND company_id = $2 RETURNING id`,
      [id, companyId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Geofence location not found" });
    }

    return res.json({ success: true, message: "Geofence location deleted successfully" });
  } catch (err: any) {
    console.error("deleteGeofence error:", err);
    return res.status(500).json({ error: err.message || "Failed to delete geofence location" });
  }
};

export const verifyAttendancePerimeter = async (req: Request, res: Response) => {
  try {
    const companyId = (req as any).user?.company_id || 1;
    const { latitude, longitude, branch_id } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: "Employee latitude and longitude are required." });
    }

    const empLat = parseFloat(latitude);
    const empLon = parseFloat(longitude);

    let query = `SELECT id, name, code, latitude::float, longitude::float, allowed_radius_meters, is_active, address
                 FROM public.company_geofence_locations
                 WHERE company_id = $1 AND is_active = true`;
    const params: any[] = [companyId];

    if (branch_id) {
      query += ` AND id = $2`;
      params.push(branch_id);
    }

    const branchesRes = await pool.query(query, params);

    if (branchesRes.rows.length === 0) {
      return res.status(404).json({ 
        can_clock_in: false, 
        message: "No active geofence locations found for this organization." 
      });
    }

    let nearestBranch: any = null;
    let minDistance = Infinity;

    for (const b of branchesRes.rows) {
      const dist = calculateHaversineDistance(empLat, empLon, b.latitude, b.longitude);
      if (dist < minDistance) {
        minDistance = dist;
        nearestBranch = { ...b, distance_meters: dist };
      }
    }

    const isWithin = nearestBranch ? minDistance <= nearestBranch.allowed_radius_meters : false;

    return res.json({
      can_clock_in: isWithin,
      distance_meters: minDistance,
      allowed_radius_meters: nearestBranch?.allowed_radius_meters || 100,
      nearest_branch: nearestBranch,
      message_en: isWithin 
        ? `Within perimeter (${minDistance}m from ${nearestBranch?.name}). Fingerprint enabled.`
        : `You are outside the authorized attendance perimeter (${minDistance}m away, allowed: ${nearestBranch?.allowed_radius_meters}m).`,
      message_ar: isWithin
        ? `داخل النطاق المسموح (${minDistance} متر عن ${nearestBranch?.name}). تم تفعيل البصمة.`
        : `أنت خارج نطاق المقر المسموح للبصمة (${minDistance} متر، المسموح: ${nearestBranch?.allowed_radius_meters} متر).`
    });
  } catch (err: any) {
    console.error("verifyAttendancePerimeter error:", err);
    return res.status(500).json({ error: err.message || "Failed to verify attendance perimeter" });
  }
};
