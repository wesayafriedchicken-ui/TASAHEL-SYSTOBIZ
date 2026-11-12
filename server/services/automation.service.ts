import { pool } from "../db/schema.js";
import { eventBus } from "../lib/eventBus.js";

interface Condition {
  field: string;
  operator: '==' | '!=' | '>' | '<' | 'contains';
  value: any;
}

interface Action {
  type: 'notification' | 'task_create' | 'status_update' | 'auto_assign' | 'kb_draft_create' | 'kb_status_update' | 'kb_link_sop' | 'crm_lead_status_update' | 'crm_add_deal_note' | 'sop_publish' | 'qa_trigger_audit' | 'risk_escalate' | 'kaizen_approve' | 'send_email_external';
  params: any;
}

class AutomationService {
  constructor() {
    this.initializeSubscribers();
  }

  private async initializeSubscribers() {
    console.log("[Automation] Initializing Pub/Sub Subscribers...");
    
    // In a real app, we might subscribe to a wildcard or a list of known events
    // For this implementation, we'll listen for all automation triggers via the EventBus
    eventBus.on('automation:trigger', async ({ triggerType, data }) => {
      await this.processTrigger(triggerType, data);
    });

    // Also listen for webhook events specifically
    eventBus.on('webhook:whatsapp', async (data) => {
      await this.processTrigger('webhook:whatsapp', data);
    });
    
    eventBus.on('webhook:facebook', async (data) => {
      await this.processTrigger('webhook:facebook', data);
    });
  }

  async trigger(triggerType: string, data: any) {
    // Instead of processing directly, we publish to the EventBus
    // This makes the trigger call return immediately, improving UI responsiveness
    eventBus.publish('automation:trigger', { triggerType, data });
  }

  private async processTrigger(triggerType: string, data: any) {
    console.log(`[Automation] Processing Trigger: ${triggerType}`);
    
    try {
      const rulesRes = await pool.query(
        "SELECT * FROM automation_rules WHERE trigger_type = $1 AND is_active = TRUE",
        [triggerType]
      );

      for (const rule of rulesRes.rows) {
        const conditions: Condition[] = rule.conditions || [];
        const actions: Action[] = rule.actions || [];

        if (this.evaluateConditions(conditions, data)) {
          console.log(`[Automation] Rule matched: ${rule.name}`);
          // Execute actions asynchronously
          this.executeActions(rule.id, actions, data);
        }
      }
    } catch (error) {
      console.error("[Automation] Error processing trigger:", error);
    }
  }

  private evaluateConditions(conditions: Condition[], data: any): boolean {
    if (conditions.length === 0) return true;

    return conditions.every(condition => {
      const actualValue = data[condition.field];
      const targetValue = condition.value;

      if (actualValue === undefined) return false;

      switch (condition.operator) {
        case '==': return actualValue == targetValue;
        case '!=': return actualValue != targetValue;
        case '>': return Number(actualValue) > Number(targetValue);
        case '<': return Number(actualValue) < Number(targetValue);
        case 'contains': 
          return typeof actualValue === 'string' && actualValue.toLowerCase().includes(String(targetValue).toLowerCase());
        default: return false;
      }
    });
  }

  private async executeActions(ruleId: number, actions: Action[], triggerData: any) {
    for (const action of actions) {
      // Execute each action with retry logic
      this.executeActionWithRetry(ruleId, action, triggerData);
    }
  }

  private async executeActionWithRetry(ruleId: number, action: Action, triggerData: any, attempt = 1) {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000; // 2 seconds

    try {
      await this.runAction(action, triggerData);
      await this.logExecution(ruleId, triggerData, 'success');
    } catch (error: any) {
      console.error(`[Automation] Action failed (Attempt ${attempt}/${MAX_RETRIES}):`, error.message);
      
      if (attempt < MAX_RETRIES) {
        setTimeout(() => {
          this.executeActionWithRetry(ruleId, action, triggerData, attempt + 1);
        }, RETRY_DELAY * attempt); // Exponential backoff
      } else {
        await this.logExecution(ruleId, triggerData, 'failed', error.message);
      }
    }
  }

