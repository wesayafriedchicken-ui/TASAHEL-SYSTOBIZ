import { Request, Response } from "express";
import { pool } from "../../db/schema.js";
import { automationService } from "../../services/automation.service.js";

export const getRisks = async (req: Request, res: Response) => {
  const companyId = (req as any).user?.company_id || parseInt(req.headers['x-company-id'] as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const offset = parseInt(req.query.offset as string) || 0;
  try {
    const result = await pool.query(`
      SELECT 
        r.id, r.company_id, r.name, r.description, r.category, 
        r.probability, r.impact, r.risk_score, r.status, 
        r.mitigation_plan, r.contingency_plan, r.owner_id, 
        r.sop_id, r.department_id, r.kpi_id, r.created_at, r.updated_at,
        u.name as owner_name, s.title as sop_title, k.name as kpi_name, d.name as department_name
      FROM risks r
      LEFT JOIN users u ON r.owner_id = u.id
      LEFT JOIN sops s ON r.sop_id = s.id
      LEFT JOIN kpis k ON r.kpi_id = k.id
      LEFT JOIN departments d ON r.department_id = d.id
      WHERE r.company_id = $1 OR r.company_id IS NULL
      ORDER BY r.risk_score DESC
      LIMIT $2 OFFSET $3
    `, [companyId, limit, offset]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const createRisk = async (req: Request, res: Response, wss: any) => {
  const { name, description, category, probability, impact, mitigation_plan, contingency_plan, owner_id, sop_id, department_id, kpi_id } = req.body;
  const companyId = (req as any).user?.company_id || parseInt(req.headers['x-company-id'] as string) || 1;
  try {
    const result = await pool.query(
      `INSERT INTO risks (name, description, category, probability, impact, mitigation_plan, contingency_plan, owner_id, sop_id, department_id, kpi_id, company_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
       RETURNING id, company_id, name, description, category, probability, impact, risk_score, status, mitigation_plan, contingency_plan, owner_id, sop_id, department_id, kpi_id, created_at`,
      [name, description, category, probability, impact, mitigation_plan, contingency_plan, owner_id, sop_id, department_id, kpi_id, companyId]
    );
    const risk = result.rows[0];

    // Trigger orchestration events
    await automationService.trigger('risk:created', risk);

    // Automation Alert
    if (risk.risk_score > 15) {
      await automationService.trigger('risk:high_risk_alert', risk);
      const { NotificationService } = await import("../../services/notification.service.js");
      
      // Link to Continuous Improvement: Auto-create Kaizen ticket
      await pool.query(
        "INSERT INTO kaizen_suggestions (title, problem_description, proposed_solution, expected_benefit, department_id, company_id, status) VALUES ($1, $2, $3, $4, (SELECT department_id FROM sops WHERE id = $5), $6, $7)",
        [
          `Risk Mitigation: ${name}`, 
          `Automatically generated from High Risk: ${description}`, 
          `Implement specific mitigation strategies and active monitoring.`, 
          `Risk mitigation and proactive prevention of operational failure.`, 
          sop_id, 
          companyId, 
          'New'
        ]
      );

      await NotificationService.notify(
        null, 
        "CRITICAL RISK ALERT", 
        `${risk.name} has a score of ${risk.risk_score}!`, 
        "error",
        "/risk"
      );
      await NotificationService.logActivity(owner_id, "High Risk Registered", "Risk", risk.id, `Score: ${risk.risk_score}`);
    }

    res.status(201).json(risk);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const updateRisk = async (req: Request, res: Response) => {
  const { id } = req.params;
  const fields = Object.keys(req.body);
  const values = Object.values(req.body);
  const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(", ");
  
  try {
    const result = await pool.query(
      `UPDATE risks SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 
       RETURNING id, company_id, name, description, category, probability, impact, risk_score, status, mitigation_plan, contingency_plan, owner_id, sop_id, department_id, kpi_id, updated_at`,
      [id, ...values]
    );
    const updatedRisk = result.rows[0];
    await automationService.trigger('risk:updated', updatedRisk);
    res.json(updatedRisk);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const deleteRisk = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const oldRes = await pool.query("SELECT * FROM risks WHERE id = $1", [id]);
    const oldRisk = oldRes.rows[0];
    await pool.query("DELETE FROM risks WHERE id = $1", [id]);
    if (oldRisk) {
      await automationService.trigger('risk:deleted', oldRisk);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};
