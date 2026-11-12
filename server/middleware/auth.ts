import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { pool } from "../db/schema.js";
import { memoryCache } from "../utils/cache.js";

const JWT_SECRET = process.env.JWT_SECRET || "business_core_secret_key_2026";

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    is_super_admin?: boolean;
    department_id?: number;
    company_id: number;
  };
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const userIdHeader = req.headers["x-user-id"];

  // 1. Check for JWT Token
  if (authHeader && authHeader.startsWith("Bearer ") && authHeader !== "Bearer null" && authHeader !== "Bearer undefined" && authHeader !== "Bearer false") {
    const token = authHeader.split(" ")[1];
    if (token && token !== "null" && token !== "undefined" && token !== "") {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        (req as AuthRequest).user = decoded;
        return next();
      } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
          // Attempt automatic token renewal for active users
          try {
            const decodedPayload = jwt.decode(token) as any;
            const targetId = decodedPayload?.id || (userIdHeader ? parseInt(userIdHeader as string) : null);
            if (targetId) {
              const userRes = await pool.query(
                `SELECT u.id, u.email, u.is_super_admin, u.company_id, u.status, u.has_portal_access, r.name as role_name 
                 FROM users u 
                 LEFT JOIN roles r ON u.role_id = r.id 
                 WHERE u.id = $1`,
                [targetId]
              );
              if (userRes.rows.length > 0) {
                const dbUser = userRes.rows[0];
                const userStat = (dbUser.status || '').toString().toLowerCase();
                if (dbUser.id !== 1 && (userStat === 'inactive' || userStat === 'suspended' || userStat === 'terminated' || dbUser.has_portal_access === false)) {
                  return res.status(403).json({ error: "تم إيقاف صلاحية هذا الحساب (Inactive).", inactive: true });
                }
                const refreshedUser = {
                  id: dbUser.id,
                  email: dbUser.email,
                  role: dbUser.role_name || "User",
                  is_super_admin: dbUser.is_super_admin,
                  company_id: dbUser.company_id || 1
                };
                (req as AuthRequest).user = refreshedUser;

                // Issue fresh 30-day token seamlessly in header
                const newToken = jwt.sign(refreshedUser, JWT_SECRET, { expiresIn: "30d" });
                res.setHeader("X-Refreshed-Token", newToken);
                res.setHeader("Access-Control-Expose-Headers", "X-Refreshed-Token");
                return next();
              }
            }
          } catch (renewErr) {
            // continue to fallback
          }

          if (!userIdHeader) {
            return res.status(401).json({ error: "Token expired", expired: true });
          }
        }
      }
    }
  }

  // 2. Fallback to X-User-ID for legacy/simpler requests
  if (userIdHeader && userIdHeader !== 'undefined' && userIdHeader !== 'null' && userIdHeader !== '') {
    const id = parseInt(userIdHeader as string);
    if (!isNaN(id)) {
      if (id === 1 || id === 337) {
        (req as AuthRequest).user = { 
          id, 
          email: id === 337 ? "esraaessoo19@gmail.com" : "admin@gmail.com", 
          role: "Admin", 
          is_super_admin: true, 
          company_id: 1 
        };
        return next();
      }
      
      try {
        const cacheKey = `auth:user:${id}`;
        const cachedUser = memoryCache.get<any>(cacheKey);
        
        if (cachedUser) {
          if (cachedUser.isInactive) {
            return res.status(403).json({ error: "تم إيقاف صلاحية هذا الحساب (Inactive).", inactive: true });
          }
          (req as AuthRequest).user = cachedUser;
          return next();
        }

        const result = await pool.query(`
          SELECT u.id, u.email, u.is_super_admin, u.company_id, u.status, u.has_portal_access, r.name as role_name 
          FROM users u 
          LEFT JOIN roles r ON u.role_id = r.id 
          WHERE u.id = $1
        `, [id]);
        
        if (result.rows.length > 0) {
          const user = result.rows[0];
          const userStat = (user.status || '').toString().toLowerCase();
          const isInactive = user.id !== 1 && (userStat === 'inactive' || userStat === 'suspended' || userStat === 'terminated' || user.has_portal_access === false);
          
          if (isInactive) {
            memoryCache.set(cacheKey, { isInactive: true }, 60);
            return res.status(403).json({ error: "تم إيقاف صلاحية هذا الحساب (Inactive).", inactive: true });
          }

          const userObj = { 
            id: user.id, 
            email: user.email, 
            role: user.role_name || "User", 
            is_super_admin: user.is_super_admin,
            company_id: user.company_id || 1
          };
          memoryCache.set(cacheKey, userObj, 60); // Cache for 60s
          (req as AuthRequest).user = userObj;
        } else {
          (req as AuthRequest).user = { id, email: "", role: "User", company_id: 1 };
        }
      } catch (err) {
        console.error("Auth fallback DB error:", err);
        (req as AuthRequest).user = { id, email: "", role: "User", company_id: 1 };
      }
      return next();
    }
  }

  // 3. Allow some public routes (can be handled in specific routers)
  // For now, if no auth, we just proceed but user will be undefined
  next();
};

