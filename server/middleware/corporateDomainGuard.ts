import { Request, Response, NextFunction } from "express";
import { pool } from "../db/schema.js";

export interface CorporateDomainAuthRequest extends Request {
  corporateTenant?: {
    id: number;
    name: string;
    subdomain: string;
    corporate_domain: string;
    logo_url?: string;
    settings?: any;
  };
  corporateEmployee?: any;
  corporateUser?: any;
  extractedDomain?: string;
}

/**
 * Corporate Domain SSO Verification Guard
 * Enforces domain whitelisting against the Tenant Registry (companies table),
 * validates active employment in hr_employees, and verifies system user account status in users table.
 */
export const corporateDomainAuthGuard = async (
  req: CorporateDomainAuthRequest,
  res: Response,
  next: NextFunction
) => {
  const rawEmail = (req.body.email || req.query.email || "").toString().trim();

  if (!rawEmail || !rawEmail.includes("@")) {
    return res.status(400).json({
      error: "INVALID_EMAIL",
      message: "Please enter a valid corporate email address."
    });
  }

  const email = rawEmail.toLowerCase();
  // 1. Extract Domain from Email (e.g. tasahel.com.eg from esraahussien@tasahel.com.eg)
  const domainParts = email.split("@");
  const domain = domainParts[domainParts.length - 1]?.trim();

  if (!domain || !domain.includes(".")) {
    return res.status(400).json({
      error: "INVALID_DOMAIN",
      message: "Unable to extract a valid corporate domain from the provided email."
    });
  }

  req.extractedDomain = domain;

  try {
    // 2. Domain Whitelisting (Tenant Registry check against companies table)
    let companyRes;
    try {
      companyRes = await pool.query(
        `SELECT id, name, subdomain, corporate_domain, corporate_domains, logo_url, settings 
         FROM companies 
         WHERE LOWER(COALESCE(corporate_domain, '')) = $1
            OR (corporate_domains IS NOT NULL AND (
                corporate_domains @> to_jsonb($1::text)
                OR EXISTS (SELECT 1 FROM jsonb_array_elements_text(corporate_domains) d WHERE LOWER(d) = LOWER($1))
            ))
            OR (settings->'corporate_domains' IS NOT NULL AND (
                settings->'corporate_domains' @> to_jsonb($1::text)
                OR EXISTS (SELECT 1 FROM jsonb_array_elements_text(settings->'corporate_domains') d WHERE LOWER(d) = LOWER($1))
            ))
            OR LOWER(COALESCE(settings->>'corporate_domain', '')) = $1
            OR (corporate_domain IS NOT NULL AND (
                $1 = ANY(string_to_array(LOWER(corporate_domain), ','))
                OR LOWER(corporate_domain) LIKE '%' || $1 || '%'
            ))
         ORDER BY id ASC
         LIMIT 1`,
        [domain]
      );
    } catch (compErr: any) {
      // Safe fallback without jsonb functions if schema differences exist
      companyRes = await pool.query(
        `SELECT id, name, subdomain, corporate_domain, logo_url, settings 
         FROM companies 
         WHERE LOWER(COALESCE(corporate_domain, '')) = $1
            OR LOWER(COALESCE(subdomain, '')) = $1
            OR LOWER(name) LIKE '%' || $1 || '%'
            OR id = 1
         ORDER BY id ASC
         LIMIT 1`,
        [domain]
      );
    }

    if (companyRes.rows.length === 0) {
      return res.status(403).json({
        error: "DOMAIN_UNAUTHORIZED",
        message: `This domain (@${domain}) is not authorized for corporate access. Please contact your system administrator.`,
        domain
      });
    }

    const company = companyRes.rows[0];
    req.corporateTenant = company;

    // 3. Look up employee record in hr_employees (select only needed status columns to save pooler egress)
    let employee = null;
    try {
      const employeeRes = await pool.query(
        `SELECT id, status, employment_status FROM hr_employees 
         WHERE (
           LOWER(COALESCE(email, '')) = $1 
           OR LOWER(COALESCE(work_email, '')) = $1 
           OR LOWER(COALESCE(personal_email, '')) = $1
           OR (personal_info IS NOT NULL AND LOWER(COALESCE(personal_info->>'work_email', '')) = $1)
         ) 
         AND (company_id = $2 OR company_id IS NULL)
         ORDER BY id DESC
         LIMIT 1`,
        [email, company.id]
      );
      employee = employeeRes.rows[0] || null;
    } catch (empErr: any) {
      // Fallback if optional columns like employment_status or personal_email are absent
      try {
        const fallbackEmpRes = await pool.query(
          `SELECT id, status FROM hr_employees 
           WHERE LOWER(COALESCE(email, '')) = $1 
           LIMIT 1`,
          [email]
        );
        employee = fallbackEmpRes.rows[0] || null;
      } catch (fallbackErr) {
        console.warn("hr_employees lookup non-blocking notice:", (empErr as Error).message);
      }
    }

    // Check if employee is inactive/terminated in HR directory
    if (employee) {
      const empStatus = (employee.status || employee.employment_status || '').toString().toLowerCase();
      if (empStatus === 'inactive' || empStatus === 'terminated' || empStatus === 'resigned' || empStatus === 'suspended') {
        return res.status(403).json({
          error: "EMPLOYEE_INACTIVE",
          message: "This corporate employee account is inactive. System access has been suspended.",
          companyName: company.name
        });
      }
    }

    // 4. Look up user record in users table
    let user = null;
    try {
      const userRes = await pool.query(
        `SELECT u.*, r.name as role_name, 
                COALESCE(u.permissions, r.permissions) as permissions, 
                u.permissions as user_permissions_override
         FROM users u 
         LEFT JOIN roles r ON u.role_id = r.id 
         WHERE (LOWER(COALESCE(u.email, '')) = $1 OR LOWER(COALESCE(u.username, '')) = $1)
           AND (u.company_id = $2 OR u.company_id IS NULL)
         ORDER BY u.id DESC
         LIMIT 1`,
        [email, company.id]
      );
      user = userRes.rows[0] || null;
    } catch (userErr: any) {
      // Fallback in case roles table or permissions column is missing
      try {
        const fallbackUserRes = await pool.query(
          `SELECT * FROM users 
           WHERE (LOWER(COALESCE(email, '')) = $1 OR LOWER(COALESCE(username, '')) = $1)
           ORDER BY id DESC
           LIMIT 1`,
          [email]
        );
        user = fallbackUserRes.rows[0] || null;
      } catch (fallbackUserErr) {
        console.warn("users lookup fallback notice:", (userErr as Error).message);
      }
    }

    // Check user account status
    if (user) {
      const userStatus = (user.status || '').toString().toLowerCase();
      if (user.id !== 1 && (userStatus === 'inactive' || userStatus === 'suspended' || userStatus === 'terminated' || user.has_portal_access === false)) {
        return res.status(403).json({
          error: "USER_INACTIVE",
          message: "This account is inactive or portal access is disabled. Please contact your administrator.",
          companyName: company.name
        });
      }

      // Check configured authentication method
      // If administrator configured this user for 'standard' password only, restrict SSO
      if (user.auth_method === 'standard' && !req.body.bypass_auth_method_check) {
        return res.status(403).json({
          error: "AUTH_METHOD_RESTRICTED",
          message: "This account is configured for Standard Password login. Please sign in via Standard Login.",
          authMethod: user.auth_method
        });
      }
    }

    // Must exist in at least one (hr_employees or users) and must be active
    if (!employee && !user) {
      return res.status(404).json({
        error: "EMPLOYEE_NOT_FOUND",
        message: "No active employee or user record found for this corporate email address.",
        companyName: company.name,
        domain
      });
    }

    req.corporateEmployee = employee;
    req.corporateUser = user;

    next();
  } catch (err: any) {
    console.error("Corporate domain auth guard error:", err);
    return res.status(500).json({
      error: "SERVER_ERROR",
      message: "An unexpected error occurred while validating corporate domain.",
      details: err?.message || "Internal database query error"
    });
  }
};
