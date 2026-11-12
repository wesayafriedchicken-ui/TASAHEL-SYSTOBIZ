import express from "express";
import { pool } from "../../db/schema.js";
import { trainingService } from "../../services/training.service.js";
import { memoryCache } from "../../utils/cache.js";

async function getTableColumns(tableName: string): Promise<Set<string>> {
  const cacheKey = `columns:${tableName}`;
  const cached = memoryCache.get<string[]>(cacheKey);
  if (cached) {
    return new Set(cached);
  }

  try {
    const res = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = $1`,
      [tableName]
    );
    const cols = res.rows.map(r => r.column_name);
    memoryCache.set(cacheKey, cols, 3600); // Cache schema columns for 1 hour
    return new Set(cols);
  } catch (err) {
    return new Set();
  }
}

export default function genericModuleRoutes(tableName: string, wss: any) {
  const router = express.Router();

  // GET all
  router.get("/", async (req, res) => {
    try {
      const companyId = (req as any).user?.company_id || 1;
      const cacheKey = `generic:${tableName}:${companyId}`;
      const cached = memoryCache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      let result;
      try {
        result = await pool.query(`SELECT * FROM ${tableName} WHERE company_id = $1 OR company_id IS NULL ORDER BY created_at DESC LIMIT 500`, [companyId]);
      } catch (e1) {
        try {
          result = await pool.query(`SELECT * FROM ${tableName} WHERE company_id = $1 OR company_id IS NULL ORDER BY id DESC LIMIT 500`, [companyId]);
        } catch (e2) {
          try {
            result = await pool.query(`SELECT * FROM ${tableName} LIMIT 500`);
          } catch (e3) {
            result = { rows: [] };
          }
        }
      }
      const data = result.rows || [];
      // Cache common lookup tables for 60s
      memoryCache.set(cacheKey, data, 60);
      res.json(data);
    } catch (err) {
      res.json([]);
    }
  });

  // POST new
  router.post("/", async (req, res) => {
    const companyId = (req as any).user?.company_id || 1;
    const allowed = await getTableColumns(tableName);
    const bodyWithCompany = { ...req.body, company_id: companyId };

    const cleanFields: string[] = [];
    const values: any[] = [];

    for (const [key, val] of Object.entries(bodyWithCompany)) {
      if (key !== 'id' && (allowed.size === 0 || allowed.has(key))) {
        cleanFields.push(key);
        if ((key === 'teams' || key === 'job_titles' || key === 'permissions' || key === 'subdepartments') && typeof val === 'object' && val !== null) {
          values.push(JSON.stringify(val));
        } else {
          values.push(val);
        }
      }
    }

    if (cleanFields.length === 0) return res.status(400).json({ error: "No valid fields to insert" });

    const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");
    const columns = cleanFields.join(", ");

    try {
      const result = await pool.query(
        `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) RETURNING id`,
        values
      );
      
      const newId = result.rows[0].id;
      memoryCache.invalidatePrefix(`generic:${tableName}`);

      // Auto-enrollment logic for users
      if (tableName === 'users' && req.body.department_id) {
        await trainingService.autoEnrollUser(newId, req.body.department_id);
      }

      // Broadcast update
      if (wss && wss.clients) {
        wss.clients.forEach((client: any) => {
          client.send(JSON.stringify({ type: "MODULE_UPDATED", table: tableName }));
        });
      }

      res.json({ id: newId });
    } catch (err: any) {
      console.error(`Error inserting into ${tableName}:`, err);
      res.status(500).json({ error: err?.message || `Failed to insert into ${tableName}` });
    }
  });

  // PUT
  router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const companyId = (req as any).user?.company_id || 1;
    const allowed = await getTableColumns(tableName);

    const cleanFields: string[] = [];
    const values: any[] = [];

    for (const [key, val] of Object.entries(req.body)) {
      if (key !== 'id' && (allowed.size === 0 || allowed.has(key))) {
        cleanFields.push(key);
        if ((key === 'teams' || key === 'job_titles' || key === 'permissions' || key === 'subdepartments') && typeof val === 'object' && val !== null) {
          values.push(JSON.stringify(val));
        } else {
          values.push(val);
        }
      }
    }

    if (cleanFields.length === 0) return res.status(400).json({ error: "No valid fields to update" });

    const hasUpdatedAt = allowed.has('updated_at');
    const setClause = cleanFields.map((field, i) => `${field} = $${i + 1}`).join(", ");
    const fullSetClause = hasUpdatedAt ? `${setClause}, updated_at = CURRENT_TIMESTAMP` : setClause;
    const updateValues = [...values, id, companyId];

    try {
      let result;
      try {
        result = await pool.query(
          `UPDATE ${tableName} SET ${fullSetClause} WHERE id = $${cleanFields.length + 1} AND (company_id = $${cleanFields.length + 2} OR company_id IS NULL) RETURNING *`,
          updateValues
        );
      } catch (e) {
        result = await pool.query(
          `UPDATE ${tableName} SET ${fullSetClause} WHERE id = $${cleanFields.length + 1} RETURNING *`,
          [...values, id]
        );
      }

      if (result.rows.length === 0) {
        result = await pool.query(
          `UPDATE ${tableName} SET ${fullSetClause} WHERE id = $${cleanFields.length + 1} RETURNING *`,
          [...values, id]
        );
      }

      if (result.rows.length === 0) return res.status(404).json({ error: "Record not found or unauthorized" });

      memoryCache.invalidatePrefix(`generic:${tableName}`);

      if (wss && wss.clients) {
        wss.clients.forEach((client: any) => {
          client.send(JSON.stringify({ type: "MODULE_UPDATED", table: tableName }));
        });
      }

      res.json(result.rows[0]);
    } catch (err: any) {
      console.error(`Error updating ${tableName}:`, err);
      res.status(500).json({ error: err?.message || `Failed to update ${tableName}` });
    }
  });

  // DELETE
  router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    const companyId = (req as any).user?.company_id || 1;
    try {
      await pool.query(`DELETE FROM ${tableName} WHERE id = $1 AND (company_id = $2 OR company_id IS NULL)`, [id, companyId]);
      memoryCache.invalidatePrefix(`generic:${tableName}`);
      
      if (wss && wss.clients) {
        wss.clients.forEach((client: any) => {
          client.send(JSON.stringify({ type: "MODULE_UPDATED", table: tableName }));
        });
      }

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: `Failed to delete from ${tableName}` });
    }
  });

  return router;
}
