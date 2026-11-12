import express from "express";
import { pool } from "../../db/schema.js";
import { logAction } from "../../services/auditLogger.js";
import { automationService } from "../../services/automation.service.js";
import { memoryCache } from "../../utils/cache.js";

export default function productRoutes(wss: any) {
  const router = express.Router();

  // GET all products/services
  router.get("/", async (req, res) => {
    try {
      const companyId = (req as any).user?.company_id || 1;
      const { search, category, type, limit, offset } = req.query;
      const pageLimit = Math.min(parseInt(limit as string) || 50, 100);
      const pageOffset = Math.max(parseInt(offset as string) || 0, 0);

      // Cache lookup for default unfiltered listing
      const cacheKey = `products:list:${companyId}:${pageLimit}:${pageOffset}`;
      if (!search && !category && !type) {
        const cached = memoryCache.get(cacheKey);
        if (cached) return res.json(cached);
      }

      let query = `
        SELECT id, company_id, name, description, price, currency, category, type,
               sku, cost, tax, stock_qty, low_stock_threshold, service_duration_hours,
               service_duration_unit, sop_id, process_mapping_id, is_cost_variable,
               is_price_variable, has_variants, variants, status, created_at, updated_at
        FROM products 
        WHERE status = 'active' AND company_id = $1
      `;
      let params: any[] = [companyId];
      let paramIndex = 2;

      if (search) {
        query += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      if (category) {
        query += ` AND category = $${paramIndex}`;
        params.push(category);
        paramIndex++;
      }

      if (type) {
        query += ` AND type = $${paramIndex}`;
        params.push(type);
        paramIndex++;
      }

      query += ` ORDER BY name ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(pageLimit, pageOffset);
      
      const result = await pool.query(query, params);

      if (!search && !category && !type) {
        memoryCache.set(cacheKey, result.rows, 120);
      }

      res.json(result.rows);
    } catch (err) {
      console.error("Error fetching products:", err);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  // GET categories
  router.get("/categories", async (req, res) => {
    try {
      const companyId = (req as any).user?.company_id || 1;
      const cacheKey = `products:categories:${companyId}`;
      const cached = memoryCache.get(cacheKey);
      if (cached) return res.json(cached);

      const result = await pool.query("SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND status = 'active' AND company_id = $1", [companyId]);
      const categories = result.rows.map(r => r.category);
      memoryCache.set(cacheKey, categories, 300);
      res.json(categories);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // GET single product
  router.get("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const companyId = (req as any).user?.company_id || 1;
      const result = await pool.query(`
        SELECT id, company_id, name, description, price, currency, category, type,
               sku, cost, tax, stock_qty, low_stock_threshold, service_duration_hours,
               service_duration_unit, sop_id, process_mapping_id, is_cost_variable,
               is_price_variable, has_variants, variants, status, created_at, updated_at
        FROM products 
        WHERE id = $1 AND company_id = $2
      `, [id, companyId]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  // CREATE product
  router.post("/", async (req, res) => {
    try {
      const { 
        name, description, price, currency, category, type, 
        sku, cost, tax, stock_qty, low_stock_threshold, service_duration_hours, service_duration_unit, sop_id,
        process_mapping_id, is_cost_variable, is_price_variable,
        has_variants, variants
      } = req.body;
      const user = (req as any).user;
      const companyId = user?.company_id || 1;
      const authUserId = user?.id || 1;

      const safeVariants = Array.isArray(variants) ? JSON.stringify(variants) : (typeof variants === 'string' ? variants : '[]');

      const result = await pool.query(
        `INSERT INTO products (
          company_id, name, description, price, currency, category, type,
          sku, cost, tax, stock_qty, low_stock_threshold, service_duration_hours, service_duration_unit, sop_id,
          process_mapping_id, is_cost_variable, is_price_variable,
          has_variants, variants
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) RETURNING *`,
        [
          companyId, name, description, price, currency || 'EGP', category, type || 'product',
          sku, cost || 0, tax || 0, stock_qty || 0, low_stock_threshold || 10, service_duration_hours || 0, service_duration_unit || 'hours', sop_id,
          process_mapping_id || null, is_cost_variable || false, is_price_variable || false,
          has_variants || false, safeVariants
        ]
      );

      const product = result.rows[0];
      await logAction(authUserId, 'CREATE', 'Product', product.id, { name, price, company_id: companyId });
      await automationService.trigger('product:created', product);

      res.status(201).json(product);
    } catch (err) {
      console.error("Error creating product:", err);
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  // UPDATE product
  router.put("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { 
        name, description, price, currency, category, type, status,
        sku, cost, tax, stock_qty, low_stock_threshold, service_duration_hours, service_duration_unit, sop_id,
        process_mapping_id, is_cost_variable, is_price_variable,
        has_variants, variants
      } = req.body;
      const user = (req as any).user;
      const companyId = user?.company_id || 1;
      const authUserId = user?.id || 1;

      const safeVariants = Array.isArray(variants) ? JSON.stringify(variants) : (typeof variants === 'string' ? variants : '[]');

      const result = await pool.query(
        `UPDATE products SET 
          name = $1, description = $2, price = $3, currency = $4, category = $5, type = $6, status = $7, 
          sku = $8, cost = $9, tax = $10, stock_qty = $11, low_stock_threshold = $12, 
          service_duration_hours = $13, service_duration_unit = $14, sop_id = $15, process_mapping_id = $16,
          is_cost_variable = $17, is_price_variable = $18, has_variants = $19, variants = $20,
          updated_at = CURRENT_TIMESTAMP 
        WHERE id = $21 AND company_id = $22 RETURNING *`,
        [
          name, description, price, currency, category, type, status,
          sku, cost || 0, tax || 0, stock_qty || 0, low_stock_threshold || 10,
          service_duration_hours || 0, service_duration_unit || 'hours', sop_id, process_mapping_id || null,
          is_cost_variable || false, is_price_variable || false,
          has_variants || false, safeVariants,
          id, companyId
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Product not found" });
      }

      const product = result.rows[0];
      await logAction(authUserId, 'UPDATE', 'Product', product.id, { name, price, company_id: companyId });
      await automationService.trigger('product:updated', product);

      res.json(product);
    } catch (err) {
      console.error("Error updating product:", err);
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  // DELETE product
  router.delete("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const companyId = user?.company_id || 1;
      const authUserId = user?.id || 1;

      await pool.query("UPDATE products SET status = 'inactive', updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND company_id = $2", [id, companyId]);
      await logAction(authUserId, 'DELETE', 'Product', parseInt(id), { company_id: companyId });
      await automationService.trigger('product:deleted', { id: parseInt(id), company_id: companyId });

      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // PRICE LISTS
  router.get("/price-lists/all", async (req, res) => {
    try {
      const companyId = (req as any).user?.company_id || 1;
      const cacheKey = `products:price_lists:${companyId}`;
      const cached = memoryCache.get(cacheKey);
      if (cached) return res.json(cached);

      const result = await pool.query("SELECT id, company_id, name, description, is_active, created_at FROM price_lists WHERE company_id = $1 ORDER BY name ASC", [companyId]);
      memoryCache.set(cacheKey, result.rows, 300);
      res.json(result.rows);
    } catch (err) {
      console.error("Error fetching price lists:", err);
      res.status(500).json({ error: "Failed to fetch price lists" });
    }
  });

  router.post("/price-lists/all", async (req, res) => {
    try {
      const { name, description, is_active } = req.body;
      const companyId = (req as any).user?.company_id || 1;
      const authUserId = (req as any).user?.id || 1;

      const result = await pool.query(
        "INSERT INTO price_lists (company_id, name, description, is_active) VALUES ($1, $2, $3, $4) RETURNING *",
        [companyId, name, description, is_active !== false]
      );
      memoryCache.delete(`products:price_lists:${companyId}`);
      await logAction(authUserId, 'CREATE', 'PriceList', result.rows[0].id, { name, company_id: companyId });
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error("Error creating price list:", err);
      res.status(500).json({ error: "Failed to create price list" });
    }
  });

  router.put("/price-lists/all/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description, is_active } = req.body;
      const companyId = (req as any).user?.company_id || 1;

      const result = await pool.query(
        "UPDATE price_lists SET name = $1, description = $2, is_active = $3 WHERE id = $4 AND company_id = $5 RETURNING *",
        [name, description, is_active, id, companyId]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: "Price list not found" });
      memoryCache.delete(`products:price_lists:${companyId}`);
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: "Failed to update price list" });
    }
  });

  router.delete("/price-lists/all/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const companyId = (req as any).user?.company_id || 1;
      await pool.query("DELETE FROM price_lists WHERE id = $1 AND company_id = $2", [id, companyId]);
      memoryCache.delete(`products:price_lists:${companyId}`);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete price list" });
    }
  });

  // PRICE LIST OVERRIDES
  router.get("/price-lists/by-product/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const companyId = (req as any).user?.company_id || 1;
      const result = await pool.query(
        `SELECT 
          pli.id, 
          pli.price_list_id, 
          pli.product_id, 
          pli.override_price, 
          pli.created_at,
          pl.name as price_list_name, 
          pl.description as price_list_description, 
          pl.is_active as price_list_active
        FROM price_list_items pli
        JOIN price_lists pl ON pl.id = pli.price_list_id
        WHERE pli.product_id = $1 AND (pl.company_id = $2 OR pl.company_id IS NULL OR $2 = 1)
        ORDER BY pl.name ASC`,
        [id, companyId]
      );
      res.json(result.rows);
    } catch (err) {
      console.error("Error fetching product price lists:", err);
      res.status(500).json({ error: "Failed to fetch product price lists" });
    }
  });

  router.get("/price-lists/all/:id/items", async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query("SELECT id, price_list_id, product_id, override_price, created_at FROM price_list_items WHERE price_list_id = $1", [id]);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch price list items" });
    }
  });

  router.post("/price-lists/all/:id/items", async (req, res) => {
    try {
      const { id } = req.params;
      const { product_id, override_price } = req.body;
      
      const result = await pool.query(
        `INSERT INTO price_list_items (price_list_id, product_id, override_price) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (price_list_id, product_id) 
         DO UPDATE SET override_price = EXCLUDED.override_price 
         RETURNING *`,
        [id, product_id, override_price]
      );
      res.json(result.rows[0]);
    } catch (err) {
      console.error("Error setting pricing list override:", err);
      res.status(500).json({ error: "Failed to save override price" });
    }
  });

  router.delete("/price-lists/all/:id/items/:productId", async (req, res) => {
    try {
      const { id, productId } = req.params;
      await pool.query(
        "DELETE FROM price_list_items WHERE price_list_id = $1 AND product_id = $2",
        [id, productId]
      );
      res.json({ success: true });
    } catch (err) {
      console.error("Error deleting price list item override:", err);
      res.status(500).json({ error: "Failed to delete override price" });
    }
  });

  // PROMO CODES
  router.get("/promo-codes/all", async (req, res) => {
    try {
      const companyId = (req as any).user?.company_id || 1;
      const cacheKey = `products:promos:${companyId}`;
      const cached = memoryCache.get(cacheKey);
      if (cached) return res.json(cached);

      const result = await pool.query("SELECT id, company_id, code, discount_type, discount_value, expiry_date, is_active, created_at FROM promo_codes WHERE company_id = $1 ORDER BY code ASC", [companyId]);
      memoryCache.set(cacheKey, result.rows, 300);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch promo codes" });
    }
  });

  router.post("/promo-codes/all", async (req, res) => {
    try {
      const { code, discount_type, discount_value, expiry_date, is_active } = req.body;
      const companyId = (req as any).user?.company_id || 1;

      const result = await pool.query(
        `INSERT INTO promo_codes (company_id, code, discount_type, discount_value, expiry_date, is_active) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [companyId, code, discount_type || 'percentage', discount_value, expiry_date, is_active !== false]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error("Error creating promo code:", err);
      res.status(500).json({ error: "Failed to create promo code" });
    }
  });

  router.put("/promo-codes/all/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { code, discount_type, discount_value, expiry_date, is_active } = req.body;
      const companyId = (req as any).user?.company_id || 1;

      const result = await pool.query(
        `UPDATE promo_codes SET 
          code = $1, discount_type = $2, discount_value = $3, expiry_date = $4, is_active = $5 
         WHERE id = $6 AND company_id = $7 RETURNING *`,
        [code, discount_type, discount_value, expiry_date, is_active, id, companyId]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: "Promo code not found" });
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: "Failed to update promo code" });
    }
  });

  router.delete("/promo-codes/all/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const companyId = (req as any).user?.company_id || 1;
      await pool.query("DELETE FROM promo_codes WHERE id = $1 AND company_id = $2", [id, companyId]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete promo code" });
    }
  });

  // =========================================================================
  // Products/Services Catalog Dynamic Schema Customizations
  // =========================================================================
  router.get("/schema-customizations/:pageKey", async (req, res) => {
    try {
      const companyId = (req as any).user?.company_id || 1;
      const pageKey = String(req.params.pageKey).toLowerCase().trim();

      const result = await pool.query(
        `SELECT schema_config FROM company_schema_customizations 
         WHERE company_id = $1 AND module_name = 'catalog' AND page_key = $2 LIMIT 1`,
        [companyId, pageKey]
      );

      if (result.rows.length > 0) {
        res.json({ success: true, page_key: pageKey, schema_config: result.rows[0].schema_config });
      } else {
        res.json({ success: true, page_key: pageKey, schema_config: null });
      }
    } catch (err) {
      console.error("Error fetching Catalog schema customizations:", err);
      res.status(500).json({ error: "Failed to fetch Catalog schema customizations" });
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
         VALUES ($1, 'catalog', $2, $3, CURRENT_TIMESTAMP)
         ON CONFLICT (company_id, module_name, page_key)
         DO UPDATE SET schema_config = EXCLUDED.schema_config, updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [companyId, pageKey, schema_config]
      );

      res.json({ success: true, page_key: pageKey, schema_config: result.rows[0].schema_config });
    } catch (err) {
      console.error("Error saving Catalog schema customizations:", err);
      res.status(500).json({ error: "Failed to save Catalog schema customizations" });
    }
  });

  router.delete("/schema-customizations/:pageKey", async (req, res) => {
    try {
      const companyId = (req as any).user?.company_id || 1;
      const pageKey = String(req.params.pageKey).toLowerCase().trim();

      await pool.query(
        `DELETE FROM company_schema_customizations 
         WHERE company_id = $1 AND module_name = 'catalog' AND page_key = $2`,
        [companyId, pageKey]
      );

      res.json({ success: true, message: `Reset schema customizations for ${pageKey}` });
    } catch (err) {
      console.error("Error resetting Catalog schema customizations:", err);
      res.status(500).json({ error: "Failed to reset Catalog schema customizations" });
    }
  });

  return router;
}
