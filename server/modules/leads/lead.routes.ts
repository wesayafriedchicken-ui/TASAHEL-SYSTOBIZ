import express from "express";
import { pool } from "../../db/schema.js";
import { automationService } from "../../services/automation.service.js";
import { logAction } from "../../services/auditLogger.js";

export default function leadRoutes(wss: any) {
  const router = express.Router();

  router.get("/", async (req, res) => {
    try {
      const companyId = (req as any).user?.company_id || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const offset = parseInt(req.query.offset as string) || 0;
      
      const result = await pool.query(
        `SELECT id, company_id, name, email, phone, whatsapp, value, assigned_to, status, created_at, updated_at
         FROM crm_leads 
         WHERE company_id = $1 
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [companyId, limit, offset]
      );
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  });

  router.post("/", async (req, res) => {
    const { name, email, value, assigned_to, phone, whatsapp, items } = req.body;
    const companyId = (req as any).user?.company_id || 1;
    try {
      const result = await pool.query(
        `INSERT INTO crm_leads (company_id, name, email, value, assigned_to, phone, whatsapp, items) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
         RETURNING id, company_id, name, email, value, assigned_to, phone, whatsapp, status, created_at`,
        [companyId, name, email, value, assigned_to, phone, whatsapp, JSON.stringify(items || [])]
      );
      const lead = result.rows[0];
      await automationService.trigger("lead:created", lead);
      res.json(lead);
    } catch (err) {
      res.status(500).json({ error: "Failed to create lead" });
    }
  });

  router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { name, email, value, assigned_to, status, phone, whatsapp, items } = req.body;
    const companyId = (req as any).user?.company_id || 1;
    try {
      const result = await pool.query(
        `UPDATE crm_leads 
         SET name = $1, email = $2, value = $3, assigned_to = $4, status = $5, phone = $6, whatsapp = $7, items = $8, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $9 AND company_id = $10 
         RETURNING id, company_id, name, email, value, assigned_to, status, phone, whatsapp, updated_at`,
        [name, email, value, assigned_to, status, phone, whatsapp, JSON.stringify(items || []), id, companyId]
      );
      const lead = result.rows[0];
      await automationService.trigger("lead:updated", lead);
      res.json(lead);
    } catch (err) {
      res.status(500).json({ error: "Failed to update lead" });
    }
  });

  router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    const companyId = (req as any).user?.company_id || 1;
    try {
      const authUserId = (req as any).user?.id || 1;
      const oldRes = await pool.query(
        "SELECT id, company_id, name, email, phone, whatsapp, value, assigned_to, status FROM crm_leads WHERE id = $1 AND company_id = $2",
        [id, companyId]
      );
      const oldLead = oldRes.rows[0];
      await logAction(authUserId, 'DELETE', 'Lead', parseInt(id), { company_id: companyId });
      await pool.query("DELETE FROM crm_leads WHERE id = $1 AND company_id = $2", [id, companyId]);
      if (oldLead) {
        await automationService.trigger("lead:deleted", oldLead);
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete lead" });
    }
  });

  router.patch("/:id/status", async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const companyId = (req as any).user?.company_id || 1;

    try {
      const authUserId = (req as any).user?.id || 1;
      const oldLeadRes = await pool.query(
        "SELECT id, company_id, name, email, phone, whatsapp, value, assigned_to, status FROM crm_leads WHERE id = $1 AND company_id = $2",
        [id, companyId]
      );
      const oldLead = oldLeadRes.rows[0];
      if (!oldLead) return res.status(404).json({ error: "Lead not found" });
      
      await pool.query("UPDATE crm_leads SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND company_id = $3", [status, id, companyId]);
      await logAction(authUserId, 'UPDATE_STATUS', 'Lead', parseInt(id), { from: oldLead.status, to: status, company_id: companyId });

      await automationService.trigger("lead:status_updated", { ...oldLead, status });

      if (status === "converted" && oldLead.status !== "converted") {
        await automationService.trigger("lead:converted", { ...oldLead, id, status, wss, company_id: companyId });
      }

      wss.clients.forEach((client: any) => {
        client.send(JSON.stringify({ type: "LEAD_UPDATED", id, status }));
      });

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to update status" });
    }
  });

  return router;
}
