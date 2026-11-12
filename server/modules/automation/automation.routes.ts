import { Router } from "express";
import { pool } from "../../db/schema.js";

export default function automationRoutes() {
  const router = Router();

  // Get all rules
  router.get("/rules", async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM automation_rules ORDER BY created_at DESC");
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch rules" });
    }
  });

  // Trigger automation manually or from modules
  router.post("/trigger", async (req, res) => {
    const { trigger_type, data } = req.body;
    if (!trigger_type) {
      return res.status(400).json({ error: "Missing trigger_type in request body" });
    }
    try {
      const { automationService } = await import("../../services/automation.service.js");
      await automationService.trigger(trigger_type, data || {});
      res.json({ success: true, message: `System trigger "${trigger_type}" broadcast successfully.` });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Create a rule
  router.post("/rules", async (req, res) => {
    const { name, trigger_type, conditions, actions, is_active } = req.body;
    try {
      const result = await pool.query(
        "INSERT INTO automation_rules (name, trigger_type, conditions, actions, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [name, trigger_type, JSON.stringify(conditions), JSON.stringify(actions), is_active ?? true]
      );
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to create rule" });
    }
  });

  // Update a rule
  router.put("/rules/:id", async (req, res) => {
    const { id } = req.params;
    const { name, trigger_type, conditions, actions, is_active } = req.body;
    try {
      const result = await pool.query(
        "UPDATE automation_rules SET name = $1, trigger_type = $2, conditions = $3, actions = $4, is_active = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *",
        [name, trigger_type, JSON.stringify(conditions), JSON.stringify(actions), is_active, id]
      );
      res.json(result.rows[0]);
    } catch (error) {
      res.status(500).json({ error: "Failed to update rule" });
    }
  });

  // Delete a rule
  router.delete("/rules/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query("DELETE FROM automation_rules WHERE id = $1", [id]);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete rule" });
    }
  });

  // Get logs
  router.get("/logs", async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT l.*, r.name as rule_name 
        FROM automation_logs l 
        JOIN automation_rules r ON l.rule_id = r.id 
        ORDER BY l.executed_at DESC 
        LIMIT 100
      `);
      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch logs" });
    }
  });

  return router;
}
