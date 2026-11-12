import express from "express";
import { pool } from "../../db/schema.js";
import { automationService } from "../../services/automation.service.js";

export default function raciRoutes() {
  const router = express.Router();

  // Get all roles with employee count
  router.get("/roles", async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT rl.id, rl.name, COUNT(u.id) as employee_count 
        FROM roles rl 
        LEFT JOIN users u ON u.role_id = rl.id 
        GROUP BY rl.id, rl.name
        ORDER BY rl.name ASC
      `);
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch roles list" });
    }
  });

  // Create new role/persona
  router.post("/roles", async (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Role name is required" });
    try {
      // get default company
      const companyRes = await pool.query("SELECT id FROM companies LIMIT 1");
      const companyId = companyRes.rows[0]?.id || 1;
      
      const result = await pool.query(
        "INSERT INTO roles (name, company_id) VALUES ($1, $2) RETURNING *",
        [name, companyId]
      );
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create role/persona" });
    }
  });

  // Delete role/persona
  router.delete("/roles/:id", async (req, res) => {
    try {
      await pool.query("DELETE FROM roles WHERE id = $1", [req.params.id]);
      res.json({ message: "Role successfully deleted" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to delete role" });
    }
  });

  // Get all users with roles
  router.get("/employees", async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT u.id, u.name, u.email, u.role_id, rl.name as role_name 
        FROM users u 
        LEFT JOIN roles rl ON u.role_id = rl.id 
        ORDER BY u.name ASC
      `);
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch employees list" });
    }
  });

  // Patch employee role selection
  router.patch("/employees/:id/role", async (req, res) => {
    const { role_id } = req.body;
    try {
      const result = await pool.query(
        "UPDATE users SET role_id = $1 WHERE id = $2 RETURNING *",
        [role_id || null, req.params.id]
      );
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update employee role" });
    }
  });

  // Get clarity scores
  router.get("/clarity", async (req, res) => {
    try {
      const surveyResult = await pool.query("SELECT * FROM raci_clarity_survey ORDER BY created_at DESC");
      const avgResult = await pool.query("SELECT AVG(score) as average FROM raci_clarity_survey");
      const average = avgResult.rows[0]?.average ? Math.round(parseFloat(avgResult.rows[0].average)) : 80;
      res.json({
        surveys: surveyResult.rows,
        average
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch role clarity data" });
    }
  });

  // Post clarity score
  router.post("/clarity", async (req, res) => {
    const { user_name, score, feedback } = req.body;
    if (!score) return res.status(400).json({ error: "Score is required" });
    try {
      const result = await pool.query(
        "INSERT INTO raci_clarity_survey (user_name, score, feedback) VALUES ($1, $2, $3) RETURNING *",
        [user_name || "Anonymous Employee", score, feedback || ""]
      );
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to submit clarity score" });
    }
  });

  // Get RACI for a specific SOP or Step
  router.get("/", async (req, res) => {
    const { sop_id, sop_step_id } = req.query;
    try {
      let query = "SELECT r.*, u.name as user_name, rl.name as role_name FROM raci_assignments r LEFT JOIN users u ON r.user_id = u.id LEFT JOIN roles rl ON r.role_id = rl.id WHERE 1=1";
      const params = [];

      if (sop_id) {
        query += " AND r.sop_id = $1";
        params.push(sop_id);
      } else if (sop_step_id) {
        query += " AND r.sop_step_id = $1";
        params.push(sop_step_id);
      }

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch RACI assignments" });
    }
  });

  // Assign RACI
  router.post("/", async (req, res) => {
    const { sop_id, sop_step_id, role_type, user_id, role_id } = req.body;
    
    try {
      // Conflict Detection: Only one Accountable (A) per entity
      if (role_type === 'A') {
        const checkQuery = sop_id 
          ? "SELECT id FROM raci_assignments WHERE sop_id = $1 AND role_type = 'A'"
          : "SELECT id FROM raci_assignments WHERE sop_step_id = $1 AND role_type = 'A'";
        const checkParams = [sop_id || sop_step_id];
        const checkResult = await pool.query(checkQuery, checkParams);
        
        if (checkResult.rows.length > 0) {
          return res.status(400).json({ error: "An Accountable (A) is already assigned to this entity. Only one is allowed." });
        }
      }

      const result = await pool.query(
        "INSERT INTO raci_assignments (sop_id, sop_step_id, role_type, user_id, role_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [sop_id, sop_step_id, role_type, user_id, role_id]
      );

      // Notification logic
      if (user_id) {
        const roleName = role_type === 'R' ? 'Responsible' : role_type === 'A' ? 'Accountable' : role_type === 'C' ? 'Consulted' : 'Informed';
        const entityName = sop_id ? 'SOP' : 'SOP Step';
        
        const { NotificationService } = await import("../../services/notification.service.js");
        await NotificationService.notify(
          user_id,
          "New RACI Assignment",
          `You have been assigned as ${roleName} for a ${entityName}.`,
          role_type === 'A' ? 'warning' : 'info'
        );
        await NotificationService.logActivity(null, `RACI Assignment: ${roleName}`, entityName, sop_id || sop_step_id);
      }

      const assignmentResult = result.rows[0];
      await automationService.trigger('raci:assigned', assignmentResult);
      res.json(assignmentResult);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to assign RACI" });
    }
  });

  // Delete assignment
  router.delete("/:id", async (req, res) => {
    try {
      await pool.query("DELETE FROM raci_assignments WHERE id = $1", [req.params.id]);
      res.json({ message: "Assignment removed" });
    } catch (err) {
      res.status(500).json({ error: "Failed to remove assignment" });
    }
  });

  // Matrix View Data (Processes x Roles)
  router.get("/matrix", async (req, res) => {
    const { department_id } = req.query;
    try {
      // Get all SOPs for the department
      let sopQuery = "SELECT id, title, department_id FROM sops";
      const sopParams = [];
      if (department_id && department_id !== 'undefined') {
        sopQuery += " WHERE department_id = $1";
        sopParams.push(department_id);
      }
      const sops = await pool.query(sopQuery, sopParams);

      // Get all Steps for these SOPs
      const sopIds = sops.rows.map(s => s.id);
      let steps = { rows: [] };
      if (sopIds.length > 0) {
        steps = await pool.query("SELECT id, sop_id, step_number, step_description FROM sop_steps WHERE sop_id = ANY($1) ORDER BY sop_id, step_number", [sopIds]);
      }

      // Get all Roles
      const roles = await pool.query("SELECT id, name FROM roles");

      // Get all assignments
      const assignments = await pool.query(`
        SELECT r.*, rl.name as role_name 
        FROM raci_assignments r 
        JOIN roles rl ON r.role_id = rl.id
      `);

      res.json({
        sops: sops.rows,
        steps: steps.rows,
        roles: roles.rows,
        assignments: assignments.rows
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch matrix data" });
    }
  });

  return router;
}
