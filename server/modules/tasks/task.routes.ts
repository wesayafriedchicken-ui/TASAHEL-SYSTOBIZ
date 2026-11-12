import express from "express";
import { pool } from "../../db/schema.js";
import { automationService } from "../../services/automation.service.js";
import { logAction } from "../../services/auditLogger.js";
import { getPaginationParams, sendPaginatedResponse } from "../../utils/queryHelper.js";

export default function taskRoutes() {
  const router = express.Router();

  router.get("/", async (req, res) => {
    try {
      const companyId = (req as any).user?.company_id || 1;
      const { status, priority, assigned_to, search } = req.query;
      const pagination = getPaginationParams(req, { defaultLimit: 50, maxLimit: 200 });

      let whereConditions = ["t.company_id = $1"];
      let queryParams: any[] = [companyId];
      let paramIdx = 2;

      if (status && status !== 'all') {
        whereConditions.push(`t.status = $${paramIdx}`);
        queryParams.push(status);
        paramIdx++;
      }

      if (priority && priority !== 'all') {
        whereConditions.push(`t.priority = $${paramIdx}`);
        queryParams.push(priority);
        paramIdx++;
      }

      if (assigned_to && assigned_to !== 'all') {
        whereConditions.push(`t.assigned_to = $${paramIdx}`);
        queryParams.push(assigned_to);
        paramIdx++;
      }

      if (search && typeof search === 'string' && search.trim()) {
        whereConditions.push(`(t.title ILIKE $${paramIdx} OR t.description ILIKE $${paramIdx})`);
        queryParams.push(`%${search.trim()}%`);
        paramIdx++;
      }

      const whereClause = whereConditions.join(" AND ");

      // 1. Fast Count
      const countRes = await pool.query(
        `SELECT COUNT(*) as total FROM tasks t WHERE ${whereClause}`,
        queryParams
      );
      const total = parseInt(countRes.rows[0]?.total || '0', 10);
      const totalPages = Math.ceil(total / pagination.limit) || 1;

      // 2. Data Query with projected fields
      const tasksResult = await pool.query(`
        SELECT 
          t.id, t.company_id, t.title, t.description, t.assigned_to, t.status, t.priority, 
          t.due_date, t.created_at, t.updated_at, t.sop_step_id, t.depends_on_task_id, t.time_spent_seconds,
          u.name as assigned_to_name, u.avatar_url as assigned_to_avatar, s.step_description, u.reporting_to 
        FROM tasks t 
        LEFT JOIN users u ON t.assigned_to = u.id 
        LEFT JOIN sop_steps s ON t.sop_step_id = s.id
        WHERE ${whereClause}
        ORDER BY t.created_at DESC
        LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
      `, [...queryParams, pagination.limit, pagination.offset]);
      
      const taskIds = tasksResult.rows.map(r => r.id);
      let checklistRows: any[] = [];
      if (taskIds.length > 0) {
        const checklistResult = await pool.query(
          "SELECT id, task_id, title, is_completed FROM task_checklists WHERE task_id = ANY($1::int[]) ORDER BY created_at ASC",
          [taskIds]
        ).catch(() => ({ rows: [] }));
        checklistRows = checklistResult.rows;
      }
      
      const tasks = tasksResult.rows.map(task => ({
        ...task,
        checklist: checklistRows.filter(item => item.task_id === task.id)
      }));

      sendPaginatedResponse(req, res, {
        data: tasks,
        pagination: {
          total,
          page: pagination.page,
          limit: pagination.limit,
          totalPages,
          hasNextPage: pagination.page < totalPages,
          hasPrevPage: pagination.page > 1
        }
      });
    } catch (err) {
      console.error('Error fetching tasks:', err);
      res.status(500).json({ error: "Failed to fetch tasks" });
    }
  });

  // Get single task by ID with full relations
  router.get("/:id", async (req, res) => {
    try {
      const taskId = parseInt(req.params.id, 10);
      if (isNaN(taskId)) {
        return res.status(400).json({ error: "Invalid task ID" });
      }
      const companyId = (req as any).user?.company_id || 1;

      const taskResult = await pool.query(`
        SELECT 
          t.id, t.company_id, t.title, t.description, t.assigned_to, t.status, t.priority, 
          t.due_date, t.created_at, t.updated_at, t.sop_step_id, t.depends_on_task_id, t.time_spent_seconds,
          t.deal_id, t.module_id, t.related_id,
          u.name as assigned_to_name, u.avatar_url as assigned_to_avatar, u.email as assigned_to_email,
          s.step_description, 
          dep.title as depends_on_task_title, dep.status as depends_on_task_status
        FROM tasks t 
        LEFT JOIN users u ON t.assigned_to = u.id 
        LEFT JOIN sop_steps s ON t.sop_step_id = s.id
        LEFT JOIN tasks dep ON t.depends_on_task_id = dep.id
        WHERE t.id = $1 AND (t.company_id = $2 OR t.company_id IS NULL)
      `, [taskId, companyId]);

      if (taskResult.rows.length === 0) {
        return res.status(404).json({ error: "Task not found" });
      }

      const task = taskResult.rows[0];

      // Checklist items
      const checklistResult = await pool.query(
        "SELECT id, task_id, title, is_completed FROM task_checklists WHERE task_id = $1 ORDER BY created_at ASC",
        [taskId]
      ).catch(() => ({ rows: [] }));

      // Comments
      const commentsResult = await pool.query(
        "SELECT id, task_id, user_id, user_name, comment, attachment_url, created_at FROM task_comments WHERE task_id = $1 ORDER BY created_at ASC",
        [taskId]
      ).catch(() => ({ rows: [] }));

      // Linked CRM Deal info if exists
      let dealInfo = null;
      if (task.deal_id) {
        try {
          const dealRes = await pool.query(
            "SELECT id, title, customer_name, value FROM crm_deals WHERE id = $1",
            [task.deal_id]
          );
          if (dealRes.rows.length > 0) {
            dealInfo = dealRes.rows[0];
          }
        } catch (e) {
          // ignore
        }
      }

      res.json({
        ...task,
        checklist: checklistResult.rows,
        comments: commentsResult.rows,
        deal: dealInfo
      });
    } catch (err) {
      console.error("Error fetching single task:", err);
      res.status(500).json({ error: "Failed to fetch task details" });
    }
  });

  // Checklist routes
  router.post("/:task_id/checklist", async (req, res) => {
    const { title } = req.body;
    const { task_id } = req.params;
    const companyId = (req as any).user?.company_id || 1;
    try {
      const result = await pool.query(
        "INSERT INTO task_checklists (company_id, task_id, title) VALUES ($1, $2, $3) RETURNING id, company_id, task_id, title, is_completed",
        [companyId, task_id, title]
      );
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to add checklist item" });
    }
  });

  router.patch("/checklist/:id", async (req, res) => {
    const { is_completed, title } = req.body;
    const companyId = (req as any).user?.company_id || 1;
    try {
      const result = await pool.query(
        "UPDATE task_checklists SET is_completed = COALESCE($1, is_completed), title = COALESCE($2, title) WHERE id = $3 AND company_id = $4 RETURNING id, is_completed, title",
        [is_completed, title, req.params.id, companyId]
      );
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update checklist item" });
    }
  });

  router.delete("/checklist/:id", async (req, res) => {
    const companyId = (req as any).user?.company_id || 1;
    try {
      await pool.query("DELETE FROM task_checklists WHERE id = $1 AND company_id = $2", [req.params.id, companyId]);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to delete checklist item" });
    }
  });

  router.post("/", async (req, res) => {
    const { title, description, assigned_to, priority, due_date, sop_step_id, deal_id, module_id, related_id, depends_on_task_id, time_spent_seconds } = req.body;
    const user = (req as any).user;
    const companyId = user?.company_id || 1;
    try {
      const result = await pool.query(
        `INSERT INTO tasks (company_id, title, description, assigned_to, priority, due_date, sop_step_id, deal_id, module_id, related_id, depends_on_task_id, time_spent_seconds) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
         RETURNING id, company_id, title, description, assigned_to, priority, due_date, status, sop_step_id, deal_id, module_id, related_id, depends_on_task_id, time_spent_seconds, created_at`,
        [companyId, title, description, assigned_to, priority, due_date, sop_step_id, deal_id, module_id, related_id, depends_on_task_id || null, time_spent_seconds || 0]
      );
      
      const authUserId = user?.id || 1;
      const createdTask = result.rows[0];
      await logAction(authUserId, 'CREATE', 'Task', createdTask.id, { title, company_id: companyId });
      await automationService.trigger('task:created', createdTask);

      res.json(createdTask);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create task" });
    }
  });

  const updateTaskHandler = async (req: express.Request, res: express.Response) => {
    const { status, title, description, assigned_to, priority, due_date, module_id, related_id, sop_step_id, deal_id, depends_on_task_id, time_spent_seconds } = req.body;
    const user = (req as any).user;
    const companyId = user?.company_id || 1;
    try {
      // Get the old task state first to compare changes and get fields if not provided in req.body
      const oldTaskRes = await pool.query(
        "SELECT id, status, title, description, assigned_to, priority, due_date, module_id, related_id, deal_id, time_spent_seconds FROM tasks WHERE id = $1 AND (company_id = $2 OR company_id IS NULL)", 
        [req.params.id, companyId]
      );
      if (oldTaskRes.rows.length === 0) return res.status(404).json({ error: "Task not found" });
      const oldTask = oldTaskRes.rows[0];

      const result = await pool.query(
        `UPDATE tasks SET 
          status = COALESCE($1, status),
          title = COALESCE($2, title),
          description = COALESCE($3, description),
          assigned_to = COALESCE($4, assigned_to),
          priority = COALESCE($5, priority),
          due_date = COALESCE($6, due_date),
          module_id = COALESCE($7, module_id),
          related_id = COALESCE($8, related_id),
          sop_step_id = COALESCE($9, sop_step_id),
          deal_id = COALESCE($10, deal_id),
          depends_on_task_id = COALESCE($11, depends_on_task_id),
          time_spent_seconds = COALESCE($12, time_spent_seconds),
          updated_at = CURRENT_TIMESTAMP 
         WHERE id = $13 AND (company_id = $14 OR company_id IS NULL)
         RETURNING id, company_id, title, description, assigned_to, priority, due_date, status, module_id, related_id, deal_id, sop_step_id, updated_at`,
        [status, title, description, assigned_to, priority, due_date, module_id, related_id, sop_step_id, deal_id, depends_on_task_id, time_spent_seconds, req.params.id, companyId]
      );
      
      if (result.rows.length === 0) return res.status(404).json({ error: "Task not found" });
      const task = result.rows[0];

      const authUserId = user?.id || 1;
      await logAction(authUserId, 'STATUS_CHANGE', 'Task', task.id, { status, company_id: companyId });
      await automationService.trigger('task:status_changed', task);

      // Trigger automatic sync with CRM Deals (history logs + active reminders status)
      if (task.module_id === 'crm' && task.deal_id) {
        try {
          const dealId = task.deal_id;
          const dealRes = await pool.query(
            "SELECT id, title, customer_name, value, history_logs, active_reminders FROM crm_deals WHERE id = $1",
            [dealId]
          );
          if (dealRes.rows.length > 0) {
            const deal = dealRes.rows[0];
            const userName = user?.name || 'System';
            
            // 1. Prepare history log entry
            let historyLogs = deal.history_logs;
            if (!Array.isArray(historyLogs)) historyLogs = [];
            
            let action = 'تعديل مهمة';
            let details = `تم تعديل تفاصيل المهمة المرتبطة: "${task.title}".`;
            
            if (task.status === 'completed' && oldTask.status !== 'completed') {
              action = 'إنهاء مهمة';
              details = `تم إكمال المهمة المرتبطة بالصفقة بنجاح: "${task.title}".`;
            } else if (task.status !== oldTask.status) {
              action = 'تحديث حالة المهمة';
              details = `تم تغيير حالة المهمة المرتبطة "${task.title}" من "${oldTask.status}" إلى "${task.status}".`;
            } else if (task.title !== oldTask.title) {
              action = 'تعديل عنوان مهمة';
              details = `تم تعديل عنوان المهمة المرتبطة من "${oldTask.title}" إلى "${task.title}".`;
            }
            
            const newLog = {
              id: Date.now().toString(),
              action,
              details,
              user_name: userName,
              created_at: new Date().toISOString()
            };
            historyLogs.unshift(newLog);
            
            // 2. Sync Active Reminders status if applicable
            let reminders = deal.reminders;
            
            const isReminderTask = task.title.startsWith("متابعة صفقة:") || task.title.startsWith("متابعة صفقة: ");
            if (isReminderTask && Array.isArray(reminders)) {
              const prefixLength = task.title.startsWith("متابعة صفقة: ") ? "متابعة صفقة: ".length : "متابعة صفقة:".length;
              const reminderTitle = task.title.substring(prefixLength).trim();
              
              const matchedIndex = reminders.findIndex((r: any) => r.title.trim() === reminderTitle);
              if (matchedIndex !== -1) {
                const oldStatus = reminders[matchedIndex].status || 'active';
                let newStatus = oldStatus;
                
                if (task.status === 'completed') {
                  newStatus = 'completed';
                } else if (task.status === 'in_progress') {
                  newStatus = 'in_progress';
                } else if (task.status === 'pending') {
                  newStatus = 'active';
                }
                
                if (newStatus !== oldStatus) {
                  reminders[matchedIndex].status = newStatus;
                  
                  const arabicStatusMap: any = {
                    'active': 'بانتظار المتابعة',
                    'in_progress': 'جاري التواصل / In Progress',
                    'completed': 'تمت المتابعة'
                  };
                  const statusText = arabicStatusMap[newStatus] || newStatus;
                  
                  const reminderLog = {
                    id: (Date.now() + 1).toString(),
                    action: 'تحديث حالة التذكير',
                    details: `تم تحديث حالة التذكير لـ "${reminderTitle}" تلقائياً إلى "${statusText}" بناءً على حركة المهمة المرتبطة.`,
                    user_name: 'النظام',
                    created_at: new Date().toISOString()
                  };
                  historyLogs.unshift(reminderLog);
                }
              }
            }
            
            await pool.query(
              `UPDATE crm_deals 
               SET history_logs = $1, 
                   reminders = $2, 
                   updated_at = CURRENT_TIMESTAMP 
               WHERE id = $3`,
              [JSON.stringify(historyLogs), JSON.stringify(reminders), dealId]
            );
          }
        } catch (crmErr) {
          console.error("Error updating CRM from task update:", crmErr);
        }
      }

      // RACI Automation: If task is completed and linked to a SOP step
      if (status === 'completed' && task.sop_step_id) {
        // Find Accountable (A) for this step
        const raciRes = await pool.query(
          "SELECT user_id, role_id FROM raci_assignments WHERE sop_step_id = $1 AND role_type = 'A' AND company_id = $2",
          [task.sop_step_id, companyId]
        );

        if (raciRes.rows.length > 0) {
          const { user_id, role_id } = raciRes.rows[0];
          let recipientId = user_id;

          // If assigned to a role, find the first user with that role
          if (!recipientId && role_id) {
            const userRes = await pool.query("SELECT id FROM users WHERE role_id = $1 AND company_id = $2 LIMIT 1", [role_id, companyId]);
            if (userRes.rows.length > 0) recipientId = userRes.rows[0].id;
          }

          if (recipientId) {
            await automationService.trigger('raci:task:completed', {
              task_id: task.id,
              task_title: task.title,
              recipient_id: recipientId,
              company_id: companyId
            });
          }
        }

        // Notify Informed (I)
        const informedRes = await pool.query(
          "SELECT user_id, role_id FROM raci_assignments WHERE sop_step_id = $1 AND role_type = 'I' AND company_id = $2",
          [task.sop_step_id, companyId]
        );

        for (const row of informedRes.rows) {
          let recId = row.user_id;
          if (!recId && row.role_id) {
            const uRes = await pool.query("SELECT id FROM users WHERE role_id = $1 AND company_id = $2 LIMIT 1", [row.role_id, companyId]);
            if (uRes.rows.length > 0) recId = uRes.rows[0].id;
          }
          if (recId) {
            await automationService.trigger('raci:task:informed', {
              task_id: task.id,
              task_title: task.title,
              status: status,
              recipient_id: recId,
              company_id: companyId
            });
          }
        }
      }

      res.json(task);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update task" });
    }
  };

  router.patch("/:id", updateTaskHandler);
  router.put("/:id", updateTaskHandler);

  // Comments and Activity log endpoints
  router.get("/:task_id/comments", async (req, res) => {
    try {
      const { task_id } = req.params;
      const result = await pool.query(
        "SELECT id, task_id, user_id, user_name, comment, attachment_url, created_at FROM task_comments WHERE task_id = $1 ORDER BY created_at ASC",
        [task_id]
      );
      res.json(result.rows);
    } catch (err) {
      console.error("Error fetching comments:", err);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  router.post("/:task_id/comments", async (req, res) => {
    const { comment, attachment_url, user_name } = req.body;
    const { task_id } = req.params;
    const user = (req as any).user;
    const userId = user?.id || 1;
    const finalUserName = user_name || user?.name || "Employee";

    try {
      const result = await pool.query(
        "INSERT INTO task_comments (task_id, user_id, user_name, comment, attachment_url) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [task_id, userId, finalUserName, comment, attachment_url || null]
      );
      res.json(result.rows[0]);
    } catch (err) {
      console.error("Error creating comment:", err);
      res.status(500).json({ error: "Failed to add comment" });
    }
  });

  router.delete("/:id", async (req, res) => {
    const companyId = (req as any).user?.company_id || 1;
    try {
      const authUserId = (req as any).user?.id || 1;
      const oldRes = await pool.query(
        "SELECT id, company_id, title, assigned_to, status FROM tasks WHERE id = $1 AND (company_id = $2 OR company_id IS NULL)",
        [req.params.id, companyId]
      );
      const oldTask = oldRes.rows[0];
      await logAction(authUserId, 'DELETE', 'Task', parseInt(req.params.id), { company_id: companyId });
      await pool.query("DELETE FROM tasks WHERE id = $1 AND (company_id = $2 OR company_id IS NULL)", [req.params.id, companyId]);
      if (oldTask) {
        await automationService.trigger('task:deleted', oldTask);
      }
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to delete task" });
    }
  });

  return router;
}