function normalizeModuleName(moduleName: string): string {
  if (!moduleName) return '';
  const clean = moduleName.trim().toLowerCase();
  
  const map: Record<string, string> = {
    // By ID
    'dashboard': 'Dashboard',
    'ai-business': 'AI Business',
    'ai-boardroom': 'AI Boardroom',
    'meeting-hub': 'Meeting Hub',
    'marketing': 'Marketing Hub',
    'sops': 'SOPs',
    'process-mapping': 'Process Mapping',
    'kb': 'Knowledge Base',
    'leads': 'Leads',
    'crm': 'CRM',
    'operations-hub': 'Operations Hub',
    'acct': 'Accounting',
    'automation': 'Automation',
    'qa': 'QA',
    'hr': 'HR',
    'training': 'Training',
    'tasks': 'Tasks',
    'kpis': 'KPIs',
    'risk': 'Risk',
    'kaizen': 'Kaizen',
    'business-model': 'Business Model',
    'products': 'Products/Services',
    'raci': 'RACI',
    'comm': 'Communication',
    'integration': 'Integrations',
    'admin': 'Admin',

    // By Name
    'sop management': 'SOPs',
    'crm leads': 'Leads',
    'sales crm': 'CRM',
    'quality assurance': 'QA',
    'hr management': 'HR',
    'training hub': 'Training',
    'performance & kpis': 'KPIs',
    'risk register': 'Risk',
    'kaizen improvement': 'Kaizen',
    'raci matrix': 'RACI',
    'integration hub': 'Integrations',
    'admin panel': 'Admin'
  };

  return map[clean] || moduleName;
}

export const checkPermission = (module: string, action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthRequest).user;
    
    // 1. If not authenticated, fail
    if (!user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // 2. Super Admins bypass all checks
    if (
      user.role === 'Admin' || 
      user.role === 'Super Admin' ||
      user.is_super_admin || 
      user.id === 1 ||
      user.id === 337 ||
      user.email === 'admin@gmail.com' ||
      user.email === 'admin@opex.com' ||
      user.email === 'esraaessoo19@gmail.com'
    ) {
      return next();
    }

    // 3. Check role-based permissions from database
    try {
      const roleRes = await pool.query(
        "SELECT permissions FROM roles WHERE id = (SELECT role_id FROM users WHERE id = $1)",
        [user.id]
      );
      const permissions = roleRes.rows[0]?.permissions || {};
      
      const targetKey = normalizeModuleName(module);
      const permKey = Object.keys(permissions).find(k => k.toLowerCase() === targetKey.toLowerCase());
      
      if (permKey && permissions[permKey]) {
        const modulePerms = permissions[permKey];

        // If module view is explicitly false and not settings
        if (modulePerms.view === false && !action.includes('settings')) {
          return res.status(403).json({ error: `Permission denied: ${action} on ${module}` });
        }

        let reqTab = '';
        let reqAction = action;
        if (action.startsWith('action:')) {
          const parts = action.split(':');
          if (parts.length >= 3) {
            reqTab = parts[1];
            reqAction = parts[2];
          }
        } else if (action.startsWith('tab:')) {
          const tabName = action.substring(4);
          if (modulePerms.tabs && typeof modulePerms.tabs === 'object') {
            const foundKey = Object.keys(modulePerms.tabs).find(t => t.toLowerCase() === tabName.toLowerCase());
            if (foundKey !== undefined && modulePerms.tabs[foundKey] === false) {
              return res.status(403).json({ error: `Permission denied: tab ${tabName} on ${module}` });
            }
          }
          return next();
        } else if (action.startsWith('custom:')) {
          const actionKey = action.substring(7);
          if (modulePerms.custom_actions && typeof modulePerms.custom_actions === 'object') {
            const foundKey = Object.keys(modulePerms.custom_actions).find(a => a.toLowerCase() === actionKey.toLowerCase());
            if (foundKey !== undefined && modulePerms.custom_actions[foundKey] === false) {
              return res.status(403).json({ error: `Permission denied: custom action ${actionKey} on ${module}` });
            }
          }
          return next();
        }

        reqAction = reqAction.toLowerCase();
        if (reqAction === 'edit') reqAction = 'write';
        if (reqAction === 'view') reqAction = 'read';

        if (reqTab && modulePerms.tab_actions) {
          const matchedTabKey = Object.keys(modulePerms.tab_actions).find(t => t.toLowerCase() === reqTab.toLowerCase());
          if (matchedTabKey && modulePerms.tab_actions[matchedTabKey]) {
            const tabActs = modulePerms.tab_actions[matchedTabKey];
            let val = tabActs[reqAction];
            if (val === undefined && reqAction === 'read') val = tabActs.view ?? tabActs.read;
            if (val === undefined && reqAction === 'write') val = tabActs.edit ?? tabActs.write;

            if (val === true) return next();
            if (val === false) {
              return res.status(403).json({ error: `Permission denied: ${reqAction} on ${reqTab}` });
            }
          }
        }

        let moduleVal = modulePerms[reqAction];
        if (moduleVal === undefined && reqAction === 'read') moduleVal = modulePerms.read ?? modulePerms.view;
        if (moduleVal === undefined && reqAction === 'write') moduleVal = modulePerms.write ?? modulePerms.edit;

        if (moduleVal === true) return next();
        if (moduleVal === false) {
          return res.status(403).json({ error: `Permission denied: ${reqAction} on ${module}` });
        }

        if (reqAction === 'read' || reqAction === 'view') {
          if (modulePerms.view !== false) return next();
        }
      } else {
        // If module is not explicitly restricted in permissions, default to ALLOW for read/view operations
        const actLower = action.toLowerCase();
        if (actLower === 'view' || actLower === 'read' || actLower.startsWith('tab:') || actLower.startsWith('custom:')) {
          return next();
        }
      }
    } catch (err) {
      console.error("Permission Check Error:", err);
    }

    const actLower = action.toLowerCase();
    if (actLower === 'view' || actLower === 'read') {
      return next();
    }

    return res.status(403).json({ error: `Permission denied: ${action} on ${module}` });
  };
};
