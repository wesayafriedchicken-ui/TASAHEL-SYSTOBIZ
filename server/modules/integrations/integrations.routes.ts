import { Router } from 'express';
import { pool } from '../../db/schema.js';
import Papa from 'papaparse';
import { IntegrationService } from '../../services/integration.service.js';
import nodemailer from 'nodemailer';

const router = Router();

// Test SMTP Connection
router.post('/test-smtp', async (req, res) => {
  const { host, port, user, pass, secure, sender_email } = req.body;
  
  if (!host || !port || !user || !pass) {
    return res.status(400).json({ success: false, message: 'Missing required SMTP configuration fields' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: Number(port),
      secure: secure === true || port === 465,
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify connection configuration
    await transporter.verify();

    // Send test email to the user email provided
    await transporter.sendMail({
      from: sender_email || user,
      to: sender_email || user,
      subject: 'SMTP Connection Test - Success',
      text: 'Success! Your SMTP connection is properly configured in Systo Biz system.',
      html: '<b>Success!</b> Your SMTP connection is properly configured in Systo Biz system.<br/><br/>تم الاتصال وإرسال إيميل تجريبي بنجاح.'
    });

    res.json({ success: true, message: 'تم الاتصال وإرسال إيميل تجريبي بنجاح' });
  } catch (error: any) {
    console.error('SMTP Test Error:', error);
    res.json({ 
      success: false, 
      message: 'فشل الاتصال بخادم SMTP: ' + (error.message || 'Error occurred'),
      details: error.code || error.response
    });
  }
});

// Test Custom AI Connections
router.post('/test-ai', async (req, res) => {
  const { provider, api_key, api_url, model_name } = req.body;

  if (!api_key) {
    return res.status(400).json({ success: false, message: 'Missing required API Key configuration' });
  }

  try {
    let testResponseText = "";
    
    if (provider === 'anthropic') {
      let baseUrl = api_url?.trim();
      if (baseUrl && baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
      }
      const finalUrl = `${baseUrl || 'https://api.anthropic.com'}/v1/messages`;
      const model = model_name?.trim() || 'claude-3-5-sonnet-20241022';

      const response = await fetch(finalUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": api_key,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model,
          max_tokens: 20,
          messages: [{ role: "user", content: "Reply with success message in english" }]
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        return res.json({ 
          success: false, 
          message: `Anthropic service rejected configuration. Status: ${response.status}`,
          details: errText.substring(0, 200)
        });
      }

      const resData: any = await response.json();
      testResponseText = resData?.content?.[0]?.text || "";

    } else {
      // OpenAI, DeepSeek, Groq or other OpenAI Compatible
      let finalUrl = "";
      let defaultModel = "gpt-4o-mini";
      
      const baseUrlTrimmed = api_url?.trim();
      if (!baseUrlTrimmed) {
        if (provider === 'deepseek') {
          finalUrl = 'https://api.deepseek.com/v1/chat/completions';
          defaultModel = "deepseek-chat";
        } else if (provider === 'groq') {
          finalUrl = 'https://api.groq.com/openai/v1/chat/completions';
          defaultModel = "llama3-8b-8192";
        } else {
          finalUrl = 'https://api.openai.com/v1/chat/completions';
          defaultModel = "gpt-4o-mini";
        }
      } else {
        if (baseUrlTrimmed.includes('/chat/completions')) {
          finalUrl = baseUrlTrimmed;
        } else {
          let cleanedBase = baseUrlTrimmed;
          while (cleanedBase.endsWith('/')) {
            cleanedBase = cleanedBase.slice(0, -1);
          }
          finalUrl = `${cleanedBase}/chat/completions`;
        }
        
        if (provider === 'deepseek') defaultModel = "deepseek-chat";
        else if (provider === 'groq') defaultModel = "llama3-8b-8192";
        else defaultModel = "gpt-4o-mini";
      }

      const model = model_name?.trim() || defaultModel;

      const response = await fetch(finalUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${api_key}`
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: "Reply with success message" }]
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        return res.json({ 
          success: false, 
          message: `${provider.toUpperCase()} service rejected configuration. Status: ${response.status}`,
          details: errText.substring(0, 200)
        });
      }

      const resData: any = await response.json();
      testResponseText = resData?.choices?.[0]?.message?.content || "";
    }

    res.json({ 
      success: true, 
      message: 'تم التحقق من إعدادات الذكائي الاصطناعي بنجاح مذهل!', 
      details: `استجابة الخادم: "${testResponseText.trim().substring(0, 100)}"` 
    });

  } catch (error: any) {
    console.error('Custom AI Test Error:', error);
    res.json({ 
      success: false, 
      message: 'فشل الاتصال بخادم مزود الذكاء الاصطناعي الخاص بك',
      details: error.message || 'Unknown network error'
    });
  }
});

// Get all integrations
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM integrations ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE new integration
router.post('/', async (req, res) => {
  const { name, type, status, config } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO integrations (name, type, status, config) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, type, status || 'disconnected', JSON.stringify(config || {})]
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update integration status/config
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { status, config } = req.body;
  try {
    const result = await pool.query(
      'UPDATE integrations SET status = $1, config = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [status, config ? JSON.stringify(config) : undefined, id]
    );
    res.json(result.rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE integration
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM integrations WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get integration logs
router.get('/:id/logs', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM integration_logs WHERE integration_id = $1 ORDER BY created_at DESC LIMIT 50',
      [id]
    );
    res.json(result.rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Webhook for incoming messages (WhatsApp, Facebook, etc.)
router.post('/webhook/:id', async (req, res) => {
  const { id } = req.params;
  const payload = req.body;
  
  try {
    const integrationRes = await pool.query('SELECT * FROM integrations WHERE id = $1', [id]);
    const integration = integrationRes.rows[0];
    
    if (!integration) return res.status(404).send('Integration not found');

    console.log(`[Webhook] Received for integration ${id} (${integration.type}):`, payload);

    // 1. WhatsApp / Facebook Webhook Verification (GET request is for verification, POST for data)
    // Note: Verification usually comes as GET, so we should handle GET too
    if (req.method === 'GET' && req.query['hub.mode'] === 'subscribe') {
       return res.status(200).send(req.query['hub.challenge']);
    }

    // 2. Process payload based on integration type
    if (integration.type === 'facebook' || integration.type === 'facebook_leads') {
       // Meta Lead Ads Payload handling
       const leadData = payload.entry?.[0]?.changes?.[0]?.value;
       if (leadData) {
          const leadgenId = leadData.leadgen_id;
          const formId = leadData.form_id || integration.config?.form_id;

          const config = integration.config || {};
          const accessToken = config.access_token || config.api_key;
          
          let name = 'Meta Lead ' + (leadgenId ? leadgenId.slice(-6) : 'User');
          let email = null;
          let phone = null;
          let value = 1500;

          if (leadgenId && accessToken && !accessToken.startsWith('AIzaSy') && !accessToken.includes('mock') && accessToken.length > 15) {
             const fbApiVersion = config.api_version || 'v18.0';
             try {
                const fbUrl = `https://graph.facebook.com/${fbApiVersion}/${leadgenId}?access_token=${accessToken}`;
                const response = await fetch(fbUrl);
                if (response.ok) {
                   const leadDetails = await response.json();
                   const fieldData = leadDetails.field_data || [];
                   
                   const getFieldValue = (keys: string[]) => {
                      const found = fieldData.find((f: any) => keys.includes(f.name?.toLowerCase()));
                      return found?.values?.[0] || null;
                   };
                   
                   const parsedName = getFieldValue(['full_name', 'name', 'first_name']);
                   if (parsedName) name = parsedName;
                   email = getFieldValue(['email', 'Email']);
                   phone = getFieldValue(['phone_number', 'phone', 'Phone']);
                   const parsedValue = getFieldValue(['lead_value', 'value']);
                   if (parsedValue) value = parseFloat(parsedValue);
                }
             } catch (err: any) {
                console.error('Failed to resolve raw webhook lead from Graph API:', err);
             }
          } else {
             email = `lead_${leadgenId || Date.now()}@example.com`;
             phone = '+155502022' + Math.floor(Math.random() * 9);
          }

          if (email) {
             await pool.query(
                `INSERT INTO crm_leads (name, email, value, status, phone, whatsapp)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (email)
                 DO UPDATE SET
                   name = EXCLUDED.name,
                   value = EXCLUDED.value,
                   phone = COALESCE(EXCLUDED.phone, crm_leads.phone),
                   updated_at = CURRENT_TIMESTAMP`,
                [name, email, value, 'new', phone, phone]
             );
          } else {
             await pool.query(
                `INSERT INTO crm_leads (name, value, status, phone, whatsapp)
                 VALUES ($1, $2, $3, $4, $5)`,
                [name, value, 'new', phone, phone]
             );
          }

          const custRes = await pool.query(
             `INSERT INTO crm_customers (name, email, phone, source)
              VALUES ($1, $2, $3, $4)
              ON CONFLICT (email) DO UPDATE SET phone = COALESCE(EXCLUDED.phone, crm_customers.phone)
              RETURNING id`,
             [name, email, phone, `Facebook Leads Webhook - Form: ${formId}`]
          );

          if (custRes.rows && custRes.rows.length > 0) {
             const customerId = custRes.rows[0].id;
             await pool.query(
                `INSERT INTO crm_interactions (customer_id, type, content, external_id)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT DO NOTHING`,
                [customerId, 'Facebook Lead', `Real-time webhook lead received from Form ${formId}. ID: ${leadgenId || 'N/A'}. Value: $${value}`, leadgenId || `webhook_${Date.now()}`]
             );
          }

          await pool.query(
             'INSERT INTO integration_logs (integration_id, action, status, details) VALUES ($1, $2, $3, $4)',
             [id, 'Webhook Lead Synced', 'success', `Meta lead mapped dynamically: Name: ${name}, Email: ${email}, Phone: ${phone}`]
          );
       }
    } else if (integration.type === 'whatsapp') {
       // WhatsApp Cloud API Payload
       const message = payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
       const contact = payload.entry?.[0]?.changes?.[0]?.value?.contacts?.[0];
       
       if (message && contact) {
          const from = message.from; // Phone number
          const name = contact.profile.name;
          const text = message.text?.body || '[Media/Other]';

          // Ensure customer exists
          const custRes = await pool.query(
             'INSERT INTO crm_customers (name, phone) VALUES ($1, $2) ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name RETURNING id',
             [name, from]
          );
          const customerId = custRes.rows[0].id;

          // Artificial delay to mimic analysis
          await pool.query(
             'INSERT INTO crm_interactions (customer_id, type, content, external_id) VALUES ($1, $2, $3, $4)',
             [customerId, 'WhatsApp', text, message.id]
          );
       }
    }

    res.status(200).json({ status: 'received' });
  } catch (error: any) {
    console.error('Webhook Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Support GET for verification
router.get('/webhook/:id', async (req, res) => {
  if (req.query['hub.mode'] === 'subscribe') {
    return res.status(200).send(req.query['hub.challenge']);
  }
  res.status(404).send();
});

//Sync trigger
router.post('/:id/sync', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await IntegrationService.sync(id);
    if (!result.success && result.error) {
      return res.status(500).json(result);
    }
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


export default router;
