import express from "express";
import { pool } from "../../db/schema.js";
import { logAction } from "../../services/auditLogger.js";
import { memoryCache } from "../../utils/cache.js";

// Helper to update/create direct operational expense journal entry in Accounting Module
async function syncJournalEntryForWorkOrder(workOrderId: number, title: string, actualCost: number, companyId: number) {
  const reference = `WO-${workOrderId}`;
  const jeId = `JE-WO-${workOrderId}`;
  const description = `Accrued Operational Cost for WO #${workOrderId} - ${title}`;
  
  const lines = [
    { account_id: "50500", debit: actualCost, credit: 0 },
    { account_id: "20100", debit: 0, credit: actualCost }
  ];

  try {
    // Check if journal entry already exists
    const checkRes = await pool.query(
      "SELECT id FROM acct_journal_entries WHERE reference = $1 AND company_id = $2",
      [reference, companyId]
    );

    if (checkRes.rows.length > 0) {
      // Update existing
      await pool.query(
        `UPDATE acct_journal_entries 
         SET lines = $1, description = $2, date = CURRENT_DATE 
         WHERE reference = $3 AND company_id = $4`,
        [JSON.stringify(lines), description, reference, companyId]
      );
    } else {
      // Create new
      await pool.query(
        `INSERT INTO acct_journal_entries (id, company_id, date, reference, description, lines, is_system)
         VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, TRUE)`,
        [jeId, companyId, reference, description, JSON.stringify(lines)]
      );
    }
  } catch (err) {
    console.error(`❌ Failed to sync journal entry for work order ${workOrderId}:`, err);
  }
}

// Function to trigger work order creation from a CRM deal
export async function createWorkOrderFromDeal(dealId: number, companyId: number = 1) {
  try {
    // 1. Check if work order already exists for this deal to prevent duplication
    const checkWO = await pool.query("SELECT id FROM work_orders WHERE deal_id = $1", [dealId]);
    if (checkWO.rows.length > 0) {
      return checkWO.rows[0];
    }

    // 2. Fetch deal with customer name
    const dealRes = await pool.query(
      `SELECT d.*, c.name as customer_name 
       FROM crm_deals d
       LEFT JOIN crm_customers c ON d.customer_id = c.id
       WHERE d.id = $1`,
      [dealId]
    );

    if (dealRes.rows.length === 0) {
      console.warn(`⚠️ Deal with ID ${dealId} not found.`);
      return null;
    }

    const deal = dealRes.rows[0];
    const items = Array.isArray(deal.items) ? deal.items : [];
    const populatedItems = [];
    let defaultCostTotal = 0;

    // 3. Process items and pull default costs from product catalog
    for (const item of items) {
      const prodName = item.name || item.product_name;
      let defaultCost = 0;
      
      if (prodName) {
        const prodRes = await pool.query("SELECT cost FROM products WHERE name = $1 LIMIT 1", [prodName]);
        if (prodRes.rows.length > 0) {
          defaultCost = prodRes.rows[0].cost || 0;
        }
      }

      const salePrice = item.price || item.sale_price || 0;
      const qty = item.quantity || 1;

      populatedItems.push({
        id: item.id || item.product_id || Math.random().toString(36).substr(2, 9),
        name: prodName || "Standard Service",
        sale_price: salePrice,
        quantity: qty,
        default_cost: defaultCost,
        actual_cost: defaultCost, // Auto-populated
        category: item.category || "Service"
      });

      defaultCostTotal += (defaultCost * qty);
    }

    // 4. Create the work order in the database
    const insertRes = await pool.query(
      `INSERT INTO work_orders (
         deal_id, customer_name, title, status, items, actual_cost_total, sale_value
       ) VALUES ($1, $2, $3, 'Pending', $4, $5, $6) RETURNING *`,
      [
        dealId,
        deal.customer_name || "Customer",
        deal.title,
        JSON.stringify(populatedItems),
        defaultCostTotal,
        deal.value || 0.0
      ]
    );

    const newWO = insertRes.rows[0];
    console.log(`🚀 Automatically created Work Order #${newWO.id} from Won Deal #${dealId}`);

    // 5. Instantly post to Accounting direct operational expenses
    await syncJournalEntryForWorkOrder(newWO.id, newWO.title, defaultCostTotal, companyId);

    return newWO;
  } catch (err) {
    console.error("❌ Error in createWorkOrderFromDeal:", err);
    return null;
  }
}

