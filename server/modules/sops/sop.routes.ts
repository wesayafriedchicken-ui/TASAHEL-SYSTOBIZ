import express from "express";
import { pool } from "../../db/schema.js";
import { automationService } from "../../services/automation.service.js";
import { checkPermission } from "../../middleware/auth.js";
import { logAction } from "../../services/auditLogger.js";

export default function sopRoutes() {
  const router = express.Router();

  router.get("/", checkPermission('SOPs', 'view'), async (req, res) => {
    try {
      const { status, department_id, search, tags, version } = req.query;
      const user = (req as any).user;
      const companyId = user?.company_id || 1;
      const isAdmin = user?.role === 'Admin' || user?.is_super_admin || user?.id === 1 || user?.role_id === 1;
      
      const deptRes = await pool.query(`
        SELECT department_head_id 
        FROM departments 
        WHERE id = $1 AND (company_id = $2 OR company_id IS NULL)
      `, [user?.department_id, companyId]);
      
      const isDeptHead = deptRes.rows[0]?.department_head_id === user?.id;

      let query = `
        SELECT s.id, s.company_id, s.title, s.department_id, s.process_type, s.owner_id,
               s.approver_id, s.objective, s.scope, s.roles_responsibilities,
               s.required_documentation, s.reporting_line, s.tools_channels_used,
               s.kpis, s.flowchart_data, s.tags, s.status, s.version_number,
               s.parent_id, s.review_date, s.created_at, s.updated_at,
               d.name as department_name, u.name as owner_name, a.name as approver_name
        FROM sops s 
        LEFT JOIN departments d ON s.department_id = d.id
        LEFT JOIN users u ON s.owner_id = u.id
        LEFT JOIN users a ON s.approver_id = a.id
        WHERE (s.company_id = $1 OR s.company_id IS NULL)
      `;
      const params: any[] = [companyId];

      if (!isAdmin && !isDeptHead) {
        query += ` AND (s.status = 'Published' OR s.owner_id = $${params.length + 1} OR s.created_by = $${params.length + 1})`;
        params.push(user?.id || 1);
      } else if (isDeptHead && !isAdmin) {
        query += ` AND (s.status = 'Published' OR s.department_id = $${params.length + 1} OR s.owner_id = $${params.length + 2})`;
        params.push(user.department_id);
        params.push(user?.id || 1);
      }
      
      if (status && status !== 'All') {
        params.push(status);
        query += ` AND s.status = $${params.length}`;
      }
      if (department_id && department_id !== 'All') {
        params.push(department_id);
        query += ` AND s.department_id = $${params.length}`;
      }
      if (search) {
        params.push(`%${search}%`);
        query += ` AND (s.title ILIKE $${params.length} OR s.objective ILIKE $${params.length} OR s.scope ILIKE $${params.length})`;
      }
      if (tags) {
        params.push(`%${tags}%`);
        query += ` AND s.tags ILIKE $${params.length}`;
      }
      if (version && version !== 'All') {
        params.push(version);
        query += ` AND s.version_number = $${params.length}`;
      }

      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);
      query += ` ORDER BY s.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limit, offset);
      
      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (err) {
      console.error("Error fetching SOPs:", err);
      res.json([]);
    }
  });

  router.get("/:id", checkPermission('SOPs', 'view'), async (req, res) => {
    const { id } = req.params;
    try {
      if (isNaN(parseInt(id))) {
        console.warn(`[SOP Details] Invalid ID format: ${id}`);
        return res.status(400).json({ error: "Invalid SOP ID format" });
      }

      const sopRes = await pool.query(`
        SELECT s.id, s.company_id, s.title, s.department_id, s.process_type, s.owner_id,
               s.approver_id, s.objective, s.scope, s.roles_responsibilities,
               s.required_documentation, s.reporting_line, s.tools_channels_used,
               s.kpis, s.flowchart_data, s.tags, s.status, s.version_number,
               s.parent_id, s.review_date, s.created_at, s.updated_at,
               d.name as department_name, u.name as owner_name, a.name as approver_name
        FROM sops s 
        LEFT JOIN departments d ON s.department_id = d.id
        LEFT JOIN users u ON s.owner_id = u.id
        LEFT JOIN users a ON s.approver_id = a.id
        WHERE s.id = $1 AND (s.company_id = $2 OR s.company_id IS NULL)
      `, [id, (req as any).user?.company_id || 1]);
      
      if (sopRes.rows.length === 0) {
        console.warn(`[SOP Details] SOP not found for ID: ${id} or access denied`);
        return res.status(404).json({ error: "SOP not found" });
      }

      console.log(`[SOP Details] Found SOP: ${sopRes.rows[0].title} (ID: ${id})`);
      const stepsRes = await pool.query("SELECT id, sop_id, step_number, step_description, attachment_url FROM sop_steps WHERE sop_id = $1 ORDER BY step_number ASC", [id]);
      const versionsRes = await pool.query(`
        SELECT v.id, v.sop_id, v.version_number, v.change_summary, v.updated_by, v.updated_at, u.name as updated_by_name 
        FROM sop_versions v 
        LEFT JOIN users u ON v.updated_by = u.id 
        WHERE v.sop_id = $1 
        ORDER BY v.updated_at DESC
      `, [id]);

      res.json({
        ...sopRes.rows[0],
        steps: stepsRes.rows,
        versions: versionsRes.rows
      });
    } catch (err) {
      console.error("Error fetching SOP details:", err);
      res.status(500).json({ error: "Failed to fetch SOP details" });
    }
  });

  router.post("/", checkPermission('SOPs', 'create'), async (req, res) => {
    const { 
      title, department_id, process_type, owner_id, 
      objective, scope, roles_responsibilities, required_documentation,
      reporting_line, tools_channels_used, kpis, flowchart_data, tags, review_date
    } = req.body;
    const companyId = (req as any).user?.company_id || 1;
    try {
      const sanitizedReviewDate = review_date === "" ? null : review_date;
      const result = await pool.query(
        `INSERT INTO sops (
          company_id, title, department_id, process_type, owner_id, 
          objective, scope, roles_responsibilities, required_documentation,
          reporting_line, tools_channels_used, kpis, flowchart_data, tags, status, review_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'Draft', $15) RETURNING id`,
        [
          companyId, title, department_id, process_type, owner_id, 
          objective, scope, roles_responsibilities, required_documentation,
          reporting_line, tools_channels_used, kpis, flowchart_data, tags, sanitizedReviewDate
        ]
      );
      
      const newId = result.rows.length > 0 ? result.rows[0].id : Date.now();

      const authUserId = (req as any).user?.id || 1;
      await logAction(authUserId, 'CREATE', 'SOP', newId, { title, company_id: companyId });

      // Create an entry in process_maps immediately for the new SOP
      await pool.query(
        'INSERT INTO process_maps (company_id, title, description, sop_id) VALUES ($1, $2, $3, $4)',
        [companyId, `Flow: ${title}`, `Visual map for SOP: ${title}`, newId]
      );

      // Trigger Orchestrator triggers
      const createdSop = { id: newId, title, company_id: companyId, department_id, owner_id };
      await automationService.trigger('sop:created', createdSop);
      await automationService.trigger('process_map:created', { title: `Flow: ${title}`, sop_id: newId, company_id: companyId });
      
      res.json({ id: newId });
    } catch (err) {
      console.error("Error creating SOP:", err);
      res.status(500).json({ error: "Failed to create SOP" });
    }
  });

  router.put("/:id", checkPermission('SOPs', 'edit'), async (req, res) => {
    const { id } = req.params;
    const { 
      title, department_id, process_type, owner_id, 
      objective, scope, roles_responsibilities, required_documentation,
      reporting_line, tools_channels_used, kpis, flowchart_data,
      status, version_number, tags, change_summary, updated_by, review_date
    } = req.body;

    try {
      const currentSop = await pool.query(
        "SELECT id, title, department_id, process_type, owner_id, status, version_number, parent_id, review_date FROM sops WHERE id = $1",
        [id]
      );
      if (currentSop.rows.length === 0) return res.status(404).json({ error: "SOP not found" });

      const isPublished = currentSop.rows[0].status === 'Published';
      const sanitizedReviewDate = review_date === "" ? null : review_date;

      if (isPublished) {
        // Create new version as Draft
        const nextVersion = (parseFloat(version_number || '1.0') + 0.1).toFixed(1);
        const newSopRes = await pool.query(
          `INSERT INTO sops (
            title, department_id, process_type, owner_id, 
            objective, scope, roles_responsibilities, required_documentation,
            reporting_line, tools_channels_used, kpis, flowchart_data, tags,
            status, version_number, parent_id, review_date
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'Draft', $14, $15, $16) 
          RETURNING id`,
          [
            title, department_id, process_type, owner_id, 
            objective, scope, roles_responsibilities, required_documentation,
            reporting_line, tools_channels_used, kpis, flowchart_data, tags,
            nextVersion, id, sanitizedReviewDate
          ]
        );
        
        if (!newSopRes.rows || newSopRes.rows.length === 0) {
          console.error("SOP Version Insertion failed: No rows returned from RETURNING id");
          throw new Error("Failed to create new SOP version - database insertion yielded no result.");
        }
        const newId = newSopRes.rows[0].id;

        const authUserId = parseInt(req.headers['x-user-id'] as string) || 1;
        await logAction(authUserId, 'CREATE_VERSION', 'SOP', newId, { title, parent_id: id, version: nextVersion });

        // Copy steps
        const steps = await pool.query("SELECT id, sop_id, step_number, step_description, attachment_url FROM sop_steps WHERE sop_id = $1", [id]);
        for (const step of steps.rows) {
          await pool.query(
            "INSERT INTO sop_steps (sop_id, step_number, step_description, attachment_url) VALUES ($1, $2, $3, $4)",
            [newId, step.step_number, step.step_description, step.attachment_url]
          );
        }

        // Record version history
        await pool.query(
          "INSERT INTO sop_versions (sop_id, version_number, change_summary, updated_by) VALUES ($1, $2, $3, $4)",
          [newId, nextVersion, change_summary || 'Updated from ' + version_number, updated_by || 1]
        );

        return res.json({ success: true, id: newId, isNewVersion: true });
      } else {
        // Update existing Draft
        const sanitizedReviewDate = review_date === "" ? null : review_date;
        await pool.query(
          `UPDATE sops SET 
            title = $1, department_id = $2, process_type = $3, owner_id = $4, 
            objective = $5, scope = $6, roles_responsibilities = $7, required_documentation = $8,
            reporting_line = $9, tools_channels_used = $10, kpis = $11, flowchart_data = $12,
            status = $13, version_number = $14, tags = $15, review_date = $16, updated_at = CURRENT_TIMESTAMP
          WHERE id = $17`,
          [
            title, department_id, process_type, owner_id, 
            objective, scope, roles_responsibilities, required_documentation,
            reporting_line, tools_channels_used, kpis, flowchart_data,
            status, version_number, tags, sanitizedReviewDate, id
          ]
        );

        // Sync steps from flowchart_data if provided
        if (flowchart_data) {
          try {
            const { nodes, edges } = JSON.parse(flowchart_data);
            const taskNodes = nodes.filter((n: any) => n.type === 'task' || n.type === 'sop_step');
            
            // 1. Sync Process Mapping Tables (Unified Source)
            const mapRes = await pool.query('SELECT id FROM process_maps WHERE sop_id = $1', [id]);
            if (mapRes.rows.length > 0) {
              const mapId = mapRes.rows[0].id;
              await pool.query('DELETE FROM process_nodes WHERE map_id = $1', [mapId]);
              await pool.query('DELETE FROM process_edges WHERE map_id = $1', [mapId]);
              
              const nodeMap: Record<string, number> = {};
              for (const node of nodes) {
                const nodeResult = await pool.query(
                  'INSERT INTO process_nodes (map_id, type, label, position_x, position_y, data) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
                  [mapId, node.type || 'process', node.data?.label || node.label || 'Node', node.position?.x || 0, node.position?.y || 0, JSON.stringify(node.data || {})]
                );
                nodeMap[node.id] = nodeResult.rows[0].id;
              }
              for (const edge of edges) {
                const s = nodeMap[edge.source];
                const t = nodeMap[edge.target];
                if (s && t) {
                  await pool.query('INSERT INTO process_edges (map_id, source_node, target_node, label) VALUES ($1, $2, $3, $4)', [mapId, s, t, edge.label || null]);
                }
              }
            }
            
            // 2. Sync SOP Steps and RACI
            // Delete old steps that were created from flowchart
            await pool.query("DELETE FROM sop_steps WHERE sop_id = $1", [id]);
            await pool.query("DELETE FROM raci_assignments WHERE sop_id = $1", [id]);

            for (let i = 0; i < taskNodes.length; i++) {
              const node = taskNodes[i];
              const stepResult = await pool.query(
                "INSERT INTO sop_steps (sop_id, step_number, step_description) VALUES ($1, $2, $3) RETURNING id",
                [id, i + 1, node.data.label]
              );
              if (stepResult.rows.length > 0) {
                const stepId = stepResult.rows[0].id;

                if (node.data.responsibleRoleId) {
                  await pool.query(
                    "INSERT INTO raci_assignments (sop_id, sop_step_id, role_type, role_id) VALUES ($1, $2, 'A', $3)",
                    [id, stepId, node.data.responsibleRoleId]
                  );
                }
              }
            }
          } catch (e) {
            console.error("Failed to sync steps and mapping from flowchart:", e);
            throw e; 
          }
        }

        res.json({ success: true, id });
        
        const authUserId = parseInt(req.headers['x-user-id'] as string) || 1;
        await logAction(authUserId, 'UPDATE', 'SOP', parseInt(id), { title, status });
      }
    } catch (err) {
      console.error("Error updating SOP:", err);
      res.status(500).json({ error: "Failed to update SOP" });
    }
  });

  router.delete("/:id", checkPermission('SOPs', 'delete'), async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query("DELETE FROM sops WHERE id = $1", [id]);
      
      const authUserId = parseInt(req.headers['x-user-id'] as string) || 1;
      await logAction(authUserId, 'DELETE', 'SOP', parseInt(id));
      
      res.json({ success: true });
    } catch (err) {
      console.error("Error deleting SOP:", err);
      res.status(500).json({ error: "Failed to delete SOP" });
    }
  });

  router.get("/:id/steps", checkPermission('SOPs', 'view'), async (req, res) => {
    const { id } = req.params;
    try {
      const stepsRes = await pool.query("SELECT * FROM sop_steps WHERE sop_id = $1 ORDER BY step_number ASC", [id]);
      res.json(stepsRes.rows);
    } catch (err) {
      console.error("Error fetching SOP steps:", err);
      res.status(500).json({ error: "Failed to fetch SOP steps" });
    }
  });

  router.post("/:id/steps", checkPermission('SOPs', 'edit'), async (req, res) => {
    const { id } = req.params;
    const { step_number, step_description, attachment_url } = req.body;
    try {
      await pool.query(
        "INSERT INTO sop_steps (sop_id, step_number, step_description, attachment_url) VALUES ($1, $2, $3, $4)",
        [id, step_number, step_description, attachment_url]
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to add step" });
    }
  });

  router.patch("/:id/status", checkPermission('SOPs', 'edit'), async (req, res) => {
    const { id } = req.params;
    const { status, approver_id } = req.body;
    const userId = req.headers['x-user-id'] || '1';

    try {
      const userRes = await pool.query(`
        SELECT u.role_id, u.department_id, d.department_head_id 
        FROM users u 
        LEFT JOIN departments d ON u.department_id = d.id 
        WHERE u.id = $1
      `, [userId]);
      
      const user = userRes.rows[0];
      const isAdmin = user?.role_id === 1 || userId === '1' || parseInt(userId as string) === 1;
      const isDeptHead = user?.department_head_id === parseInt(userId as string);

      if (status === 'Published' && !isAdmin && !isDeptHead) {
        return res.status(403).json({ error: "Only Admin or Department Head can publish SOPs" });
      }

      if (status === 'Published') {
        // Archive previous versions if any
        const currentSop = await pool.query("SELECT parent_id, title FROM sops WHERE id = $1", [id]);
        if (currentSop.rows[0].parent_id) {
          await pool.query("UPDATE sops SET status = 'Archived' WHERE id = $1 OR parent_id = $1", [currentSop.rows[0].parent_id]);
        }
        // Also archive other versions with same title but different ID
        await pool.query("UPDATE sops SET status = 'Archived' WHERE title = $1 AND id != $2 AND status = 'Published'", [currentSop.rows[0].title, id]);
      }

      const query = approver_id 
        ? "UPDATE sops SET status = $1, approver_id = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3"
        : "UPDATE sops SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2";
      const params = approver_id ? [status, approver_id, id] : [status, id];
      
      await pool.query(query, params);

      const { NotificationService } = await import("../../services/notification.service.js");
      if (status === 'Pending Approval') {
        // Notify Admins and Dept Heads
        const admins = await pool.query("SELECT id FROM users WHERE role_id = 1");
        for (const admin of admins.rows) {
          await NotificationService.notify(admin.id, "SOP Approval Required", `SOP #${id} is waiting for your approval.`, "warning", `/sop/${id}`);
        }
      } else if (status === 'Published') {
        await NotificationService.notify(null, "New SOP Published", `A new SOP has been published: #${id}`, "success", `/sop/${id}`);
      }
      
      await NotificationService.logActivity(parseInt(userId as string), `SOP Status Changed to ${status}`, 'SOP', parseInt(id));
      await logAction(parseInt(userId as string), 'STATUS_CHANGE', 'SOP', parseInt(id), { status });

      const sopRes = await pool.query(
        "SELECT id, company_id, title, department_id, process_type, owner_id, approver_id, status, version_number FROM sops WHERE id = $1",
        [id]
      );
      await automationService.trigger('sop:status:changed', sopRes.rows[0]);

      res.json({ success: true });
    } catch (err) {
      console.error("Error updating status:", err);
      res.status(500).json({ error: "Failed to update status" });
    }
  });

  router.post("/:id/acknowledge", async (req, res) => {
    const { id } = req.params;
    const { user_id } = req.body;
    try {
      await pool.query(
        "INSERT INTO sop_acknowledgments (sop_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [id, user_id]
      );
      await automationService.trigger('sop:acknowledged', { sop_id: parseInt(id), user_id: parseInt(user_id) });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to acknowledge SOP" });
    }
  });

  router.get("/:id/acknowledgment", async (req, res) => {
    const { id } = req.params;
    const { user_id } = req.query;
    try {
      const result = await pool.query(
        "SELECT id, sop_id, user_id, acknowledged_at FROM sop_acknowledgments WHERE sop_id = $1 AND user_id = $2",
        [id, user_id]
      );
      res.json({ acknowledged: result.rows.length > 0 });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch acknowledgment status" });
    }
  });

  return router;
}
