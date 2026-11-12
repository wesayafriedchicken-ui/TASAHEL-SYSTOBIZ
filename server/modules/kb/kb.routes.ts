import express from "express";
import { pool } from "../../db/schema.js";
import { logAction } from "../../services/auditLogger.js";
import { automationService } from "../../services/automation.service.js";
import { GoogleGenAI } from "@google/genai";
import { memoryCache } from "../../utils/cache.js";

export default function kbRoutes(wss: any) {
  const router = express.Router();

  // POST AI Assistant route for KB Article Creation & Editing
  router.post("/ai-assist", async (req, res) => {
    const { action, text, title, category, instructions } = req.body;
    try {
      if (action === "insert-template") {
        if (instructions === "callout-info") {
          return res.json({ result: `<div class="p-4 mb-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-xl text-blue-800 font-medium flex items-start gap-2">
  <span class="text-lg">ℹ️</span>
  <div>
    <strong>Information Heading</strong>
    <p class="text-sm mt-1">This is an informational callout block. Use it to highlight critical context, hints, or helpful explanations.</p>
  </div>
</div>` });
        } else if (instructions === "callout-success") {
          return res.json({ result: `<div class="p-4 mb-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-xl text-emerald-800 font-medium flex items-start gap-2">
  <span class="text-lg">✅</span>
  <div>
    <strong>Success / Tip Heading</strong>
    <p class="text-sm mt-1">This is a success or best practice callout block. Use it to highlight recommendations, best practices, or successfully completed steps.</p>
  </div>
</div>` });
        } else if (instructions === "callout-warning") {
          return res.json({ result: `<div class="p-4 mb-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-xl text-amber-800 font-medium flex items-start gap-2">
  <span class="text-lg">⚠️</span>
  <div>
    <strong>Important Warning Heading</strong>
    <p class="text-sm mt-1">This is a warning or alert callout block. Use it to highlight risks, crucial policies, or actions that must be avoided.</p>
  </div>
</div>` });
        } else if (instructions === "table") {
          return res.json({ result: `<div class="overflow-x-auto my-6 border border-slate-200 rounded-2xl shadow-sm">
  <table class="min-w-full divide-y divide-slate-200 text-sm">
    <thead class="bg-slate-50">
      <tr>
        <th class="px-4 py-3 text-left font-bold text-slate-700">Feature / Metric</th>
        <th class="px-4 py-3 text-left font-bold text-slate-700">Target Value</th>
        <th class="px-4 py-3 text-left font-bold text-slate-700">Current Status</th>
        <th class="px-4 py-3 text-left font-bold text-slate-700">Notes / Comments</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-slate-100 bg-white">
      <tr>
        <td class="px-4 py-3 text-slate-800 font-medium">Sales Conversion</td>
        <td class="px-4 py-3 text-slate-600">15%</td>
        <td class="px-4 py-3 text-amber-700 font-semibold">12%</td>
        <td class="px-4 py-3 text-slate-500">Moving up due to new CRM tools</td>
      </tr>
      <tr>
        <td class="px-4 py-3 text-slate-800 font-medium">Response Time</td>
        <td class="px-4 py-3 text-slate-600">&lt; 2 Hours</td>
        <td class="px-4 py-3 text-emerald-700 font-semibold">1.8 Hours</td>
        <td class="px-4 py-3 text-slate-500">Target met successfully</td>
      </tr>
      <tr>
        <td class="px-4 py-3 text-slate-800 font-medium">Customer Satisfaction</td>
        <td class="px-4 py-3 text-slate-600">&gt; 90%</td>
        <td class="px-4 py-3 text-emerald-700 font-semibold">94%</td>
        <td class="px-4 py-3 text-slate-500">Excellent feedback on recent support</td>
      </tr>
    </tbody>
  </table>
</div>` });
        } else if (instructions === "timeline") {
          return res.json({ result: `<div class="space-y-4 my-6">
  <div class="flex gap-4">
    <div class="flex flex-col items-center">
      <div class="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center font-bold text-indigo-700 text-sm">1</div>
      <div class="w-0.5 h-10 bg-indigo-100"></div>
    </div>
    <div class="pt-1">
      <h4 class="text-base font-bold text-slate-800">First Step / Discovery</h4>
      <p class="text-sm text-slate-600 mt-1">Gather requirements, verify client objectives, and establish scope boundaries.</p>
    </div>
  </div>
  <div class="flex gap-4">
    <div class="flex flex-col items-center">
      <div class="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center font-bold text-indigo-700 text-sm">2</div>
      <div class="w-0.5 h-10 bg-indigo-100"></div>
    </div>
    <div class="pt-1">
      <h4 class="text-base font-bold text-slate-800">Second Step / Execution</h4>
      <p class="text-sm text-slate-600 mt-1">Develop solutions following best practices and conduct internal QA testing.</p>
    </div>
  </div>
  <div class="flex gap-4">
    <div class="flex flex-col items-center">
      <div class="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">3</div>
    </div>
    <div class="pt-1">
      <h4 class="text-base font-bold text-slate-800">Third Step / Delivery</h4>
      <p class="text-sm text-slate-600 mt-1">Deploy changes to production, train staff, and gather final feedback.</p>
    </div>
  </div>
</div>` });
        } else if (instructions === "faq") {
          return res.json({ result: `<div class="my-6 space-y-4">
  <h3 class="text-lg font-bold text-slate-900 flex items-center gap-2">
    <span>🙋</span>
    <span>Frequently Asked Questions</span>
  </h3>
  
  <div class="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
    <h4 class="text-sm font-bold text-slate-800">Q1: How do we initiate a refund request?</h4>
    <p class="text-xs text-slate-600 mt-2 leading-relaxed">
      <strong>A:</strong> Go to the Sales CRM module, select the specific customer, and click on <strong>Request Refund</strong>. Submit the form with details and approval will be routed to the Finance team.
    </p>
  </div>

  <div class="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
    <h4 class="text-sm font-bold text-slate-800">Q2: Who has permission to edit Knowledge Base articles?</h4>
    <p class="text-xs text-slate-600 mt-2 leading-relaxed">
      <strong>A:</strong> Only users assigned with the 'Editor' or 'Administrator' roles in the Knowledge Base settings can create or edit articles. General staff have read-only access.
    </p>
  </div>
</div>` });
        }
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: "Gemini API key is not configured on the server. Please check your system settings." });
      }

      const ai = new GoogleGenAI({ apiKey });
      let prompt = "";

      if (action === "draft") {
        prompt = `You are an expert technical writer and knowledge base specialist.
Generate a comprehensive, beautifully structured Knowledge Base article (written in Markdown) about "${title || "Selected Topic"}" in the category of "${category || "General"}".
Ensure the article is engaging, extremely clear, and uses advanced formatting features:
- Use rich headers (H2, H3) and horizontal dividers to structure sections.
- Include a key takeaways summary section at the top.
- Include beautiful Markdown tables or bullet lists.
- Include emojis to make sections visually distinctive and engaging.
- Use info/warning/success callout boxes. For callouts, use HTML divs with tailwind classes (e.g. <div class="p-4 mb-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-xl text-blue-800 font-medium">💡 Note: ... </div>) so they look stunning when rendered in our modern app.
- Write the article in English, clear, and professional.
- Avoid introducing any placeholder text. Produce a complete, ready-to-publish article.`;
      } else if (action === "polish") {
        prompt = `You are an expert technical editor.
Polish and enhance the following Markdown text. Fix any grammatical mistakes, improve the tone to make it professional and engaging, structure it with clean Markdown headers, and sprinkle in professional emojis to make it more appealing and easier to read.
Keep the existing core information but expand it or make it look absolutely stunning and well-organized. Use Tailwind-styled callouts (e.g. <div class="p-4 mb-4 bg-indigo-50 border-l-4 border-indigo-500 rounded-r-xl text-indigo-800 font-medium">...</div>) for notes, warnings, or highlights.

Text to polish:
${text}

${instructions ? `User instructions to apply: ${instructions}` : ""}`;
      } else if (action === "translate") {
        prompt = `Polish and structure the following content in English.
Ensure the content retains its original Markdown formatting, headers, tables, code blocks, lists, and links perfectly, while using standard professional business/technical language suitable for a Corporate Knowledge Base.

Content:
${text}`;
      } else {
        return res.status(400).json({ error: "Invalid AI action" });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({ result: response.text });
    } catch (err) {
      console.error("AI Assist failed:", err);
      res.status(500).json({ error: "AI Assistant failed to generate a response. Please verify your GEMINI_API_KEY." });
    }
  });

  // GET all articles with category and author names
  router.get("/", async (req, res) => {
    try {
      const { search, category_id, department_id, status, author_id, limit, offset } = req.query;
      const companyId = (req as any).user?.company_id || 1;
      const queryLimit = Math.min(parseInt(limit as string) || 50, 100);
      const queryOffset = parseInt(offset as string) || 0;
      
      let query = `
        SELECT 
          ka.id, ka.company_id, ka.title, 
          SUBSTRING(ka.content FROM 1 FOR 300) as content,
          ka.category_id, ka.author_id, ka.tags, ka.attachments, 
          ka.related_sop_id, ka.content_type, ka.external_url, 
          ka.status, ka.visible_departments, ka.product_id, 
          ka.view_count, ka.helpful_count, ka.not_helpful_count, 
          ka.created_at, ka.updated_at,
          ac.name as category_name,
          ac.department_id as category_department_id,
          u.name as author_name,
          s.title as related_sop_title,
          p.name as product_name
        FROM knowledge_articles ka
        LEFT JOIN article_categories ac ON ka.category_id = ac.id
        LEFT JOIN users u ON ka.author_id = u.id
        LEFT JOIN sops s ON ka.related_sop_id = s.id
        LEFT JOIN products p ON ka.product_id = p.id
        WHERE (ka.company_id = $1 OR ka.company_id IS NULL)
      `;
      const params: any[] = [companyId];
      if (search) {
        params.push(`%${search}%`);
        query += ` AND (ka.title ILIKE $${params.length} OR ka.content ILIKE $${params.length} OR ka.tags ILIKE $${params.length})`;
      }
      if (category_id) {
        params.push(category_id);
        query += ` AND ka.category_id = $${params.length}`;
      }
      if (department_id) {
        params.push(department_id);
        query += ` AND ac.department_id = $${params.length}`;
      }
      if (status && status !== 'All') {
        params.push(status);
        query += ` AND ka.status = $${params.length}`;
      }
      if (author_id) {
        params.push(author_id);
        query += ` AND ka.author_id = $${params.length}`;
      }

      params.push(queryLimit, queryOffset);
      query += ` ORDER BY ka.updated_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;
      
      const result = await pool.query(query, params);
      res.json(result.rows);
    } catch (err) {
      console.error("KB Fetch Error:", err);
      // Return empty array instead of 500 to keep UI stable
      res.json([]);
    }
  });

  // GET categories
  router.get("/categories", async (req, res) => {
    try {
      const companyId = (req as any).user?.company_id || 1;
      const cacheKey = `kb:categories:${companyId}`;
      const cached = memoryCache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      const result = await pool.query(`
        SELECT ac.id, ac.company_id, ac.name, ac.department_id, d.name as department_name 
        FROM article_categories ac
        LEFT JOIN departments d ON ac.department_id = d.id
        WHERE ac.company_id = $1
        ORDER BY ac.name ASC
      `, [companyId]);
      
      // If no categories exist, seed default ones
      if (result.rows.length === 0) {
        await pool.query(`
          INSERT INTO article_categories (company_id, name, department_id) VALUES 
          ($1, 'Internal Policies', 1), 
          ($1, 'Services', 1), 
          ($1, 'Products', 1), 
          ($1, 'FAQs', 1)
        `, [companyId]);
        const seeded = await pool.query(`
          SELECT ac.id, ac.company_id, ac.name, ac.department_id, d.name as department_name 
          FROM article_categories ac
          LEFT JOIN departments d ON ac.department_id = d.id
          WHERE ac.company_id = $1
          ORDER BY ac.name ASC
        `, [companyId]);
        memoryCache.set(cacheKey, seeded.rows, 180);
        return res.json(seeded.rows);
      }
      
      memoryCache.set(cacheKey, result.rows, 180);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // POST new category
  router.post("/categories", async (req, res) => {
    const { name, department_id } = req.body;
    const companyId = (req as any).user?.company_id || 1;
    try {
      const result = await pool.query(
        "INSERT INTO article_categories (company_id, name, department_id) VALUES ($1, $2, $3) RETURNING id, company_id, name, department_id",
        [companyId, name, department_id || 1]
      );
      
      memoryCache.del(`kb:categories:${companyId}`);

      wss.clients.forEach((client: any) => {
        client.send(JSON.stringify({ type: "KB_CATEGORIES_UPDATED" }));
      });
      
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: "Failed to create category" });
    }
  });

  // PATCH update category
  router.patch("/categories/:id", async (req, res) => {
    const { id } = req.params;
    const { name, department_id } = req.body;
    try {
      const result = await pool.query(
        "UPDATE article_categories SET name = $1, department_id = $2 WHERE id = $3 RETURNING id, name, department_id",
        [name, department_id, id]
      );
      
      wss.clients.forEach((client: any) => {
        client.send(JSON.stringify({ type: "KB_CATEGORIES_UPDATED" }));
      });
      
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: "Failed to update category" });
    }
  });

  // DELETE category
  router.delete("/categories/:id", async (req, res) => {
    const { id } = req.params;
    try {
      // Check if category has articles
      const articles = await pool.query("SELECT count(*) FROM knowledge_articles WHERE category_id = $1", [id]);
      if (parseInt(articles.rows[0].count) > 0) {
        return res.status(400).json({ error: "Cannot delete category with existing articles" });
      }
      
      await pool.query("DELETE FROM article_categories WHERE id = $1", [id]);
      
      wss.clients.forEach((client: any) => {
        client.send(JSON.stringify({ type: "KB_CATEGORIES_UPDATED" }));
      });
      
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  // GET single article
  router.get("/:id", async (req, res, next) => {
    const { id } = req.params;
    if (!id || isNaN(Number(id))) {
      return next();
    }
    try {
      // Increment view count
      await pool.query("UPDATE knowledge_articles SET view_count = view_count + 1 WHERE id = $1", [id]);

      const result = await pool.query(`
        SELECT 
          ka.*, 
          ac.name as category_name,
          u.name as author_name,
          app.name as approver_name,
          s.title as related_sop_title,
          p.name as product_name
        FROM knowledge_articles ka
        LEFT JOIN article_categories ac ON ka.category_id = ac.id
        LEFT JOIN users u ON ka.author_id = u.id
        LEFT JOIN users app ON ka.approver_id = app.id
        LEFT JOIN sops s ON ka.related_sop_id = s.id
        LEFT JOIN products p ON ka.product_id = p.id
        WHERE ka.id = $1
      `, [id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Article not found" });
      }

      // Fetch related articles (same category or same tags)
      const article = result.rows[0];
      const relatedRes = await pool.query(`
        SELECT id, title, content_type, status
        FROM knowledge_articles
        WHERE category_id = $1 AND id != $2
        LIMIT 5
      `, [article.category_id, id]);

      res.json({
        ...article,
        related_articles: relatedRes.rows
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch article" });
    }
  });

  // GET article revisions
  router.get("/:id/revisions", async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query(`
        SELECT kar.*, u.name as updated_by_name
        FROM knowledge_article_revisions kar
        LEFT JOIN users u ON kar.updated_by = u.id
        WHERE kar.article_id = $1
        ORDER BY kar.version_number DESC
      `, [id]);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch revisions" });
    }
  });

  // POST new article
  router.post("/", async (req, res) => {
    const { 
      title, content, category_id, author_id, tags, 
      attachments, related_sop_id, content_type, external_url, status,
      visible_departments, product_id
    } = req.body;
    const user = (req as any).user;
    const companyId = user?.company_id || 1;
    const authUserId = user?.id || author_id || 1;
    try {
      const result = await pool.query(
        `INSERT INTO knowledge_articles 
        (company_id, title, content, category_id, author_id, tags, attachments, related_sop_id, content_type, external_url, status, visible_departments, product_id) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
        [
          companyId, title, content, category_id, authUserId, tags, 
          attachments, related_sop_id, content_type || 'Article', 
          external_url, status || 'Draft', visible_departments || '[]',
          product_id || null
        ]
      );
      
      const articleId = result.rows[0].id;
      await logAction(authUserId, 'CREATE', 'Knowledge Article', articleId, { title, company_id: companyId });
      await automationService.trigger('kb:article:created', { id: articleId, title, author_id: authUserId, company_id: companyId, category_id, tags });
 
      // Create initial revision
      await pool.query(
        `INSERT INTO knowledge_article_revisions 
        (company_id, article_id, version_number, content, change_summary, updated_by) 
        VALUES ($1, $2, $3, $4, $5, $6)`,
        [companyId, articleId, 1, content, 'Initial creation', authUserId]
      );
 
      wss.clients.forEach((client: any) => {
        client.send(JSON.stringify({ type: "KB_UPDATED" }));
      });
 
      res.json({ id: articleId });
    } catch (err) {
      console.error("Error creating article:", err);
      if ((err as any).code === '23503') { // Foreign key violation
        return res.status(400).json({ error: "Invalid author_id or category_id. Please ensure the user and category exist." });
      }
      res.status(500).json({ error: "Failed to create article" });
    }
  });
 
  // PATCH update article
  router.patch("/:id", async (req, res) => {
    const { id } = req.params;
    const { 
      title, content, category_id, tags, attachments, 
      related_sop_id, content_type, external_url, status, approver_id,
      change_summary, updated_by, visible_departments, product_id
    } = req.body;
    try {
      await pool.query(
        `UPDATE knowledge_articles 
        SET title = $1, content = $2, category_id = $3, tags = $4, attachments = $5, 
            related_sop_id = $6, content_type = $7, external_url = $8, status = $9, 
            approver_id = $10, visible_departments = $11, product_id = $12, updated_at = CURRENT_TIMESTAMP
        WHERE id = $13`,
        [
          title, content, category_id, tags, attachments, 
          related_sop_id, content_type, external_url, status, 
          approver_id, visible_departments || '[]', product_id || null, id
        ]
      );
      
      // Get current version count
      const versionRes = await pool.query(
        "SELECT count(*) FROM knowledge_article_revisions WHERE article_id = $1",
        [id]
      );
      const nextVersion = parseInt(versionRes.rows[0].count) + 1;
      const authUserId = parseInt(req.headers['x-user-id'] as string) || updated_by || 1;
      await logAction(authUserId, 'UPDATE', 'Knowledge Article', parseInt(id), { title, status, version: nextVersion });
      await automationService.trigger('kb:article:updated', { id: parseInt(id), title, status, category_id, tags });

      // Create new revision
      await pool.query(
        `INSERT INTO knowledge_article_revisions 
        (article_id, version_number, content, change_summary, updated_by) 
        VALUES ($1, $2, $3, $4, $5)`,
        [id, nextVersion, content, change_summary || 'Updated article', updated_by]
      );

      wss.clients.forEach((client: any) => {
        client.send(JSON.stringify({ type: "KB_UPDATED" }));
      });

      res.json({ success: true });
    } catch (err) {
      console.error("Error updating article:", err);
      if ((err as any).code === '23503') {
        return res.status(400).json({ error: "Invalid ID referenced. Please ensure categories and users exist." });
      }
      res.status(500).json({ error: "Failed to update article" });
    }
  });

  // POST feedback
  router.post("/:id/feedback", async (req, res) => {
    const { id } = req.params;
    const { helpful } = req.body;
    try {
      const column = helpful ? "helpful_count" : "not_helpful_count";
      await pool.query(`UPDATE knowledge_articles SET ${column} = ${column} + 1 WHERE id = $1`, [id]);
      
      // Fetch article details to trigger automation with rich data
      const artRes = await pool.query("SELECT id, title, category_id, tags, helpful_count, not_helpful_count FROM knowledge_articles WHERE id = $1", [id]);
      if (artRes.rows.length > 0) {
        const article = artRes.rows[0];
        await automationService.trigger('kb:feedback:submitted', { 
          id: parseInt(id), 
          helpful: helpful ? 'true' : 'false', 
          title: article.title, 
          category_id: article.category_id,
          tags: article.tags,
          helpful_count: article.helpful_count,
          not_helpful_count: article.not_helpful_count
        });
      }

      res.json({ success: true });
    } catch (err) {
      console.error("Feedback submission error:", err);
      res.status(500).json({ error: "Failed to submit feedback" });
    }
  });

  // DELETE article
  router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    const authUserId = parseInt(req.headers['x-user-id'] as string) || 1;
    try {
      await pool.query("DELETE FROM knowledge_articles WHERE id = $1", [id]);
      await logAction(authUserId, 'DELETE', 'Knowledge Article', parseInt(id));
      await automationService.trigger('kb:article:deleted', { id: parseInt(id) });
      
      wss.clients.forEach((client: any) => {
        client.send(JSON.stringify({ type: "KB_UPDATED" }));
      });

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete article" });
    }
  });

  return router;
}