export default function operationsHubRoutes(wss: any) {
  const router = express.Router();

  // GET all operation stages
  router.get("/stages", async (req, res) => {
    try {
      const cacheKey = "ops:stages";
      const cached = memoryCache.get(cacheKey);
      if (cached) return res.json(cached);

      const result = await pool.query("SELECT id, name, color, order_index, is_completed FROM operation_stages ORDER BY order_index ASC");
      memoryCache.set(cacheKey, result.rows, 300);
      res.json(result.rows);
    } catch (err) {
      console.error("Error fetching operation stages:", err);
      res.status(500).json({ error: "Failed to fetch operation stages" });
    }
  });

  // POST create a new operation stage
  router.post("/stages", async (req, res) => {
    const { name, color, order_index, is_completed } = req.body;
    if (!name) return res.status(400).json({ error: "Missing stage name" });

    try {
      const result = await pool.query(
        `INSERT INTO operation_stages (name, color, order_index, is_completed)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [name, color || '#3b82f6', order_index || 0, !!is_completed]
      );
      memoryCache.delete("ops:stages");
      // Broadcast update
      wss.clients.forEach((client: any) => {
        client.send(JSON.stringify({ type: "MODULE_UPDATED", table: "operations" }));
      });
      res.json(result.rows[0]);
    } catch (err) {
      console.error("Error creating stage:", err);
      res.status(500).json({ error: "Failed to create stage" });
    }
  });

  // PUT update an operation stage
  router.put("/stages/:id", async (req, res) => {
    const { id } = req.params;
    const { name, color, order_index, is_completed } = req.body;
    try {
      const result = await pool.query(
        `UPDATE operation_stages 
         SET name = $1, color = $2, order_index = $3, is_completed = $4
         WHERE id = $5 RETURNING *`,
        [name, color, order_index, is_completed, id]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: "Stage not found" });

      memoryCache.delete("ops:stages");
      // Broadcast update
      wss.clients.forEach((client: any) => {
        client.send(JSON.stringify({ type: "MODULE_UPDATED", table: "operations" }));
      });
      res.json(result.rows[0]);
    } catch (err) {
      console.error("Error updating stage:", err);
      res.status(500).json({ error: "Failed to update stage" });
    }
  });

  // DELETE an operation stage
  router.delete("/stages/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const stageRes = await pool.query("SELECT name FROM operation_stages WHERE id = $1", [id]);
      if (stageRes.rows.length === 0) return res.status(404).json({ error: "Stage not found" });
      const stageName = stageRes.rows[0].name;

      // Delete the stage
      await pool.query("DELETE FROM operation_stages WHERE id = $1", [id]);

      // Move work orders with deleted stage to another stage or first stage
      const firstStageRes = await pool.query("SELECT name FROM operation_stages ORDER BY order_index ASC LIMIT 1");
      if (firstStageRes.rows.length > 0) {
        const fallbackName = firstStageRes.rows[0].name;
        await pool.query("UPDATE work_orders SET status = $1 WHERE status = $2", [fallbackName, stageName]);
      }

      memoryCache.delete("ops:stages");
      // Broadcast update
      wss.clients.forEach((client: any) => {
        client.send(JSON.stringify({ type: "MODULE_UPDATED", table: "operations" }));
      });
      res.json({ success: true });
    } catch (err) {
      console.error("Error deleting stage:", err);
      res.status(500).json({ error: "Failed to delete stage" });
    }
  });

  // GET all work orders and users list for multi-role assignment
  router.get("/work-orders", async (req, res) => {
    try {
      const companyId = (req as any).user?.company_id || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 100, 200);
      const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);

      // Fetch work orders with explicit column list and limit
      const woRes = await pool.query(
        `SELECT id, deal_id, customer_name, title, status, items, actual_cost_total,
                sale_value, qa_status, qa_feedback, expected_start_date, due_date,
                supervisor_id, assignment_date, completion_date, created_at, updated_at
         FROM work_orders 
         ORDER BY id DESC 
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      // Fetch users for supervisor assignment desk (cached if possible)
      const usersRes = await pool.query(
        "SELECT id, name, email, job_title, department_id FROM users ORDER BY name ASC"
      );

      // Fetch catalog products to display default cost reference
      const productsRes = await pool.query(
        "SELECT id, name, cost, price FROM products ORDER BY name ASC"
      );

      // Fetch QA tickets with related work orders and names
      const qaTicketsRes = await pool.query(
        `SELECT t.id, t.work_order_id, t.title, t.description, t.status, t.severity,
                t.reported_by, t.assigned_to, t.created_at, t.updated_at,
                w.title as work_order_title, w.customer_name as work_order_customer_name, 
                u.name as assigned_to_name, r.name as reported_by_name
         FROM work_order_qa_tickets t
         LEFT JOIN work_orders w ON t.work_order_id = w.id
         LEFT JOIN users u ON t.assigned_to = u.id
         LEFT JOIN users r ON t.reported_by = r.id
         ORDER BY t.id DESC
         LIMIT 100`
      );

      res.json({
        workOrders: woRes.rows,
        users: usersRes.rows,
        products: productsRes.rows,
        qaTickets: qaTicketsRes.rows
      });
    } catch (err) {
      console.error("Error fetching work orders:", err);
      res.status(500).json({ error: "Failed to fetch work orders data" });
    }
  });

  // POST manually trigger creation of a work order from a deal
  router.post("/work-orders/trigger-won-deal", async (req, res) => {
    const { dealId } = req.body;
    if (!dealId) {
      return res.status(400).json({ error: "Missing dealId" });
    }
    try {
      const companyId = (req as any).user?.company_id || 1;
      const wo = await createWorkOrderFromDeal(parseInt(dealId), companyId);
      if (wo) {
        // Broadcast updates
        wss.clients.forEach((client: any) => {
          client.send(JSON.stringify({ type: "MODULE_UPDATED", table: "operations" }));
          client.send(JSON.stringify({ type: "MODULE_UPDATED", table: "accounting" }));
        });
        return res.json({ success: true, workOrder: wo });
      }
      res.status(404).json({ error: "Failed to trigger work order. Ensure deal exists." });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal server error triggering work order" });
    }
  });

  // POST create a brand new work order from scratch
  router.post("/work-orders", async (req, res) => {
    const { 
      title, 
      customer_name, 
      status, 
      execution_agent_id, 
      delivery_agent_id, 
      items, 
      actual_cost_total, 
      sale_value,
      expected_start_date,
      due_date,
      supervisor_id,
      assignment_date,
      completion_date
    } = req.body;
    if (!title) return res.status(400).json({ error: "Missing work order title" });
    const companyId = (req as any).user?.company_id || 1;

    try {
      const itemsJson = items ? JSON.stringify(items) : '[]';
      const finalAssignmentDate = (execution_agent_id || delivery_agent_id) ? (assignment_date || new Date().toISOString()) : null;
      
      const result = await pool.query(
        `INSERT INTO work_orders (
          title, customer_name, status, execution_agent_id, delivery_agent_id, items, actual_cost_total, sale_value, expected_start_date, due_date, supervisor_id, assignment_date, completion_date, created_at, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING *`,
        [
          title,
          customer_name || "New Client",
          status || 'Pending',
          execution_agent_id ? parseInt(execution_agent_id) : null,
          delivery_agent_id ? parseInt(delivery_agent_id) : null,
          itemsJson,
          actual_cost_total || 0.0,
          sale_value || 0.0,
          expected_start_date || null,
          due_date || null,
          supervisor_id ? parseInt(supervisor_id) : null,
          finalAssignmentDate,
          completion_date || null
        ]
      );

      const newWO = result.rows[0];

      // Instantly update Finance & Accounting journal entry
      await syncJournalEntryForWorkOrder(newWO.id, newWO.title, newWO.actual_cost_total || 0, companyId);

      // Broadcast real-time updates to connected clients
      wss.clients.forEach((client: any) => {
        client.send(JSON.stringify({ type: "MODULE_UPDATED", table: "operations" }));
        client.send(JSON.stringify({ type: "MODULE_UPDATED", table: "accounting" }));
      });

      res.status(201).json(newWO);
    } catch (err) {
      console.error("Error creating work order:", err);
      res.status(500).json({ error: "Failed to create work order" });
    }
  });

  // PUT update work order details (status, agents, items override, actual costs, title, customer, value)
  router.put("/work-orders/:id", async (req, res) => {
    const { id } = req.params;
    const { 
      status, 
      execution_agent_id, 
      delivery_agent_id, 
      items, 
      actual_cost_total, 
      title, 
      customer_name, 
      sale_value, 
      qa_status, 
      qa_feedback,
      expected_start_date,
      due_date,
      supervisor_id,
      assignment_date,
      completion_date
    } = req.body;
    const authUserId = parseInt(req.headers['x-user-id'] as string) || 1;
    const companyId = (req as any).user?.company_id || 1;

    try {
      // 1. Fetch current work order state before update
      const currentRes = await pool.query(`
        SELECT id, deal_id, customer_name, title, status, items, actual_cost_total,
               sale_value, qa_status, qa_feedback, expected_start_date, due_date,
               supervisor_id, assignment_date, completion_date
        FROM work_orders 
        WHERE id = $1
      `, [id]);
      if (currentRes.rows.length === 0) {
        return res.status(404).json({ error: "Work order not found" });
      }
      const currentWO = currentRes.rows[0];

      // Auto QA Status assignment when transitioning to a completed stage
      let finalQaStatus = qa_status !== undefined ? qa_status : currentWO.qa_status;
      if (status && status !== currentWO.status) {
        const stageCheck = await pool.query(
          "SELECT is_completed FROM operation_stages WHERE name = $1",
          [status]
        );
        if (stageCheck.rows.length > 0 && stageCheck.rows[0].is_completed) {
          finalQaStatus = 'Pending Review';
        }
      }
      const finalQaFeedback = qa_feedback !== undefined ? qa_feedback : currentWO.qa_feedback;

      // Smart assignments & turnaround timestamps
      let finalAssignmentDate = assignment_date !== undefined ? assignment_date : currentWO.assignment_date;
      const originalExec = currentWO.execution_agent_id;
      const originalDelivery = currentWO.delivery_agent_id;
      const newExec = execution_agent_id !== undefined ? execution_agent_id : originalExec;
      const newDelivery = delivery_agent_id !== undefined ? delivery_agent_id : originalDelivery;
      
      if ((newExec || newDelivery) && (!originalExec && !originalDelivery) && !finalAssignmentDate) {
        finalAssignmentDate = new Date().toISOString();
      }

      let finalCompletionDate = completion_date !== undefined ? completion_date : currentWO.completion_date;
      if (status && status !== currentWO.status) {
        const stageCheck = await pool.query(
          "SELECT is_completed FROM operation_stages WHERE name = $1",
          [status]
        );
        if (stageCheck.rows.length > 0 && stageCheck.rows[0].is_completed) {
          finalCompletionDate = new Date().toISOString();
        }
      }

      // 2. Perform database update
      const updateRes = await pool.query(
        `UPDATE work_orders 
         SET status = $1, 
             execution_agent_id = $2, 
             delivery_agent_id = $3, 
             items = $4, 
             actual_cost_total = $5,
             title = $6,
             customer_name = $7,
             sale_value = $8,
             qa_status = $9,
             qa_feedback = $10,
             expected_start_date = $11,
             due_date = $12,
             supervisor_id = $13,
             assignment_date = $14,
             completion_date = $15,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $16 RETURNING *`,
        [
          status || currentWO.status,
          execution_agent_id !== undefined ? (execution_agent_id ? parseInt(execution_agent_id) : null) : currentWO.execution_agent_id,
          delivery_agent_id !== undefined ? (delivery_agent_id ? parseInt(delivery_agent_id) : null) : currentWO.delivery_agent_id,
          items ? JSON.stringify(items) : JSON.stringify(currentWO.items),
          actual_cost_total !== undefined ? actual_cost_total : currentWO.actual_cost_total,
          title !== undefined ? title : currentWO.title,
          customer_name !== undefined ? customer_name : currentWO.customer_name,
          sale_value !== undefined ? sale_value : currentWO.sale_value,
          finalQaStatus,
          finalQaFeedback,
          expected_start_date !== undefined ? expected_start_date : currentWO.expected_start_date,
          due_date !== undefined ? due_date : currentWO.due_date,
          supervisor_id !== undefined ? (supervisor_id ? parseInt(supervisor_id) : null) : currentWO.supervisor_id,
          finalAssignmentDate,
          finalCompletionDate,
          id
        ]
      );

      const updatedWO = updateRes.rows[0];

      // 3. Log audit action
      await logAction(authUserId, 'UPDATE', 'WorkOrder', updatedWO.id, {
        title: updatedWO.title,
        status: updatedWO.status,
        actual_cost_total: updatedWO.actual_cost_total
      });

      // 4. Tasks module real-time network integration:
      // - Task for execution agent when status is "Executing" or custom stage mapped to it
      if ((updatedWO.status === 'Executing' || updatedWO.status.toLowerCase().includes('execut')) && updatedWO.execution_agent_id) {
        // Check if task already exists
        const taskCheck = await pool.query(
          "SELECT id FROM tasks WHERE module_id = 'operations-hub' AND related_id = $1 AND assigned_to = $2",
          [updatedWO.id, updatedWO.execution_agent_id]
        );
        if (taskCheck.rows.length === 0) {
          await pool.query(
            `INSERT INTO tasks (title, description, status, priority, assigned_to, deal_id, module_id, related_id)
             VALUES ($1, $2, 'pending', 'high', $3, $4, 'operations-hub', $5)`,
            [
              `Execution: ${updatedWO.title}`,
              `Kindly proceed with the execution of this work order (WO #${updatedWO.id}). Status set to ${updatedWO.status}.`,
              updatedWO.execution_agent_id,
              updatedWO.deal_id,
              updatedWO.id
            ]
          );
        }
      }

      // - Task for delivery agent when status is "Ready for Delivery" or custom stage mapped to it
      if ((updatedWO.status === 'Ready for Delivery' || updatedWO.status.toLowerCase().includes('deliver')) && updatedWO.delivery_agent_id) {
        // Check if task already exists
        const taskCheck = await pool.query(
          "SELECT id FROM tasks WHERE module_id = 'operations-hub' AND related_id = $1 AND assigned_to = $2",
          [updatedWO.id, updatedWO.delivery_agent_id]
        );
        if (taskCheck.rows.length === 0) {
          await pool.query(
            `INSERT INTO tasks (title, description, status, priority, assigned_to, deal_id, module_id, related_id)
             VALUES ($1, $2, 'pending', 'high', $3, $4, 'operations-hub', $5)`,
            [
              `Delivery: ${updatedWO.title}`,
              `Kindly handle the shipping/delivery of this work order (WO #${updatedWO.id}). Status set to ${updatedWO.status}.`,
              updatedWO.delivery_agent_id,
              updatedWO.deal_id,
              updatedWO.id
            ]
          );
        }
      }

      // 5. Instantly update Finance & Accounting journal entry
      const finalCost = actual_cost_total !== undefined ? actual_cost_total : currentWO.actual_cost_total;
      await syncJournalEntryForWorkOrder(updatedWO.id, updatedWO.title, finalCost, companyId);

      // 6. Broadcast real-time updates to connected clients
      wss.clients.forEach((client: any) => {
        client.send(JSON.stringify({ type: "MODULE_UPDATED", table: "operations" }));
        client.send(JSON.stringify({ type: "MODULE_UPDATED", table: "accounting" }));
        client.send(JSON.stringify({ type: "MODULE_UPDATED", table: "tasks" }));
      });

      res.json(updatedWO);
    } catch (err) {
      console.error("Error updating work order:", err);
      res.status(500).json({ error: "Failed to update work order" });
    }
  });

  // DELETE a work order
  router.delete("/work-orders/:id", async (req, res) => {
    const { id } = req.params;
    const companyId = (req as any).user?.company_id || 1;

    try {
      // 1. Delete associated journal entries
      await pool.query(
        "DELETE FROM acct_journal_entries WHERE reference = $1 AND company_id = $2",
        [`WO-${id}`, companyId]
      );

      // 2. Delete tasks associated
      await pool.query(
        "DELETE FROM tasks WHERE module_id = 'operations-hub' AND related_id = $1",
        [id]
      );

      // 3. Delete work order
      const result = await pool.query("DELETE FROM work_orders WHERE id = $1 RETURNING *", [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Work order not found" });
      }

      // 4. Broadcast real-time updates
      wss.clients.forEach((client: any) => {
        client.send(JSON.stringify({ type: "MODULE_UPDATED", table: "operations" }));
        client.send(JSON.stringify({ type: "MODULE_UPDATED", table: "accounting" }));
        client.send(JSON.stringify({ type: "MODULE_UPDATED", table: "tasks" }));
      });

      res.json({ success: true, message: "Work order deleted successfully" });
    } catch (err) {
      console.error("Error deleting work order:", err);
      res.status(500).json({ error: "Failed to delete work order" });
    }
  });

  // GET all QA tickets
  router.get("/qa-tickets", async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT t.*, w.title as work_order_title, w.customer_name as work_order_customer_name, 
                u.name as assigned_to_name, r.name as reported_by_name
         FROM work_order_qa_tickets t
         LEFT JOIN work_orders w ON t.work_order_id = w.id
         LEFT JOIN users u ON t.assigned_to = u.id
         LEFT JOIN users r ON t.reported_by = r.id
         ORDER BY t.id DESC`
      );
      res.json(result.rows);
    } catch (err) {
      console.error("Error fetching QA tickets:", err);
      res.status(500).json({ error: "Failed to fetch QA tickets" });
    }
  });

  // POST create a QA ticket
  router.post("/qa-tickets", async (req, res) => {
    const { work_order_id, title, description, severity, assigned_to, reported_by } = req.body;
    if (!work_order_id || !title) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    try {
      const result = await pool.query(
        `INSERT INTO work_order_qa_tickets (work_order_id, title, description, severity, assigned_to, reported_by)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [work_order_id, title, description, severity || 'medium', assigned_to, reported_by || 1]
      );
      const ticket = result.rows[0];

      // Create a related task in tasks module so it is visible to employees
      await pool.query(
        `INSERT INTO tasks (title, description, status, priority, assigned_to, module_id, related_id)
         VALUES ($1, $2, 'pending', $3, $4, 'qa-ticket', $5)`,
        [
          `QA Issue: ${title}`,
          description || 'No additional details.',
          severity === 'critical' || severity === 'high' ? 'high' : 'medium',
          assigned_to,
          ticket.id
        ]
      );

      // Broadcast update
      wss.clients.forEach((client: any) => {
        client.send(JSON.stringify({ type: "MODULE_UPDATED", table: "operations" }));
        client.send(JSON.stringify({ type: "MODULE_UPDATED", table: "tasks" }));
      });

      res.status(201).json(ticket);
    } catch (err) {
      console.error("Error creating QA ticket:", err);
      res.status(500).json({ error: "Failed to create QA ticket" });
    }
  });

  // PUT update a QA ticket status/details
  router.put("/qa-tickets/:id", async (req, res) => {
    const { id } = req.params;
    const { status, description, severity, assigned_to } = req.body;
    try {
      const result = await pool.query(
        `UPDATE work_order_qa_tickets
         SET status = $1,
             description = COALESCE($2, description),
             severity = COALESCE($3, severity),
             assigned_to = COALESCE($4, assigned_to),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $5 RETURNING *`,
        [status, description, severity, assigned_to, id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "QA Ticket not found" });
      }

      const ticket = result.rows[0];

      // If the ticket is resolved, we can update the corresponding task in tasks module as completed
      if (status.toLowerCase() === 'resolved' || status.toLowerCase() === 'closed') {
        await pool.query(
          "UPDATE tasks SET status = 'completed' WHERE module_id = 'qa-ticket' AND related_id = $1",
          [id]
        );
      }

      // Broadcast update
      wss.clients.forEach((client: any) => {
        client.send(JSON.stringify({ type: "MODULE_UPDATED", table: "operations" }));
        client.send(JSON.stringify({ type: "MODULE_UPDATED", table: "tasks" }));
      });

      res.json(ticket);
    } catch (err) {
      console.error("Error updating QA ticket:", err);
      res.status(500).json({ error: "Failed to update QA ticket" });
    }
  });

  // POST post a QA review (approve/reject) for a work order
  router.post("/work-orders/:id/qa-review", async (req, res) => {
    const { id } = req.params;
    const { action, feedback, ticket_title, ticket_description, severity, assigned_to, reported_by } = req.body;
    if (!action) {
      return res.status(400).json({ error: "Missing action parameter" });
    }

    try {
      let qaStatus = 'Pending Review';
      if (action === 'approve') {
        qaStatus = 'Approved';
      } else if (action === 'reject') {
        qaStatus = 'Rejected';
      }

      // Update work order QA state
      const updateWORes = await pool.query(
        `UPDATE work_orders
         SET qa_status = $1,
             qa_feedback = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3 RETURNING *`,
        [qaStatus, feedback || null, id]
      );

      if (updateWORes.rows.length === 0) {
        return res.status(404).json({ error: "Work order not found" });
      }

      const updatedWO = updateWORes.rows[0];

      // If rejected, create QA Ticket
      let createdTicket = null;
      if (action === 'reject') {
        const ticketTitle = ticket_title || `خلل في جودة: ${updatedWO.title}`;
        const ticketDesc = ticket_description || feedback || 'لم يتم تحديد تفاصيل إضافية للخلل.';
        const targetAssignee = assigned_to || updatedWO.execution_agent_id || updatedWO.delivery_agent_id;

        const ticketRes = await pool.query(
          `INSERT INTO work_order_qa_tickets (work_order_id, title, description, severity, assigned_to, reported_by)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [id, ticketTitle, ticketDesc, severity || 'high', targetAssignee, reported_by || 1]
        );
        createdTicket = ticketRes.rows[0];

        // Create related Task so it appears in the task list
        await pool.query(
          `INSERT INTO tasks (title, description, status, priority, assigned_to, deal_id, module_id, related_id)
           VALUES ($1, $2, 'pending', $3, $4, $5, 'qa-ticket', $6)`,
          [
            `QA Ticket: ${ticketTitle}`,
            `تم رفض العمل في أمر التشغيل #${id} بسبب: ${ticketDesc}`,
            severity === 'critical' || severity === 'high' ? 'high' : 'medium',
            targetAssignee,
            updatedWO.deal_id,
            createdTicket.id
          ]
        );

        // Optional: set work order status back to 'Executing' or previous stage so they can fix it
        // We look for a stage like 'Executing' or 'Pending'
        const executingStageRes = await pool.query(
          "SELECT name FROM operation_stages WHERE name ILIKE '%execut%' OR name ILIKE '%نفذ%' OR name ILIKE '%قيد%' ORDER BY order_index ASC LIMIT 1"
        );
        if (executingStageRes.rows.length > 0) {
          const revertStatus = executingStageRes.rows[0].name;
          await pool.query(
            "UPDATE work_orders SET status = $1 WHERE id = $2",
            [revertStatus, id]
          );
        }
      }

      // Log action in Audit Logs
      await logAction(reported_by || 1, 'UPDATE', 'WorkOrderQA', updatedWO.id, {
        qa_status: qaStatus,
        feedback,
        ticket_id: createdTicket?.id || null
      });

      // Broadcast update
      wss.clients.forEach((client: any) => {
        client.send(JSON.stringify({ type: "MODULE_UPDATED", table: "operations" }));
        client.send(JSON.stringify({ type: "MODULE_UPDATED", table: "tasks" }));
      });

      res.json({
        success: true,
        workOrder: updatedWO,
        ticket: createdTicket
      });
    } catch (err) {
      console.error("Error posting QA review:", err);
      res.status(500).json({ error: "Failed to submit QA review" });
    }
  });

  return router;
}
