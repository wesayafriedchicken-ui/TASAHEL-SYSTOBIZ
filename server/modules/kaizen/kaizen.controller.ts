import { Request, Response } from "express";
import { pool } from "../../db/schema.js";
import { automationService } from "../../services/automation.service.js";

const parseIntegerOrNull = (val: any) => {
  if (val === undefined || val === null || val === '') return null;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? null : parsed;
};

const parseFloatOrNull = (val: any) => {
  if (val === undefined || val === null || val === '') return null;
  const parsed = parseFloat(val);
  return isNaN(parsed) ? null : parsed;
};

export const getSuggestions = async (req: Request, res: Response) => {
  const companyId = (req as any).user?.company_id || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const offset = parseInt(req.query.offset as string) || 0;
  try {
    const result = await pool.query(`
      SELECT 
        ks.id, ks.company_id, ks.title, ks.problem_description, 
        ks.proposed_solution, ks.expected_benefit, ks.submitted_by, 
        ks.department_id, ks.sop_id, ks.status, ks.priority, 
        ks.improvement_type, ks.impact_rating, ks.effort_rating, 
        ks.score, ks.impact_time_saving, ks.impact_cost_saving, 
        ks.kpi_id, ks.created_at, ks.updated_at,
        u.name as submitter_name, d.name as department_name, s.title as sop_title
      FROM kaizen_suggestions ks
      LEFT JOIN users u ON ks.submitted_by = u.id
      LEFT JOIN departments d ON ks.department_id = d.id
      LEFT JOIN sops s ON ks.sop_id = s.id
      WHERE ks.company_id = $1
      ORDER BY ks.created_at DESC
      LIMIT $2 OFFSET $3
    `, [companyId, limit, offset]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const createSuggestion = async (req: Request, res: Response, wss: any) => {
  const { title, problem_description, proposed_solution, expected_benefit, submitted_by, department_id, sop_id, improvement_type, impact_rating, effort_rating } = req.body;
  const companyId = (req as any).user?.company_id || 1;
  try {
    const result = await pool.query(
      `INSERT INTO kaizen_suggestions (title, problem_description, proposed_solution, expected_benefit, submitted_by, department_id, sop_id, company_id, improvement_type, impact_rating, effort_rating) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
       RETURNING id, company_id, title, status, improvement_type, department_id, created_at`,
      [
        title, 
        problem_description, 
        proposed_solution || "To be defined during PDCA.", 
        expected_benefit || "Continuous operational improvement.", 
        parseIntegerOrNull(submitted_by), 
        parseIntegerOrNull(department_id), 
        parseIntegerOrNull(sop_id), 
        companyId,
        improvement_type || 'Time Reduction',
        parseIntegerOrNull(impact_rating) !== null ? parseIntegerOrNull(impact_rating) : 3,
        parseIntegerOrNull(effort_rating) !== null ? parseIntegerOrNull(effort_rating) : 3
      ]
    );
    const suggestion = result.rows[0];


    // Initialize PDCA phases
    const phases = ['Plan', 'Do', 'Check', 'Act'];
    for (const phase of phases) {
      await pool.query(
        "INSERT INTO kaizen_pdca (suggestion_id, phase) VALUES ($1, $2)",
        [suggestion.id, phase]
      );
    }

    // Notify relevant department
    await pool.query(
      "INSERT INTO notifications (title, message, type, company_id) VALUES ($1, $2, $3, $4)",
      ["New Kaizen Suggestion", `A new improvement idea "${title}" has been submitted.`, "info", companyId]
    );
    wss.clients.forEach((client: any) => {
      client.send(JSON.stringify({
        type: "NOTIFICATION",
        message: `New Kaizen Suggestion: ${title}`
      }));
    });

    await automationService.trigger('kaizen:suggestion:created', suggestion);

    res.status(201).json(suggestion);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const updateSuggestion = async (req: Request, res: Response, wss: any) => {
  const { id } = req.params;
  const { 
    title, 
    problem_description, 
    proposed_solution, 
    expected_benefit, 
    status, 
    priority, 
    score, 
    impact_time_saving, 
    impact_cost_saving, 
    kpi_id,
    improvement_type,
    impact_rating,
    effort_rating
  } = req.body;
  const companyId = (req as any).user?.company_id || 1;
  try {
    const result = await pool.query(
      `UPDATE kaizen_suggestions 
       SET title = COALESCE($1, title),
           problem_description = COALESCE($2, problem_description),
           proposed_solution = COALESCE($3, proposed_solution),
           expected_benefit = COALESCE($4, expected_benefit),
           status = COALESCE($5, status),
           priority = COALESCE($6, priority),
           score = COALESCE($7, score),
           impact_time_saving = COALESCE($8, impact_time_saving),
           impact_cost_saving = COALESCE($9, impact_cost_saving),
           kpi_id = COALESCE($10, kpi_id),
           improvement_type = COALESCE($11, improvement_type),
           impact_rating = COALESCE($12, impact_rating),
           effort_rating = COALESCE($13, effort_rating),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $14 AND company_id = $15 
       RETURNING id, company_id, title, status, priority, improvement_type, score, updated_at`,
      [
        title || null, 
        problem_description || null, 
        proposed_solution || null, 
        expected_benefit || null, 
        status || null, 
        priority || null, 
        parseIntegerOrNull(score), 
        parseFloatOrNull(impact_time_saving), 
        parseFloatOrNull(impact_cost_saving), 
        parseIntegerOrNull(kpi_id),
        improvement_type || null,
        parseIntegerOrNull(impact_rating),
        parseIntegerOrNull(effort_rating),
        id,
        companyId
      ]
    );

    const suggestion = result.rows[0];

    if (wss && status === 'Accepted' && suggestion?.sop_id) {
      // Notify SOP Management
      wss.clients.forEach((client: any) => {
        client.send(JSON.stringify({
          type: "NOTIFICATION",
          message: `SOP Update Required: Kaizen Suggestion "${suggestion.title}" was accepted for SOP #${suggestion.sop_id}`
        }));
      });
    }

    if (suggestion) {
      await automationService.trigger('kaizen:suggestion:status_changed', suggestion);
    }
    res.json(suggestion);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const updateStatus = async (req: Request, res: Response, wss: any) => {
  const { id } = req.params;
  const { status, impact_time_saving, impact_cost_saving, kpi_id } = req.body;
  const companyId = (req as any).user?.company_id || 1;
  try {
    const result = await pool.query(
      `UPDATE kaizen_suggestions 
       SET status = $1, impact_time_saving = $2, impact_cost_saving = $3, kpi_id = $4, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $5 AND company_id = $6 RETURNING *`,
      [
        status, 
        parseFloatOrNull(impact_time_saving), 
        parseFloatOrNull(impact_cost_saving), 
        parseIntegerOrNull(kpi_id), 
        id, 
        companyId
      ]
    );
    const suggestion = result.rows[0];

    if (status === 'Accepted' && suggestion.sop_id) {
      // Notify SOP Management
      wss.clients.forEach((client: any) => {
        client.send(JSON.stringify({
          type: "NOTIFICATION",
          message: `SOP Update Required: Kaizen Suggestion "${suggestion.title}" was accepted for SOP #${suggestion.sop_id}`
        }));
      });
    }

    await automationService.trigger('kaizen:suggestion:status_changed', suggestion);
    res.json(suggestion);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const getPDCA = async (req: Request, res: Response) => {
  const { suggestionId } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM kaizen_pdca WHERE suggestion_id = $1 ORDER BY id ASC",
      [suggestionId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const updatePDCA = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { description, status } = req.body;
  try {
    const result = await pool.query(
      "UPDATE kaizen_pdca SET description = $1, status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *",
      [description, status, id]
    );
    const pdca = result.rows[0];
    await automationService.trigger('kaizen:suggestion:pdca_updated', pdca);
    res.json(pdca);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const getLeaderboard = async (req: Request, res: Response) => {
  const companyId = (req as any).user?.company_id || 1;
  try {
    const result = await pool.query(`
      SELECT u.name, COUNT(ks.id) as successful_suggestions
      FROM kaizen_suggestions ks
      JOIN users u ON ks.submitted_by = u.id
      WHERE ks.status = 'Implemented' AND ks.company_id = $1
      GROUP BY u.id, u.name
      ORDER BY successful_suggestions DESC
      LIMIT 10
    `, [companyId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const deleteSuggestion = async (req: Request, res: Response) => {
  const { id } = req.params;
  const companyId = (req as any).user?.company_id || 1;
  try {
    // Note: kaizen_pdca doesn't have company_id directly, but it's linked via suggestion_id
    await pool.query("DELETE FROM kaizen_pdca WHERE suggestion_id = $1", [id]);
    await pool.query("DELETE FROM kaizen_suggestions WHERE id = $1 AND company_id = $2", [id, companyId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};
