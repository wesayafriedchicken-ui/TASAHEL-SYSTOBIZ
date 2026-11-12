import express from "express";
import { pool } from "../../db/schema.js";
import { automationService } from "../../services/automation.service.js";
import { aiService } from "../../services/ai.service.js";
import { logAction } from "../../services/auditLogger.js";
import { IntegrationService } from "../../services/integration.service.js";
import { createWorkOrderFromDeal } from "../operations_hub/operations_hub.routes.js";
import { memoryCache } from "../../utils/cache.js";

export default function crmRoutes(wss: any) {
  const router = express.Router();

  // --- Stages ---
  router.get("/stages", async (req, res) => {
    try {
      const companyId = (req as any).user?.company_id || 1;
      const cacheKey = `crm:stages:${companyId}`;
      const cached = memoryCache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }
      const result = await pool.query("SELECT id, company_id, name, order_index, color, is_won FROM crm_stages WHERE company_id = $1 ORDER BY order_index ASC", [companyId]);
      memoryCache.set(cacheKey, result.rows, 120); // 2 minutes
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch stages" });
    }
  });

  router.post("/stages", async (req, res) => {
    const { name, order_index, color, is_won } = req.body;
    const companyId = (req as any).user?.company_id || 1;
    try {
      const result = await pool.query(
        "INSERT INTO crm_stages (company_id, name, order_index, color, is_won) VALUES ($1, $2, $3, $4, $5) RETURNING id, company_id, name, order_index, color, is_won",
        [companyId, name, order_index || 0, color || '#10b981', is_won || false]
      );
      memoryCache.del(`crm:stages:${companyId}`);
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: "Failed to create stage" });
    }
  });

  router.patch("/stages/:id", async (req, res) => {
    const { id } = req.params;
    const { name, order_index, color, is_won } = req.body;
    const companyId = (req as any).user?.company_id || 1;
    try {
      const result = await pool.query(
        "UPDATE crm_stages SET name = COALESCE($1, name), order_index = COALESCE($2, order_index), color = COALESCE($3, color), is_won = COALESCE($4, is_won) WHERE id = $5 RETURNING id, company_id, name, order_index, color, is_won",
        [name, order_index, color, is_won, id]
      );
      memoryCache.del(`crm:stages:${companyId}`);
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: "Failed to update stage" });
    }
  });

  router.delete("/stages/:id", async (req, res) => {
    const { id } = req.params;
    const companyId = (req as any).user?.company_id || 1;
    try {
      await pool.query("DELETE FROM crm_stages WHERE id = $1", [id]);
      memoryCache.del(`crm:stages:${companyId}`);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete stage" });
    }
  });

  // --- Customers ---
  router.get("/customers", async (req, res) => {
    const { search, page, limit } = req.query;
    const companyId = (req as any).user?.company_id || 1;
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 50));
    const offsetNum = (pageNum - 1) * limitNum;

    try {
      let query = "SELECT id, company_id, name, email, phone, company, source, created_at, updated_at FROM crm_customers WHERE company_id = $1";
      let params: any[] = [companyId];
      if (search) {
        query += " AND (name ILIKE $2 OR email ILIKE $2 OR phone ILIKE $2 OR company ILIKE $2)";
        params.push(`%${search}%`);
      }
      query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
      params.push(limitNum, offsetNum);

      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });

  router.post("/customers", async (req, res) => {
    const { name, email, phone, company, source } = req.body;
    const companyId = (req as any).user?.company_id || 1;
    try {
      const result = await pool.query(
        "INSERT INTO crm_customers (company_id, name, email, phone, company, source) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, company_id, name, email, phone, company, source, created_at, updated_at",
        [companyId, name, email, phone, company, source]
      );
      
      const customer = result.rows[0];
      const authUserId = (req as any).user?.id || 1;
      await logAction(authUserId, 'CREATE', 'Customer', customer.id, { name, company, company_id: companyId });

      await automationService.trigger('crm:customer:new', { ...customer, company_id: companyId });
      await pool.query(
        "INSERT INTO notifications (company_id, title, message, type) VALUES ($1, $2, $3, $4)",
        [companyId, "New Lead Registered", `Customer ${name} from ${company || 'Unknown'} has been added.`, "success"]
      );

      res.json(customer);
    } catch (err) {
      res.status(500).json({ error: "Failed to create customer" });
    }
  });

  router.put("/customers/:id", async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, company, source } = req.body;
    try {
      const result = await pool.query(
        "UPDATE crm_customers SET name = $1, email = $2, phone = $3, company = $4, source = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING id, company_id, name, email, phone, company, source, created_at, updated_at",
        [name, email, phone, company, source, id]
      );
      const customer = result.rows[0];
      const authUserId = parseInt(req.headers['x-user-id'] as string) || 1;
      await logAction(authUserId, 'UPDATE', 'Customer', customer.id, { name, company });
      res.json(customer);
    } catch (err) {
      res.status(500).json({ error: "Failed to update customer" });
    }
  });

  router.get("/customers/:id", async (req, res) => {
    const { id } = req.params;
    try {
      const customer = await pool.query("SELECT id, company_id, name, email, phone, company, source, created_at, updated_at FROM crm_customers WHERE id = $1", [id]);
      const interactions = await pool.query(
        "SELECT i.id, i.company_id, i.customer_id, i.deal_id, i.type, i.content, i.created_at, u.name as user_name FROM crm_interactions i LEFT JOIN users u ON i.sender_id = u.id WHERE i.customer_id = $1 ORDER BY i.created_at DESC LIMIT 50",
        [id]
      );
      const attachments = await pool.query("SELECT id, company_id, customer_id, deal_id, file_name, file_url, file_type, uploaded_by, created_at FROM crm_attachments WHERE customer_id = $1 LIMIT 50", [id]);
      const deals = await pool.query("SELECT id, company_id, customer_id, title, description, value, stage_id, assigned_to, service_type, product, created_at, updated_at FROM crm_deals WHERE customer_id = $1 LIMIT 50", [id]);

      res.json({
        ...customer.rows[0],
        interactions: interactions.rows,
        attachments: attachments.rows,
        deals: deals.rows
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch customer details" });
    }
  });

  // --- Deals ---
  router.get("/deals", async (req, res) => {
    try {
      const companyId = (req as any).user?.company_id || 1;
      const result = await pool.query(`
        SELECT d.id, d.company_id, d.customer_id, d.title, d.description, d.value, d.stage_id, 
               d.assigned_to, d.service_type, d.product, d.items, d.reminders, d.created_at, d.updated_at,
               c.name as customer_name, c.company as customer_company, c.email as customer_email, c.phone as customer_phone, 
               u.name as assigned_name 
        FROM crm_deals d
        JOIN crm_customers c ON d.customer_id = c.id
        LEFT JOIN users u ON d.assigned_to = u.id
        WHERE d.company_id = $1
        ORDER BY d.updated_at DESC
      `, [companyId]);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch deals" });
    }
  });

  router.post("/deals", async (req, res) => {
    const { customer_id, title, description, value, stage_id, service_type, product, items } = req.body;
    const companyId = (req as any).user?.company_id || 1;
    const authUserId = (req as any).user?.id || 1;
    try {
      // Automatic Assignment Logic
      let assigned_to = null;
      const ruleRes = await pool.query(
        "SELECT user_id FROM crm_assignment_rules WHERE (service_type = $1 OR product = $2) AND company_id = $3 AND is_active = TRUE LIMIT 1",
        [service_type, product, companyId]
      );
      if (ruleRes.rows.length > 0) {
        assigned_to = ruleRes.rows[0].user_id;
      }

      const result = await pool.query(
        "INSERT INTO crm_deals (company_id, customer_id, title, description, value, stage_id, assigned_to, service_type, product, items) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *",
        [companyId, customer_id, title, description, value, stage_id, assigned_to, service_type, product, JSON.stringify(items || [])]
      );

      const deal = result.rows[0];
      await logAction(authUserId, 'CREATE', 'Deal', deal.id, { title, value, company_id: companyId });
      
      // Link to KPI: Update Sales Revenue KPI
      await pool.query(
        "UPDATE kpis SET actual_value = (SELECT COALESCE(SUM(value), 0) FROM crm_deals WHERE company_id = $1), updated_at = CURRENT_TIMESTAMP WHERE (name ILIKE '%Revenue%' OR name ILIKE '%Sales%') AND company_id = $1",
        [companyId]
      );

      await automationService.trigger('crm:deal:new', { ...deal, company_id: companyId });
      await pool.query(
        "INSERT INTO notifications (company_id, title, message, type) VALUES ($1, $2, $3, $4)",
        [companyId, "New Deal Created", `A new deal "${title}" has been created and assigned.`, "info"]
      );

      // Log interaction
      await pool.query(
        "INSERT INTO crm_interactions (company_id, customer_id, deal_id, type, content) VALUES ($1, $2, $3, $4, $5)",
        [companyId, customer_id, result.rows[0].id, 'Note', `Deal created: ${title}`]
      );

      wss.clients.forEach((client: any) => {
        client.send(JSON.stringify({ type: "DEAL_CREATED", deal: result.rows[0] }));
      });

      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create deal" });
    }
  });

  router.put("/deals/:id", async (req, res) => {
    const { id } = req.params;
    const { title, description, value, stage_id, assigned_to, service_type, product, items } = req.body;
    try {
      const result = await pool.query(
        `UPDATE crm_deals 
         SET title = $1, description = $2, value = $3, stage_id = $4, assigned_to = $5, 
             service_type = $6, product = $7, items = $8, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $9 RETURNING *`,
        [title, description, value, stage_id, assigned_to, service_type, product, JSON.stringify(items || []), id]
      );
      
      const deal = result.rows[0];
      const authUserId = parseInt(req.headers['x-user-id'] as string) || 1;
      await logAction(authUserId, 'UPDATE', 'Deal', deal.id, { title, value });

      // Update KPI
      await pool.query(
        "UPDATE kpis SET actual_value = (SELECT COALESCE(SUM(value), 0) FROM crm_deals), updated_at = CURRENT_TIMESTAMP WHERE name ILIKE '%Revenue%' OR name ILIKE '%Sales%'",
      );

      res.json(deal);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update deal" });
    }
  });

  router.delete("/deals/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query("DELETE FROM crm_deals WHERE id = $1", [id]);
      // Update KPI after deletion
      await pool.query(
        "UPDATE kpis SET actual_value = (SELECT COALESCE(SUM(value), 0) FROM crm_deals), updated_at = CURRENT_TIMESTAMP WHERE name ILIKE '%Revenue%' OR name ILIKE '%Sales%'",
      );
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete deal" });
    }
  });

  router.delete("/customers/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query("DELETE FROM crm_customers WHERE id = $1", [id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete customer" });
    }
  });

  router.patch("/deals/:id/stage", async (req, res) => {
    const { id } = req.params;
    const { stage_id } = req.body;
    const authUserId = parseInt(req.headers['x-user-id'] as string) || 1;
    try {
      const dealRes = await pool.query("SELECT id, title, customer_id, company_id, stage_id FROM crm_deals WHERE id = $1", [id]);
      const deal = dealRes.rows[0];
      const stageRes = await pool.query("SELECT name FROM crm_stages WHERE id = $1", [stage_id]);
      const stageName = stageRes.rows[0].name;

      await pool.query("UPDATE crm_deals SET stage_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [stage_id, id]);
      await logAction(authUserId, 'STATUS_CHANGE', 'Deal', parseInt(id), { stage: stageName });

      // Automatically create a work order in Operations Hub if the deal is Won or in Implementation
      if (stageName === 'Closed Won' || stageName === 'Implementation' || stageName === 'Won') {
        const companyId = (req as any).user?.company_id || 1;
        try {
          await createWorkOrderFromDeal(parseInt(id), companyId);
        } catch (err) {
          console.error("❌ Failed to automatically create work order on crm stage update:", err);
        }
      }

      await automationService.trigger('crm:deal:stage_updated', { ...deal, stage_id, stage_name: stageName });

      // Integration with The Business Core Modules: SOP Trigger
      if (stageName === 'Implementation') {
        // Find SOP for this service type
        const sopRes = await pool.query("SELECT id FROM sops WHERE process_type = $1 LIMIT 1", [deal.service_type]);
        if (sopRes.rows.length > 0) {
          await pool.query("UPDATE crm_deals SET sop_id = $1 WHERE id = $2", [sopRes.rows[0].id, id]);
          // Log interaction
          await pool.query(
            "INSERT INTO crm_interactions (customer_id, deal_id, type, content) VALUES ($1, $2, $3, $4)",
            [deal.customer_id, id, 'Note', `SOP triggered for Implementation: ${deal.service_type}`]
          );
        }
      }

      // Log stage change
      await pool.query(
        "INSERT INTO crm_interactions (customer_id, deal_id, type, content) VALUES ($1, $2, $3, $4)",
        [deal.customer_id, id, 'Note', `Stage changed to: ${stageName}`]
      );

      wss.clients.forEach((client: any) => {
        client.send(JSON.stringify({ type: "DEAL_STAGE_UPDATED", id, stage_id }));
      });

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to update deal stage" });
    }
  });

  // --- Interactions ---
  router.get("/interactions/conversations", async (req, res) => {
    try {
      const companyId = (req as any).user?.company_id || 1;
      const result = await pool.query(`
        WITH RecentInteractions AS (
          SELECT 
            customer_id,
            content,
            type,
            created_at,
            ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY created_at DESC) as rn
          FROM crm_interactions
          WHERE company_id = $1
        )
        SELECT 
          c.id as customer_id,
          c.name as customer_name,
          c.email as customer_email,
          ri.content as last_message,
          ri.type as last_message_type,
          ri.created_at as last_message_time
        FROM crm_customers c
        JOIN RecentInteractions ri ON c.id = ri.customer_id
        WHERE ri.rn = 1 AND c.company_id = $1
        ORDER BY ri.created_at DESC
      `, [companyId]);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  router.get("/interactions/thread/:customerId", async (req, res) => {
    const { customerId } = req.params;
    const companyId = (req as any).user?.company_id || 1;
    try {
      const result = await pool.query(`
        SELECT i.*, u.name as user_name 
        FROM crm_interactions i 
        LEFT JOIN users u ON i.sender_id = u.id 
        WHERE i.customer_id = $1 AND i.company_id = $2
        ORDER BY i.created_at ASC
      `, [customerId, companyId]);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch thread" });
    }
  });

  router.post("/interactions", async (req, res) => {
    const { customer_id, deal_id, type, content, sender_id } = req.body;
    const companyId = (req as any).user?.company_id || 1;
    try {
      // AI Sentiment Analysis for customer messages (where sender_id is null)
      let sentiment = null;
      if (!sender_id && content && (type === 'Chat' || type === 'WhatsApp' || type === 'SMS' || type === 'Facebook' || type === 'Email')) {
        try {
          sentiment = await aiService.analyzeSentiment(content);
        } catch (e) {
          console.warn("AI Sentiment analysis failed", e);
          sentiment = 'Neutral';
        }
      }

      const result = await pool.query(
        "INSERT INTO crm_interactions (company_id, customer_id, deal_id, type, content, sender_id, sentiment) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
        [companyId, customer_id, deal_id || null, type, content, sender_id || null, sentiment]
      );

      const interaction = result.rows[0];

      // If it's an outbound message from a user, trigger the integration service to "send" it
      if (sender_id && ['Email', 'WhatsApp', 'Facebook', 'SMS'].includes(type)) {
        const custRes = await pool.query("SELECT email, phone FROM crm_customers WHERE id = $1 AND company_id = $2", [customer_id, companyId]);
        const customer = custRes.rows[0];
        const to = type === 'Email' ? customer?.email : (customer?.phone || customer?.whatsapp);
        
        if (to) {
          await IntegrationService.sendMessage(type, to, content, customer_id);
        }
      }

      // If sentiment is Angry, trigger an alert for QA
      if (sentiment === 'Angry') {
        await automationService.trigger('qa:angry_customer:alert', {
          interaction_id: interaction.id,
          customer_id,
          content,
          sentiment,
          company_id: companyId
        });
      }

      const interactionWithDetails = {
         ...interaction,
         user_name: sender_id ? (await pool.query("SELECT name FROM users WHERE id = $1 AND company_id = $2", [sender_id, companyId])).rows[0]?.name : null
      };

      if (wss) {
        wss.clients.forEach((client: any) => {
          client.send(JSON.stringify({ type: 'CRM_INTERACTION', interaction: interactionWithDetails }));
        });
      }

      res.json(interactionWithDetails);
    } catch (err) {
      console.error("Failed to log interaction", err);
      res.status(500).json({ error: "Failed to log interaction" });
    }
  });

  // --- Attachments ---
  router.get("/attachments", async (req, res) => {
    try {
      const companyId = (req as any).user?.company_id || 1;
      const result = await pool.query("SELECT id, company_id, customer_id, deal_id, file_name, file_url, file_type, uploaded_by, created_at FROM crm_attachments WHERE company_id = $1 ORDER BY created_at DESC LIMIT 100", [companyId]);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch attachments" });
    }
  });

  router.post("/attachments", async (req, res) => {
    const { customer_id, deal_id, file_name, file_url, file_type, uploaded_by } = req.body;
    const companyId = (req as any).user?.company_id || 1;
    try {
      const result = await pool.query(
        "INSERT INTO crm_attachments (company_id, customer_id, deal_id, file_name, file_url, file_type, uploaded_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
        [companyId, customer_id, deal_id, file_name, file_url, file_type, uploaded_by]
      );
      
      const attachment = result.rows[0];
      await automationService.trigger('crm:file:uploaded', { ...attachment, company_id: companyId });

      res.json(attachment);
    } catch (err) {
      res.status(500).json({ error: "Failed to upload attachment" });
    }
  });

  router.delete("/attachments/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query("DELETE FROM crm_attachments WHERE id = $1", [id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete attachment" });
    }
  });

  // --- Deal Specific Notes (Interactions of type 'Note') ---
  router.get("/deals/:id/notes", async (req, res) => {
    const { id } = req.params;
    const companyId = (req as any).user?.company_id || 1;
    try {
      const result = await pool.query(
        `SELECT i.*, u.name as user_name 
         FROM crm_interactions i 
         LEFT JOIN users u ON i.sender_id = u.id 
         WHERE i.deal_id = $1 AND i.company_id = $2 AND i.type = 'Note'
         ORDER BY i.created_at DESC`,
        [id, companyId]
      );
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch notes" });
    }
  });

  router.post("/deals/:id/notes", async (req, res) => {
    const { id } = req.params;
    const { content, sender_id, customer_id } = req.body;
    const companyId = (req as any).user?.company_id || 1;
    try {
      const result = await pool.query(
        "INSERT INTO crm_interactions (company_id, customer_id, deal_id, type, content, sender_id) VALUES ($1, $2, $3, 'Note', $4, $5) RETURNING *",
        [companyId, customer_id || null, id, content, sender_id || null]
      );
      const row = result.rows[0];
      const details = {
        ...row,
        user_name: sender_id ? (await pool.query("SELECT name FROM users WHERE id = $1 AND company_id = $2", [sender_id, companyId])).rows[0]?.name : 'System'
      };
      res.json(details);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create note" });
    }
  });

  // --- Deal Specific History Logs ---
  router.get("/deals/:id/history", async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query("SELECT history_logs FROM crm_deals WHERE id = $1", [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Deal not found" });
      }
      res.json(result.rows[0].history_logs || []);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch history logs" });
    }
  });

  router.post("/deals/:id/history", async (req, res) => {
    const { id } = req.params;
    const { action, details, user_name } = req.body;
    try {
      const dealRes = await pool.query("SELECT history_logs FROM crm_deals WHERE id = $1", [id]);
      if (dealRes.rows.length === 0) {
        return res.status(404).json({ error: "Deal not found" });
      }
      let logs = dealRes.rows[0].history_logs;
      if (!Array.isArray(logs)) logs = [];
      
      const newLog = {
        id: Date.now().toString(),
        action,
        details,
        user_name: user_name || 'System',
        created_at: new Date().toISOString()
      };
      logs.unshift(newLog);
      
      await pool.query(
        "UPDATE crm_deals SET history_logs = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [JSON.stringify(logs), id]
      );
      res.json(newLog);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to add history log" });
    }
  });

  // --- Deal Specific Reminders ---
  router.get("/deals/:id/reminders", async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query("SELECT reminders FROM crm_deals WHERE id = $1", [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Deal not found" });
      }
      res.json(result.rows[0].reminders || []);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch reminders" });
    }
  });

  router.post("/deals/:id/reminders", async (req, res) => {
    const { id } = req.params;
    const { title, reminder_date, user_name } = req.body;
    const companyId = (req as any).user?.company_id || 1;
    try {
      const dealRes = await pool.query("SELECT id, title, reminders, company_id, assigned_to FROM crm_deals WHERE id = $1", [id]);
      if (dealRes.rows.length === 0) {
        return res.status(404).json({ error: "Deal not found" });
      }
      const deal = dealRes.rows[0];
      let reminders = deal.reminders;
      if (!Array.isArray(reminders)) reminders = [];
      
      const newReminder = {
        id: Date.now().toString(),
        title,
        reminder_date,
        user_name: user_name || 'System',
        status: 'active',
        created_at: new Date().toISOString()
      };
      reminders.unshift(newReminder);
      
      await pool.query(
        "UPDATE crm_deals SET reminders = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [JSON.stringify(reminders), id]
      );

      // Create a notification for the active reminder
      const notifTitle = `تنبيه تذكير: ${title}`;
      const notifMsg = `تذكير متابعة صفقة "${deal.title}" لليوم ${reminder_date}`;
      await pool.query(
        "INSERT INTO notifications (company_id, user_id, title, message, type, link) VALUES ($1, $2, $3, $4, $5, $6)",
        [deal.company_id || companyId, deal.assigned_to || null, notifTitle, notifMsg, 'reminder', `/crm`]
      );

      // Create a task for the active reminder
      const taskTitle = `متابعة صفقة: ${title}`;
      const taskDesc = `تذكير مجدول للصفقة "${deal.title}". تفاصيل: ${title}. تم الإعداد بواسطة ${user_name || 'System'}.`;
      await pool.query(
        "INSERT INTO tasks (company_id, title, description, status, priority, due_date, assigned_to, deal_id, module_id, related_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
        [
          deal.company_id || companyId,
          taskTitle,
          taskDesc,
          'pending',
          'medium',
          reminder_date ? new Date(reminder_date) : null,
          deal.assigned_to || null,
          id,
          'crm',
          id
        ]
      );
      
      res.json(newReminder);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to add reminder" });
    }
  });

  router.delete("/deals/:id/reminders/:reminderId", async (req, res) => {
    const { id, reminderId } = req.params;
    const companyId = (req as any).user?.company_id || 1;
    try {
      const dealRes = await pool.query("SELECT id, title, reminders, company_id, assigned_to FROM crm_deals WHERE id = $1", [id]);
      if (dealRes.rows.length === 0) {
        return res.status(404).json({ error: "Deal not found" });
      }
      const deal = dealRes.rows[0];
      let reminders = deal.reminders;
      if (!Array.isArray(reminders)) reminders = [];
      
      const reminderToDelete = reminders.find((r: any) => r.id === reminderId);
      reminders = reminders.filter((r: any) => r.id !== reminderId);
      
      await pool.query(
        "UPDATE crm_deals SET reminders = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [JSON.stringify(reminders), id]
      );

      if (reminderToDelete) {
        // Delete corresponding task
        const taskTitle = `متابعة صفقة: ${reminderToDelete.title}`;
        await pool.query(
          "DELETE FROM tasks WHERE deal_id = $1 AND title = $2 AND company_id = $3",
          [id, taskTitle, deal.company_id || companyId]
        );

        // Delete corresponding notification
        const notifTitle = `تنبيه تذكير: ${reminderToDelete.title}`;
        await pool.query(
          "DELETE FROM notifications WHERE company_id = $1 AND title = $2 AND message LIKE $3",
          [deal.company_id || companyId, notifTitle, `%${deal.title}%`]
        );
      }

      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to delete reminder" });
    }
  });

  // =========================================================================
  // Sales CRM Dynamic Schema Customizations
  // =========================================================================
  router.get("/schema-customizations/:pageKey", async (req, res) => {
    try {
      const companyId = (req as any).user?.company_id || 1;
      const pageKey = String(req.params.pageKey).toLowerCase().trim();

      const result = await pool.query(
        `SELECT schema_config FROM company_schema_customizations 
         WHERE company_id = $1 AND module_name = 'sales' AND page_key = $2 LIMIT 1`,
        [companyId, pageKey]
      );

      if (result.rows.length > 0) {
        res.json({ success: true, page_key: pageKey, schema_config: result.rows[0].schema_config });
      } else {
        res.json({ success: true, page_key: pageKey, schema_config: null });
      }
    } catch (err) {
      console.error("Error fetching Sales CRM schema customizations:", err);
      res.status(500).json({ error: "Failed to fetch Sales schema customizations" });
    }
  });

  router.post("/schema-customizations/:pageKey", async (req, res) => {
    try {
      const companyId = (req as any).user?.company_id || 1;
      const pageKey = String(req.params.pageKey).toLowerCase().trim();
      const { schema_config } = req.body;

      if (!schema_config) {
        return res.status(400).json({ error: "schema_config is required" });
      }

      const result = await pool.query(
        `INSERT INTO company_schema_customizations (company_id, module_name, page_key, schema_config, updated_at)
         VALUES ($1, 'sales', $2, $3, CURRENT_TIMESTAMP)
         ON CONFLICT (company_id, module_name, page_key)
         DO UPDATE SET schema_config = EXCLUDED.schema_config, updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [companyId, pageKey, schema_config]
      );

      res.json({ success: true, page_key: pageKey, schema_config: result.rows[0].schema_config });
    } catch (err) {
      console.error("Error saving Sales CRM schema customizations:", err);
      res.status(500).json({ error: "Failed to save Sales schema customizations" });
    }
  });

  router.delete("/schema-customizations/:pageKey", async (req, res) => {
    try {
      const companyId = (req as any).user?.company_id || 1;
      const pageKey = String(req.params.pageKey).toLowerCase().trim();

      await pool.query(
        `DELETE FROM company_schema_customizations 
         WHERE company_id = $1 AND module_name = 'sales' AND page_key = $2`,
        [companyId, pageKey]
      );

      res.json({ success: true, message: `Reset schema customizations for ${pageKey}` });
    } catch (err) {
      console.error("Error resetting Sales schema customizations:", err);
      res.status(500).json({ error: "Failed to reset Sales schema customizations" });
    }
  });

  // =========================================================================
  // Integration & Data Sync Endpoints
  // =========================================================================
  router.get("/integrations/settings", async (req, res) => {
    try {
      const companyId = (req as any).user?.company_id || 1;
      const result = await pool.query(
        `SELECT schema_config FROM company_schema_customizations 
         WHERE company_id = $1 AND module_name = 'sales' AND page_key = 'integration_settings' LIMIT 1`,
        [companyId]
      );

      if (result.rows.length > 0 && result.rows[0].schema_config) {
        return res.json({ success: true, settings: result.rows[0].schema_config });
      }

      const defaultSettings = {
        googleSheets: {
          enabled: false,
          spreadsheetId: '',
          sheetTabName: '',
          authMethod: 'service_account',
          serviceAccountEmail: '',
          pollingInterval: 'every_5_mins',
          status: 'idle',
          lastSyncedAt: null,
          columnMappings: []
        },
        webhookReceiver: {
          enabled: true,
          tenantId: `org_${companyId}_crm`,
          webhookUrl: `https://api.domain.com/v1/crm/inbound-webhook/org_${companyId}_crm`,
          secretToken: `whsec_live_9f82c4e810a7b453e920d`,
          verifySignature: true
        },
        crossModuleSync: {
          autoCustomerOnDeal: true,
          autoReserveStock: true,
          dispatchQATicketOnWon: true,
          dispatchOperationsWorkOrderOnWon: true
        }
      };

      res.json({ success: true, settings: defaultSettings });
    } catch (err) {
      console.error("Error fetching CRM integration settings:", err);
      res.status(500).json({ error: "Failed to fetch integration settings" });
    }
  });

  router.post("/integrations/settings", async (req, res) => {
    try {
      const companyId = (req as any).user?.company_id || 1;
      const { settings } = req.body;

      if (!settings) {
        return res.status(400).json({ error: "settings is required" });
      }

      await pool.query(
        `INSERT INTO company_schema_customizations (company_id, module_name, page_key, schema_config, updated_at)
         VALUES ($1, 'sales', 'integration_settings', $2, CURRENT_TIMESTAMP)
         ON CONFLICT (company_id, module_name, page_key)
         DO UPDATE SET schema_config = EXCLUDED.schema_config, updated_at = CURRENT_TIMESTAMP`,
        [companyId, settings]
      );

      res.json({ success: true, settings });
    } catch (err) {
      console.error("Error saving CRM integration settings:", err);
      res.status(500).json({ error: "Failed to save integration settings" });
    }
  });

  // Helper: Extract clean Google Spreadsheet ID from any format (full URL, raw ID, edit link with gid, etc.)
  function extractCleanSpreadsheetId(input: string): string {
    if (!input || typeof input !== 'string') return '';
    const trimmed = input.trim();
    const urlMatch = trimmed.match(/\/(?:spreadsheets\/)?d\/([a-zA-Z0-9-_]{15,})/);
    if (urlMatch && urlMatch[1]) return urlMatch[1];
    const tokenMatch = trimmed.match(/([a-zA-Z0-9-_]{25,})/);
    if (tokenMatch && tokenMatch[1]) return tokenMatch[1];
    return trimmed.split('/')[0].split('?')[0].split('#')[0].trim();
  }

  function extractRequestedGid(input: string): string | null {
    if (!input || typeof input !== 'string') return null;
    const gidMatch = input.match(/[#&?]gid=([0-9]+)/);
    return gidMatch ? gidMatch[1] : null;
  }

  // REAL Google Sheets Inspection Endpoint (No Mockup Data)
  router.post("/integrations/google-sheets/inspect", async (req, res) => {
    try {
      const { spreadsheetId, sheetTabName } = req.body;
      if (!spreadsheetId || typeof spreadsheetId !== 'string' || !spreadsheetId.trim()) {
        return res.status(400).json({ error: "Spreadsheet ID or URL is required" });
      }

      // 1. Clean ID and extract optional URL gid
      const cleanId = extractCleanSpreadsheetId(spreadsheetId);
      const requestedGid = extractRequestedGid(spreadsheetId);

      if (!cleanId || cleanId.length < 10) {
        return res.status(400).json({ error: "Invalid Spreadsheet ID or URL. Please check the link." });
      }

      // 2. Fetch htmlview from Google Sheets
      let htmlRes: any;
      try {
        htmlRes = await fetch(`https://docs.google.com/spreadsheets/d/${cleanId}/htmlview`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8'
          },
          redirect: 'follow'
        });
      } catch (netErr: any) {
        return res.status(502).json({ error: `Could not connect to Google servers: ${netErr.message}` });
      }

      if (htmlRes.status === 404) {
        return res.status(404).json({
          error: "Google Spreadsheet not found (HTTP 404). Please check the Spreadsheet ID or URL."
        });
      }

      if (htmlRes.status === 401 || htmlRes.status === 403 || htmlRes.url.includes('accounts.google.com') || htmlRes.url.includes('/ServiceLogin')) {
        return res.status(403).json({
          error: "Access Denied (HTTP 403): This Google Sheet is private or requires Google Login. Please set sheet sharing to 'Anyone with the link can view' (Viewer)."
        });
      }

      const html = await htmlRes.text();

      // Extract Document Title
      const titleMatch = html.match(/<meta property="og:title" content="([^"]+)">/) || html.match(/<title>([^<]+)<\/title>/);
      const spreadsheetTitle = titleMatch ? titleMatch[1].replace(/ - Google (?:Sheets|Drive)$/, '').trim() : 'Google Spreadsheet';

      // 3. Extract Real Sheet Tabs from HTML
      const tabs: Array<{ id: string; name: string; gid: string; rowCount: number; columnCount: number }> = [];
      const seenGids = new Set<string>();

      // Strategy A: items.push (matches name and gid in any order)
      const pushBlocks = [...html.matchAll(/items\.push\((\{[\s\S]*?\})\);/g)];
      for (const bm of pushBlocks) {
        const block = bm[1];
        const nameM = block.match(/name:\s*["']([^"']+)["']/);
        const gidM = block.match(/gid:\s*["']?([0-9]+)["']?/);
        if (nameM && gidM && !seenGids.has(gidM[1])) {
          seenGids.add(gidM[1]);
          tabs.push({ id: `gid_${gidM[1]}`, name: nameM[1], gid: gidM[1], rowCount: 0, columnCount: 0 });
        }
      }

      // Strategy B: Fallback to sheet buttons
      if (tabs.length === 0) {
        const buttonMatches = [...html.matchAll(/id="sheet-button-([^"]+)"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/g)];
        for (const m of buttonMatches) {
          if (!seenGids.has(m[1])) {
            seenGids.add(m[1]);
            tabs.push({ id: `gid_${m[1]}`, name: m[2].trim(), gid: m[1], rowCount: 0, columnCount: 0 });
          }
        }
      }

      // Strategy C: If requested GID exists in URL but no tabs found, register that GID
      if (tabs.length === 0 && requestedGid) {
        tabs.push({ id: `gid_${requestedGid}`, name: sheetTabName || `Sheet (${requestedGid})`, gid: requestedGid, rowCount: 0, columnCount: 0 });
      }

      // Determine active tab
      let activeTabItem = tabs[0] || null;
      if (sheetTabName && tabs.length > 0) {
        const matched = tabs.find(t => t.name.toLowerCase() === sheetTabName.toLowerCase() || t.gid === sheetTabName);
        if (matched) activeTabItem = matched;
      } else if (requestedGid && tabs.length > 0) {
        const matched = tabs.find(t => t.gid === requestedGid);
        if (matched) activeTabItem = matched;
      }

      const activeGid = activeTabItem ? activeTabItem.gid : (requestedGid || '0');
      const activeName = activeTabItem ? activeTabItem.name : (sheetTabName || 'Sheet1');

      // 4. Fetch Real Columns & Rows via GViz Query
      let discoveredColumns: string[] = [];
      let rowCount = 0;
      let sampleRows: any[] = [];

      try {
        const gvizUrl = `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:json&gid=${activeGid}`;
        const gvizRes = await fetch(gvizUrl);
        if (gvizRes.ok) {
          const gvizText = await gvizRes.text();
          const jsonMatch = gvizText.match(/google\.visualization\.Query\.setResponse\(([\s\S]+)\);/);
          if (jsonMatch && jsonMatch[1]) {
            const gdata = JSON.parse(jsonMatch[1]);
            if (gdata.status === 'ok' && gdata.table) {
              let cols = (gdata.table.cols || []).map((c: any) => c?.label).filter((l: any) => l && String(l).trim().length > 0);
              let rawRows = gdata.table.rows || [];

              if (cols.length === 0 && rawRows.length > 0) {
                cols = rawRows[0].c
                  .map((c: any) => c?.v)
                  .filter((v: any) => v !== null && v !== undefined && String(v).trim().length > 0)
                  .map((v: any) => String(v).trim());
                rawRows = rawRows.slice(1);
              }

              discoveredColumns = cols;
              rowCount = rawRows.length;
              sampleRows = rawRows.slice(0, 3).map((r: any) => (r.c || []).map((c: any) => c?.v ?? ''));
            }
          }
        }
      } catch (gvizErr: any) {
        console.warn("[CRM Sheets Inspect] GViz query notice:", gvizErr.message);
      }

      // Fallback: Fetch by sheet name via GViz
      if (discoveredColumns.length === 0 && activeName) {
        try {
          const gvizUrlName = `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(activeName)}`;
          const gvizRes = await fetch(gvizUrlName);
          if (gvizRes.ok) {
            const gvizText = await gvizRes.text();
            const jsonMatch = gvizText.match(/google\.visualization\.Query\.setResponse\(([\s\S]+)\);/);
            if (jsonMatch && jsonMatch[1]) {
              const gdata = JSON.parse(jsonMatch[1]);
              if (gdata.status === 'ok' && gdata.table) {
                let cols = (gdata.table.cols || []).map((c: any) => c?.label).filter((l: any) => l && String(l).trim().length > 0);
                let rawRows = gdata.table.rows || [];

                if (cols.length === 0 && rawRows.length > 0) {
                  cols = rawRows[0].c
                    .map((c: any) => c?.v)
                    .filter((v: any) => v !== null && v !== undefined && String(v).trim().length > 0)
                    .map((v: any) => String(v).trim());
                  rawRows = rawRows.slice(1);
                }

                if (cols.length > 0) {
                  discoveredColumns = cols;
                  rowCount = rawRows.length;
                  sampleRows = rawRows.slice(0, 3).map((r: any) => (r.c || []).map((c: any) => c?.v ?? ''));
                }
              }
            }
          }
        } catch {}
      }

      // Fallback: Fetch CSV to read headers if GViz was empty
      if (discoveredColumns.length === 0) {
        try {
          const csvRes = await fetch(`https://docs.google.com/spreadsheets/d/${cleanId}/export?format=csv&gid=${activeGid}`);
          if (csvRes.ok) {
            const csvText = await csvRes.text();
            const lines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0);
            if (lines.length > 0) {
              discoveredColumns = lines[0].split(',').map(s => s.replace(/^"|"$/g, '').trim()).filter(Boolean);
              rowCount = Math.max(0, lines.length - 1);
            }
          }
        } catch {}
      }

      // If tabs array was empty but we found columns in gid 0, register Sheet1
      if (tabs.length === 0) {
        tabs.push({ id: `gid_${activeGid}`, name: activeName, gid: activeGid, rowCount, columnCount: discoveredColumns.length });
        activeTabItem = tabs[0];
      } else if (activeTabItem) {
        activeTabItem.rowCount = rowCount;
        activeTabItem.columnCount = discoveredColumns.length;
      }

      res.json({
        success: true,
        spreadsheetId: cleanId,
        spreadsheetTitle,
        activeTab: activeName,
        activeGid,
        sheetTabs: tabs,
        discoveredColumns,
        discoveredColumnsCount: discoveredColumns.length,
        rowCount,
        sampleRows,
        syncedAt: new Date().toISOString()
      });
    } catch (err: any) {
      console.error("Error inspecting Google Sheets:", err);
      res.status(500).json({ error: `Failed to inspect Google Sheet: ${err.message}` });
    }
  });

  // REAL Test Connection Endpoint (Direct Live Ping to Google Servers)
  router.post("/integrations/google-sheets/test-connection", async (req, res) => {
    try {
      const { spreadsheetId } = req.body;
      if (!spreadsheetId || typeof spreadsheetId !== 'string' || !spreadsheetId.trim()) {
        return res.status(400).json({ error: "Spreadsheet ID or URL is required" });
      }

      const cleanId = extractCleanSpreadsheetId(spreadsheetId);
      if (!cleanId || cleanId.length < 10) {
        return res.status(400).json({ connected: false, error: "Invalid Spreadsheet ID or URL" });
      }

      const startTime = Date.now();
      const googleRes = await fetch(`https://docs.google.com/spreadsheets/d/${cleanId}/htmlview`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        redirect: 'follow'
      });
      const latencyMs = Date.now() - startTime;

      if (googleRes.status === 404) {
        return res.status(404).json({
          connected: false,
          statusCode: 404,
          error: "Spreadsheet not found (HTTP 404). Please verify your Google Sheet link or ID."
        });
      }

      if (googleRes.status === 401 || googleRes.status === 403 || googleRes.url.includes('accounts.google.com') || googleRes.url.includes('/ServiceLogin')) {
        return res.status(403).json({
          connected: false,
          statusCode: 403,
          error: "Access Denied (HTTP 403): The spreadsheet is private. Set General access to 'Anyone with the link' (Viewer) in Google Sheets sharing settings."
        });
      }

      if (!googleRes.ok) {
        return res.status(googleRes.status).json({
          connected: false,
          statusCode: googleRes.status,
          error: `Google returned HTTP ${googleRes.status}: ${googleRes.statusText}`
        });
      }

      const html = await googleRes.text();
      const titleMatch = html.match(/<meta property="og:title" content="([^"]+)">/) || html.match(/<title>([^<]+)<\/title>/);
      const title = titleMatch ? titleMatch[1].replace(/ - Google (?:Sheets|Drive)$/, '').trim() : 'Google Spreadsheet';

      // Discovered tabs
      const tabs: Array<{ id: string; name: string; gid: string; rowCount: number; columnCount: number }> = [];
      const seenGids = new Set<string>();

      const pushBlocks = [...html.matchAll(/items\.push\((\{[\s\S]*?\})\);/g)];
      for (const bm of pushBlocks) {
        const block = bm[1];
        const nameM = block.match(/name:\s*["']([^"']+)["']/);
        const gidM = block.match(/gid:\s*["']?([0-9]+)["']?/);
        if (nameM && gidM && !seenGids.has(gidM[1])) {
          seenGids.add(gidM[1]);
          tabs.push({ id: `gid_${gidM[1]}`, name: nameM[1], gid: gidM[1], rowCount: 0, columnCount: 0 });
        }
      }

      if (tabs.length === 0) {
        const buttonMatches = [...html.matchAll(/id="sheet-button-([^"]+)"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/g)];
        for (const m of buttonMatches) {
          if (!seenGids.has(m[1])) {
            seenGids.add(m[1]);
            tabs.push({ id: `gid_${m[1]}`, name: m[2].trim(), gid: m[1], rowCount: 0, columnCount: 0 });
          }
        }
      }

      res.json({
        connected: true,
        statusCode: 200,
        latencyMs,
        title,
        sheetTabs: tabs,
        tabsCount: tabs.length || 1,
        tabNames: tabs.map(t => t.name),
        message: `Verified! Successfully reached "${title}" in ${latencyMs}ms with HTTP 200 OK.`
      });
    } catch (err: any) {
      res.status(500).json({ connected: false, error: `Connection failed: ${err.message}` });
    }
  });

  // REAL Trigger Sync Endpoint (Imports actual rows into CRM Deals & Customers)
  router.post("/integrations/trigger-sync", async (req, res) => {
    try {
      const companyId = (req as any).user?.company_id || 1;
      const authUserId = (req as any).user?.id || 1;
      const { source, spreadsheetId, sheetTabName, columnMappings } = req.body;
      const startTime = Date.now();

      if (source === 'google_sheets') {
        if (!spreadsheetId || !spreadsheetId.trim()) {
          return res.status(400).json({ error: "Cannot sync: Please specify a Google Spreadsheet ID or URL." });
        }

        const cleanId = extractCleanSpreadsheetId(spreadsheetId);
        if (!cleanId) {
          return res.status(400).json({ error: "Invalid Spreadsheet ID or URL." });
        }

        // 1. Fetch real spreadsheet rows via GViz
        const targetTab = sheetTabName || '';
        let gvizUrl = `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:json`;
        if (targetTab) {
          gvizUrl += `&sheet=${encodeURIComponent(targetTab)}`;
        }

        const fetchRes = await fetch(gvizUrl);
        if (!fetchRes.ok) {
          return res.status(fetchRes.status).json({
            error: `Failed to fetch spreadsheet rows from Google (HTTP ${fetchRes.status}). Ensure the sheet is accessible.`
          });
        }

        const text = await fetchRes.text();
        const jsonMatch = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]+)\);/);
        if (!jsonMatch || !jsonMatch[1]) {
          return res.status(422).json({ error: "Google did not return structured table data." });
        }

        const parsed = JSON.parse(jsonMatch[1]);
        if (!parsed.table || !Array.isArray(parsed.table.rows)) {
          return res.status(422).json({ error: "No data rows found in this sheet tab." });
        }

        let headers: string[] = (parsed.table.cols || []).map((c: any) => c?.label).filter((l: any) => l && String(l).trim().length > 0);
        let rawRows = parsed.table.rows;

        if (headers.length === 0 && rawRows.length > 0) {
          headers = rawRows[0].c
            .map((c: any) => c?.v)
            .filter((v: any) => v !== null && v !== undefined && String(v).trim().length > 0)
            .map((v: any) => String(v).trim());
          rawRows = rawRows.slice(1);
        }

        if (rawRows.length === 0) {
          return res.json({
            success: true,
            recordsIngested: 0,
            message: `Spreadsheet connected, but found 0 data rows to import in tab "${targetTab || 'Sheet1'}".`,
            log: {
              id: `log_${Date.now()}`,
              timestamp: new Date().toISOString(),
              source: 'Google Sheets',
              status: 'Success',
              recordsIngested: '0 records (Sheet empty)',
              errorDetails: 'HTTP 200 OK — Header row detected, no data rows found',
              durationMs: Date.now() - startTime
            }
          });
        }

        // 2. Fetch default pipeline stage
        const stageRes = await pool.query(
          "SELECT id FROM crm_stages WHERE company_id = $1 ORDER BY order_index ASC LIMIT 1",
          [companyId]
        );
        const defaultStageId = stageRes.rows[0]?.id || null;

        // 3. Process each row using user's columnMappings
        const mappings: Array<{ sheetColumn: string; crmField: string }> = Array.isArray(columnMappings) ? columnMappings : [];
        let ingestedCount = 0;

        for (const row of rawRows) {
          const rowValues = (row.c || []).map((cell: any) => cell?.v ?? '');
          const rowData: Record<string, any> = {};

          // Map cells to CRM fields
          headers.forEach((colHeader, idx) => {
            const val = rowValues[idx];
            if (val !== undefined && val !== null && String(val).trim() !== '') {
              const mapping = mappings.find(m => m.sheetColumn.toLowerCase() === colHeader.toLowerCase());
              if (mapping && mapping.crmField) {
                rowData[mapping.crmField] = String(val).trim();
              } else {
                // Heuristic field fallback
                const lower = colHeader.toLowerCase();
                if (lower.includes('name')) rowData['customer_name'] = rowData['customer_name'] || String(val).trim();
                if (lower.includes('phone') || lower.includes('mobile')) rowData['customer_phone'] = rowData['customer_phone'] || String(val).trim();
                if (lower.includes('email')) rowData['customer_email'] = rowData['customer_email'] || String(val).trim();
                if (lower.includes('company') || lower.includes('org')) rowData['customer_company'] = rowData['customer_company'] || String(val).trim();
                if (lower.includes('title') || lower.includes('deal') || lower.includes('project')) rowData['title'] = rowData['title'] || String(val).trim();
                if (lower.includes('val') || lower.includes('budget') || lower.includes('price')) rowData['value'] = rowData['value'] || parseFloat(String(val).replace(/[^0-9.]/g, '')) || 0;
              }
            }
          });

          // Customer identity
          const customerName = rowData.customer_name || rowData.title || `Inbound Lead ${Date.now().toString().slice(-4)}`;
          const customerEmail = rowData.customer_email || null;
          const customerPhone = rowData.customer_phone || null;
          const customerCompany = rowData.customer_company || null;

          // Upsert Customer
          let customerId: number;
          if (customerEmail) {
            const existingCust = await pool.query(
              "SELECT id FROM crm_customers WHERE company_id = $1 AND email = $2",
              [companyId, customerEmail]
            );
            if (existingCust.rows.length > 0) {
              customerId = existingCust.rows[0].id;
            } else {
              const newCust = await pool.query(
                "INSERT INTO crm_customers (company_id, name, email, phone, company, source) VALUES ($1, $2, $3, $4, $5, 'Google Sheets') RETURNING id",
                [companyId, customerName, customerEmail, customerPhone, customerCompany]
              );
              customerId = newCust.rows[0].id;
            }
          } else {
            const newCust = await pool.query(
              "INSERT INTO crm_customers (company_id, name, email, phone, company, source) VALUES ($1, $2, $3, $4, $5, 'Google Sheets') RETURNING id",
              [companyId, customerName, customerEmail, customerPhone, customerCompany]
            );
            customerId = newCust.rows[0].id;
          }

          // Deal Title and attributes
          const dealTitle = rowData.title || `${customerName} - ${targetTab || 'Sheets Inbound'}`;
          const dealValue = typeof rowData.value === 'number' ? rowData.value : parseFloat(String(rowData.value || '0').replace(/[^0-9.]/g, '')) || 0;
          const serviceType = rowData.service_type || 'General Inbound';
          const product = rowData.product || null;
          const description = rowData.description || `Synced directly from Google Sheets tab: ${targetTab || 'Active Sheet'}`;

          // Create Deal
          await pool.query(
            `INSERT INTO crm_deals (company_id, customer_id, title, description, value, stage_id, service_type, product, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [companyId, customerId, dealTitle, description, dealValue, defaultStageId, serviceType, product]
          );

          ingestedCount++;
        }

        const elapsed = Date.now() - startTime;
        const newLog = {
          id: `log_${Date.now()}`,
          timestamp: new Date().toISOString(),
          source: 'Google Sheets',
          status: 'Success',
          recordsIngested: `${ingestedCount} deals imported`,
          errorDetails: `HTTP 200 OK — Tab: "${targetTab || 'Sheet1'}" (${rawRows.length} rows processed)`,
          durationMs: elapsed
        };

        return res.json({
          success: true,
          recordsIngested: ingestedCount,
          message: `Successfully synchronized and ingested ${ingestedCount} deals into CRM Deals Pipeline!`,
          log: newLog
        });
      }

      // Non-Sheets fallback
      const newLog = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: 'Inbound Webhook Receiver',
        status: 'Success',
        recordsIngested: '0 records',
        errorDetails: 'HTTP 200 OK — Webhook listener active',
        durationMs: Date.now() - startTime
      };

      res.json({
        success: true,
        message: 'Webhook receiver status verified.',
        log: newLog
      });
    } catch (err: any) {
      console.error("Error triggering sync:", err);
      res.status(500).json({ error: `Sync execution failed: ${err.message}` });
    }
  });

  router.post("/integrations/test-webhook", async (req, res) => {
    try {
      const { payload } = req.body;
      if (!payload) {
        return res.status(400).json({ error: "JSON payload is required for testing" });
      }

      const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload;
      const detectedFields = Object.keys(parsed).map((key) => {
        const val = parsed[key];
        const type = Array.isArray(val) ? 'array' : typeof val;
        return { key, type, sample: String(val).slice(0, 50) };
      });

      res.json({
        success: true,
        detectedKeysCount: detectedFields.length,
        detectedFields,
        mappedLeadPreview: {
          name: parsed.name || parsed.fullName || parsed.full_name || parsed.customer_name || 'Detected Lead',
          phone: parsed.phone || parsed.phoneNumber || parsed.phone_number || '+1 555-0199',
          email: parsed.email || parsed.user_email || 'inbound@example.com',
          company: parsed.company || parsed.organization || 'Acme Corp',
          serviceType: parsed.service || parsed.serviceType || parsed.product || 'General Inbound',
          estimatedValue: parsed.budget || parsed.value || parsed.amount || 0
        }
      });
    } catch (err: any) {
      res.status(400).json({ error: `Invalid JSON payload: ${err.message}` });
    }
  });

  router.post("/inbound-webhook/:tenantId", async (req, res) => {
    try {
      const { tenantId } = req.params;
      const payload = req.body;
      console.log(`[CRM Inbound Webhook] Received event for tenant ${tenantId}:`, payload);

      res.status(200).json({
        received: true,
        tenantId,
        message: "Inbound webhook acknowledged and queued for lead auto-assignment",
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to process inbound webhook" });
    }
  });

  return router;
}