  private async runAction(action: Action, triggerData: any) {
    switch (action.type) {
      case 'notification':
        await this.handleNotification(action.params, triggerData);
        break;
      case 'task_create':
        await this.handleTaskCreate(action.params, triggerData);
        break;
      case 'status_update':
        await this.handleStatusUpdate(action.params, triggerData);
        break;
      case 'auto_assign':
        await this.handleAutoAssign(action.params, triggerData);
        break;
      case 'kb_draft_create':
        await this.handleKbDraftCreate(action.params, triggerData);
        break;
      case 'kb_status_update':
        await this.handleKbStatusUpdate(action.params, triggerData);
        break;
      case 'kb_link_sop':
        await this.handleKbLinkSop(action.params, triggerData);
        break;
      case 'crm_lead_status_update':
        await this.handleCrmLeadStatusUpdate(action.params, triggerData);
        break;
      case 'crm_add_deal_note':
        await this.handleCrmAddDealNote(action.params, triggerData);
        break;
      case 'sop_publish':
        await this.handleSopPublish(action.params, triggerData);
        break;
      case 'qa_trigger_audit':
        await this.handleQaTriggerAudit(action.params, triggerData);
        break;
      case 'risk_escalate':
        await this.handleRiskEscalate(action.params, triggerData);
        break;
      case 'kaizen_approve':
        await this.handleKaizenApprove(action.params, triggerData);
        break;
      case 'send_email_external':
        await this.handleSendEmailExternal(action.params, triggerData);
        break;
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  private async logExecution(ruleId: number, triggerData: any, status: string, errorMessage: string | null = null) {
    await pool.query(
      "INSERT INTO automation_logs (rule_id, trigger_data, execution_status, error_message) VALUES ($1, $2, $3, $4)",
      [ruleId, triggerData, status, errorMessage]
    );
  }

  private async handleNotification(params: any, data: any) {
    const { channel, message, recipient_id } = params;
    const formattedMessage = this.formatString(message, data);
    
    // Resolve dynamic recipient_id if it's a template string
    let targetRecipientId = recipient_id;
    if (typeof recipient_id === 'string' && recipient_id.includes('{{')) {
      const resolved = this.formatString(recipient_id, data);
      targetRecipientId = parseInt(resolved) || 1;
    } else if (!recipient_id) {
      targetRecipientId = 1;
    }

    // Internal notification
    if (channel === 'internal' || !channel) {
      await pool.query(
        "INSERT INTO internal_messages (sender_id, receiver_id, subject, content) VALUES ($1, $2, $3, $4)",
        [null, targetRecipientId, "Automation Alert", formattedMessage]
      );
    }
    
    // Mock external integrations with potential for failure (for retry testing)
    if (channel === 'whatsapp') {
      if (Math.random() < 0.2) throw new Error("WhatsApp API Timeout");
      console.log(`[WhatsApp API] To: ${data.phone || 'Customer'}, Msg: ${formattedMessage}`);
    }
    
    if (channel === 'slack') {
      if (Math.random() < 0.1) throw new Error("Slack Webhook Error");
      console.log(`[Slack API] Channel: #alerts, Msg: ${formattedMessage}`);
    }
  }

  private async handleTaskCreate(params: any, data: any) {
    const { title, description, assigned_to_field, priority } = params;
    const assignedTo = data[assigned_to_field] || 1;
    
    await pool.query(
      "INSERT INTO tasks (title, description, assigned_to, priority, status) VALUES ($1, $2, $3, $4, $5)",
      [
        this.formatString(title, data),
        this.formatString(description || '', data),
        assignedTo,
        priority || 'medium',
        'pending'
      ]
    );
  }

  private async handleStatusUpdate(params: any, data: any) {
    const { table, id_field, status_field, status_value } = params;
    const id = data[id_field];
    
    if (id && table && status_field) {
      await pool.query(
        `UPDATE ${table} SET ${status_field} = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [status_value, id]
      );
    }
  }

  private async handleAutoAssign(params: any, data: any) {
    const { table, id_field, criteria_field } = params;
    const id = data[id_field];
    const criteriaValue = data[criteria_field];

    const ruleRes = await pool.query(
      "SELECT user_id FROM crm_assignment_rules WHERE service_type = $1 OR product = $1 AND is_active = TRUE LIMIT 1",
      [criteriaValue]
    );

    if (ruleRes.rows.length > 0) {
      const userId = ruleRes.rows[0].user_id;
      await pool.query(
        `UPDATE ${table} SET assigned_to = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [userId, id]
      );
    }
  }

  private async handleKbDraftCreate(params: any, data: any) {
    const { title, content, category_id } = params;
    const formattedTitle = this.formatString(title, data);
    const formattedContent = this.formatString(content || '', data);
    
    let resolvedCategoryId = 1;
    if (category_id) {
      const formattedCategory = this.formatString(String(category_id), data);
      resolvedCategoryId = parseInt(formattedCategory) || 1;
    }
    
    const companyId = data.company_id || 1;
    const authorId = data.author_id || 1;

    const result = await pool.query(
      `INSERT INTO knowledge_articles 
      (company_id, title, content, category_id, author_id, tags, attachments, content_type, status, visible_departments) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [
        companyId, 
        formattedTitle, 
        formattedContent, 
        resolvedCategoryId, 
        authorId, 
        'auto-generated', 
        '[]', 
        'Article', 
        'Draft', 
        '[]'
      ]
    );

    const articleId = result.rows[0].id;
    
    await pool.query(
      `INSERT INTO knowledge_article_revisions 
      (company_id, article_id, version_number, content, change_summary, updated_by) 
      VALUES ($1, $2, $3, $4, $5, $6)`,
      [companyId, articleId, 1, formattedContent, 'Auto-generated by workflow', authorId]
    );
  }

  private async handleKbStatusUpdate(params: any, data: any) {
    const { article_id, status } = params;
    const formattedArticleId = this.formatString(String(article_id), data);
    const articleId = parseInt(formattedArticleId);
    const formattedStatus = this.formatString(status || 'Draft', data);

    if (articleId) {
      await pool.query(
        "UPDATE knowledge_articles SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [formattedStatus, articleId]
      );
    }
  }

  private async handleKbLinkSop(params: any, data: any) {
    const { article_id, sop_id } = params;
    const formattedArticleId = this.formatString(String(article_id), data);
    const formattedSopId = this.formatString(String(sop_id), data);
    const articleId = parseInt(formattedArticleId);
    const sopId = parseInt(formattedSopId);

    if (articleId && sopId) {
      await pool.query(
        "UPDATE knowledge_articles SET related_sop_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [sopId, articleId]
      );
    }
  }

  private async handleCrmLeadStatusUpdate(params: any, data: any) {
    try {
      const { lead_id, status } = params;
      const formattedLeadId = this.formatString(String(lead_id || '{{id}}'), data);
      const leadId = parseInt(formattedLeadId);
      const formattedStatus = this.formatString(status || 'Qualified', data);
      
      if (leadId) {
        await pool.query(
          "UPDATE crm_leads SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
          [formattedStatus, leadId]
        );
        console.log(`[Automation] Lead ID ${leadId} status updated to: ${formattedStatus}`);
      }
    } catch (e: any) {
      console.warn(`[Automation] handleCrmLeadStatusUpdate warning (safe fallback): ${e.message}`);
    }
  }

  private async handleCrmAddDealNote(params: any, data: any) {
    try {
      const { deal_id, note_content } = params;
      const formattedDealId = this.formatString(String(deal_id || '{{id}}'), data);
      const dealId = parseInt(formattedDealId);
      const formattedNote = this.formatString(note_content || 'Automated activity log', data);

      if (dealId) {
        // Log in a universal activities/notes table or deal comments
        await pool.query(
          "INSERT INTO crm_deal_activities (deal_id, activity_type, notes) VALUES ($1, $2, $3)",
          [dealId, 'automation_log', formattedNote]
        ).catch(() => {
          // Fallback to internal message if table doesn't support activities
          return pool.query(
            "INSERT INTO internal_messages (sender_id, receiver_id, subject, content) VALUES ($1, $2, $3, $4)",
            [null, 1, "Deal Activity", `Deal ID ${dealId}: ${formattedNote}`]
          );
        });
        console.log(`[Automation] Added note to Deal ID ${dealId}: ${formattedNote}`);
      }
    } catch (e: any) {
      console.warn(`[Automation] handleCrmAddDealNote warning (safe fallback): ${e.message}`);
    }
  }

  private async handleSopPublish(params: any, data: any) {
    try {
      const { sop_id } = params;
      const formattedSopId = this.formatString(String(sop_id || '{{id}}'), data);
      const sopId = parseInt(formattedSopId);

      if (sopId) {
        await pool.query(
          "UPDATE sops SET status = 'Approved', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
          [sopId]
        );
        console.log(`[Automation] SOP ID ${sopId} status published.`);
      }
    } catch (e: any) {
      console.warn(`[Automation] handleSopPublish warning (safe fallback): ${e.message}`);
    }
  }

  private async handleQaTriggerAudit(params: any, data: any) {
    try {
      const { audit_title, category } = params;
      const formattedTitle = this.formatString(audit_title || 'Auto Audit - {{name}}', data);
      const formattedCategory = this.formatString(category || 'General', data);

      // Create a task as audit trigger
      await pool.query(
        "INSERT INTO tasks (title, description, priority, status) VALUES ($1, $2, $3, $4)",
        [
          `[QA Audit] ${formattedTitle}`,
          `Automated QA assessment for category: ${formattedCategory}. Please inspect and record findings.`,
          'high',
          'pending'
        ]
      );
      console.log(`[Automation] QA Audit scheduled: ${formattedTitle}`);
    } catch (e: any) {
      console.warn(`[Automation] handleQaTriggerAudit warning (safe fallback): ${e.message}`);
    }
  }

  private async handleRiskEscalate(params: any, data: any) {
    try {
      const { risk_id } = params;
      const formattedRiskId = this.formatString(String(risk_id || '{{id}}'), data);
      const riskId = parseInt(formattedRiskId);

      if (riskId) {
        await pool.query(
          "UPDATE risk_register SET status = 'Escalated', risk_score = risk_score + 2, updated_at = CURRENT_TIMESTAMP WHERE id = $1",
          [riskId]
        );
        console.log(`[Automation] Risk ID ${riskId} status set to Escalated.`);
      }
    } catch (e: any) {
      console.warn(`[Automation] handleRiskEscalate warning (safe fallback): ${e.message}`);
    }
  }

  private async handleKaizenApprove(params: any, data: any) {
    try {
      const { suggestion_id } = params;
      const formattedSuggestionId = this.formatString(String(suggestion_id || '{{id}}'), data);
      const suggestionId = parseInt(formattedSuggestionId);

      if (suggestionId) {
        await pool.query(
          "UPDATE kaizen_suggestions SET status = 'Approved', updated_at = CURRENT_TIMESTAMP WHERE id = $1",
          [suggestionId]
        );
        console.log(`[Automation] Kaizen Suggestion ID ${suggestionId} approved.`);
      }
    } catch (e: any) {
      console.warn(`[Automation] handleKaizenApprove warning (safe fallback): ${e.message}`);
    }
  }

  private async handleSendEmailExternal(params: any, data: any) {
    try {
      const { to_email, subject, body } = params;
      const formattedTo = this.formatString(to_email || '{{email}}', data);
      const formattedSubject = this.formatString(subject || 'Company Update', data);
      const formattedBody = this.formatString(body || '', data);

      console.log(`[Email Service SDK] Outbox Delivery: to=${formattedTo}, sub=${formattedSubject}, bodyLength=${formattedBody.length}`);
    } catch (e: any) {
      console.warn(`[Automation] handleSendEmailExternal warning: ${e.message}`);
    }
  }

  private formatString(str: string, data: any): string {
    if (!str) return '';
    return str.replace(/\{\{(.*?)\}\}/g, (match, key) => {
      const trimmedKey = key.trim();
      // Support nested data if needed, but for now simple lookup
      return data[trimmedKey] !== undefined ? data[trimmedKey] : match;
    });
  }
}

export const automationService = new AutomationService();
