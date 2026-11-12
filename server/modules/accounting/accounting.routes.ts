import express from "express";
import { pool } from "../../db/schema.js";
import { logAction } from "../../services/auditLogger.js";
import { memoryCache } from "../../utils/cache.js";

export default function accountingRoutes(wss: any) {
  const router = express.Router();

  // GET all accounting elements
  router.get("/", async (req, res) => {
    try {
      const companyId = (req as any).user?.company_id || 1;
      const cacheKey = `acct:summary:${companyId}`;
      const cached = memoryCache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }

      // Fetch all accounting data in parallel with explicit column projection
      const [
        coaResult,
        banksResult,
        journalsResult,
        invoicesResult,
        billsResult,
        statementsResult,
        notesResult
      ] = await Promise.all([
        pool.query("SELECT id, company_id, name_en, name_ar, type, is_active, parent_id, created_at FROM acct_coa WHERE company_id = $1 ORDER BY id ASC", [companyId]),
        pool.query("SELECT id, company_id, name, type, account_number, balance, currency, is_active FROM acct_banks_wallets WHERE company_id = $1 ORDER BY id ASC", [companyId]),
        pool.query("SELECT id, company_id, entry_number, date, description, lines, total_debit, total_credit, status, created_at FROM acct_journal_entries WHERE company_id = $1 ORDER BY date DESC LIMIT 200", [companyId]),
        pool.query("SELECT id, company_id, customer_name, customer_id, deal_id, date, due_date, items, subtotal, vat_amount, discount_amount, total_amount, status, reminder_sent, currency, exchange_rate, vat_number, po_number, payment_terms, notes FROM acct_invoices WHERE company_id = $1 ORDER BY date DESC LIMIT 200", [companyId]),
        pool.query("SELECT id, company_id, supplier_name, account_id, date, due_date, description, amount, vat_rate, vat_amount, total_amount, status, is_copq, ncr_id FROM acct_bills WHERE company_id = $1 ORDER BY date DESC LIMIT 200", [companyId]),
        pool.query("SELECT id, company_id, date, description, amount, reconciled, matched_journal_id FROM acct_bank_statements WHERE company_id = $1 ORDER BY date DESC LIMIT 200", [companyId]),
        pool.query("SELECT id, company_id, period, notes FROM acct_report_notes WHERE company_id = $1", [companyId])
      ]);

      const payload = {
        coa: coaResult.rows,
        banksAndWallets: banksResult.rows,
        journal: journalsResult.rows,
        invoices: invoicesResult.rows,
        bills: billsResult.rows,
        bankStatements: statementsResult.rows,
        reportNotes: notesResult.rows.map(row => row.notes).flat()
      };

      memoryCache.set(cacheKey, payload, 60);
      res.json(payload);
    } catch (err) {
      console.error("Error fetching accounting data:", err);
      res.status(500).json({ error: "Failed to fetch accounting data" });
    }
  });

  // POST sync entire state (Offline-first bidirectional sync / save)
  router.post("/sync", async (req, res) => {
    let client;
    try {
      const companyId = (req as any).user?.company_id || 1;
      const authUserId = (req as any).user?.id || 1;
      const {
        coa,
        banksAndWallets,
        journal,
        invoices,
        bills,
        bankStatements,
        reportNotes
      } = req.body;

      client = await pool.connect();
      await client.query("BEGIN");

      // 1. Sync CoA
      if (Array.isArray(coa)) {
        const activeIds = coa.map(item => item.id).filter(Boolean);
        if (activeIds.length > 0) {
          await client.query(
            "DELETE FROM acct_coa WHERE company_id = $1 AND id NOT IN (" + activeIds.map((_, i) => `$${i + 2}`).join(",") + ")",
            [companyId, ...activeIds]
          );
        } else {
          await client.query("DELETE FROM acct_coa WHERE company_id = $1", [companyId]);
        }
        for (const account of coa) {
          if (!account.id) continue;
          await client.query(
            `INSERT INTO acct_coa (id, company_id, name_en, name_ar, type, is_active, parent_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             ON CONFLICT (company_id, id) 
             DO UPDATE SET name_en = EXCLUDED.name_en, name_ar = EXCLUDED.name_ar, type = EXCLUDED.type, is_active = EXCLUDED.is_active, parent_id = EXCLUDED.parent_id`,
            [
              account.id,
              companyId,
              account.name_en,
              account.name_ar || null,
              account.type,
              account.is_active !== false,
              account.parent_id || null
            ]
          );
        }
      }

      // 2. Sync Banks & Wallets
      if (Array.isArray(banksAndWallets)) {
        const activeIds = banksAndWallets.map(item => item.id).filter(Boolean);
        if (activeIds.length > 0) {
          await client.query(
            "DELETE FROM acct_banks_wallets WHERE company_id = $1 AND id NOT IN (" + activeIds.map((_, i) => `$${i + 2}`).join(",") + ")",
            [companyId, ...activeIds]
          );
        } else {
          await client.query("DELETE FROM acct_banks_wallets WHERE company_id = $1", [companyId]);
        }
        for (const item of banksAndWallets) {
          if (!item.id) continue;
          await client.query(
            `INSERT INTO acct_banks_wallets (id, company_id, name_en, name_ar, type, currency, account_number, iban, bank_name, balance) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
             ON CONFLICT (company_id, id) 
             DO UPDATE SET name_en = EXCLUDED.name_en, name_ar = EXCLUDED.name_ar, type = EXCLUDED.type, currency = EXCLUDED.currency, account_number = EXCLUDED.account_number, iban = EXCLUDED.iban, bank_name = EXCLUDED.bank_name, balance = EXCLUDED.balance`,
            [
              item.id,
              companyId,
              item.name_en,
              item.name_ar || null,
              item.type,
              item.currency || "SAR",
              item.account_number || null,
              item.iban || null,
              item.bank_name || null,
              item.balance || 0
            ]
          );
        }
      }

      // 3. Sync Journal Entries
      if (Array.isArray(journal)) {
        const activeIds = journal.map(item => item.id).filter(Boolean);
        if (activeIds.length > 0) {
          await client.query(
            "DELETE FROM acct_journal_entries WHERE company_id = $1 AND id NOT IN (" + activeIds.map((_, i) => `$${i + 2}`).join(",") + ")",
            [companyId, ...activeIds]
          );
        } else {
          await client.query("DELETE FROM acct_journal_entries WHERE company_id = $1", [companyId]);
        }
        for (const entry of journal) {
          if (!entry.id) continue;
          await client.query(
            `INSERT INTO acct_journal_entries (id, company_id, date, reference, description, lines, is_system) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             ON CONFLICT (company_id, id) 
             DO UPDATE SET date = EXCLUDED.date, reference = EXCLUDED.reference, description = EXCLUDED.description, lines = EXCLUDED.lines, is_system = EXCLUDED.is_system`,
            [
              entry.id,
              companyId,
              entry.date,
              entry.reference || "",
              entry.description || "",
              JSON.stringify(entry.lines || []),
              entry.is_system || false
            ]
          );
        }
      }

      // 4. Sync Invoices
      if (Array.isArray(invoices)) {
        const activeIds = invoices.map(item => item.id).filter(Boolean);
        if (activeIds.length > 0) {
          await client.query(
            "DELETE FROM acct_invoices WHERE company_id = $1 AND id NOT IN (" + activeIds.map((_, i) => `$${i + 2}`).join(",") + ")",
            [companyId, ...activeIds]
          );
        } else {
          await client.query("DELETE FROM acct_invoices WHERE company_id = $1", [companyId]);
        }
        for (const invoice of invoices) {
          if (!invoice.id) continue;
          await client.query(
            `INSERT INTO acct_invoices (
              id, company_id, customer_name, customer_id, deal_id, date, due_date, items, 
              subtotal, vat_amount, discount_amount, total_amount, status, reminder_sent, 
              currency, exchange_rate, vat_number, po_number, payment_terms, notes
             ) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) 
             ON CONFLICT (company_id, id) 
             DO UPDATE SET 
              customer_name = EXCLUDED.customer_name, customer_id = EXCLUDED.customer_id, deal_id = EXCLUDED.deal_id, 
              date = EXCLUDED.date, due_date = EXCLUDED.due_date, items = EXCLUDED.items, subtotal = EXCLUDED.subtotal, 
              vat_amount = EXCLUDED.vat_amount, discount_amount = EXCLUDED.discount_amount, total_amount = EXCLUDED.total_amount, 
              status = EXCLUDED.status, reminder_sent = EXCLUDED.reminder_sent, currency = EXCLUDED.currency, 
              exchange_rate = EXCLUDED.exchange_rate, vat_number = EXCLUDED.vat_number, po_number = EXCLUDED.po_number, 
              payment_terms = EXCLUDED.payment_terms, notes = EXCLUDED.notes`,
            [
              invoice.id,
              companyId,
              invoice.customer_name,
              invoice.customer_id ? String(invoice.customer_id) : null,
              invoice.deal_id ? String(invoice.deal_id) : null,
              invoice.date,
              invoice.due_date,
              JSON.stringify(invoice.items || []),
              invoice.subtotal || 0,
              invoice.vat_amount || 0,
              invoice.discount_amount || 0,
              invoice.total_amount || 0,
              invoice.status,
              invoice.reminder_sent || false,
              invoice.currency || "SAR",
              invoice.exchange_rate || 1,
              invoice.vat_number || null,
              invoice.po_number || null,
              invoice.payment_terms || null,
              invoice.notes || null
            ]
          );
        }
      }

      // 5. Sync Bills
      if (Array.isArray(bills)) {
        const activeIds = bills.map(item => item.id).filter(Boolean);
        if (activeIds.length > 0) {
          await client.query(
            "DELETE FROM acct_bills WHERE company_id = $1 AND id NOT IN (" + activeIds.map((_, i) => `$${i + 2}`).join(",") + ")",
            [companyId, ...activeIds]
          );
        } else {
          await client.query("DELETE FROM acct_bills WHERE company_id = $1", [companyId]);
        }
        for (const bill of bills) {
          if (!bill.id) continue;
          await client.query(
            `INSERT INTO acct_bills (id, company_id, supplier_name, account_id, date, due_date, description, amount, vat_rate, vat_amount, total_amount, status, is_copq, ncr_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
             ON CONFLICT (company_id, id) 
             DO UPDATE SET supplier_name = EXCLUDED.supplier_name, account_id = EXCLUDED.account_id, date = EXCLUDED.date, due_date = EXCLUDED.due_date, description = EXCLUDED.description, amount = EXCLUDED.amount, vat_rate = EXCLUDED.vat_rate, vat_amount = EXCLUDED.vat_amount, total_amount = EXCLUDED.total_amount, status = EXCLUDED.status, is_copq = EXCLUDED.is_copq, ncr_id = EXCLUDED.ncr_id`,
            [
              bill.id,
              companyId,
              bill.supplier_name,
              bill.account_id,
              bill.date,
              bill.due_date,
              bill.description || "",
              bill.amount || 0,
              bill.vat_rate || 15,
              bill.vat_amount || 0,
              bill.total_amount || 0,
              bill.status,
              bill.is_copq || false,
              bill.ncr_id || null
            ]
          );
        }
      }

      // 6. Sync Bank Statements
      if (Array.isArray(bankStatements)) {
        const activeIds = bankStatements.map(item => item.id).filter(Boolean);
        if (activeIds.length > 0) {
          await client.query(
            "DELETE FROM acct_bank_statements WHERE company_id = $1 AND id NOT IN (" + activeIds.map((_, i) => `$${i + 2}`).join(",") + ")",
            [companyId, ...activeIds]
          );
        } else {
          await client.query("DELETE FROM acct_bank_statements WHERE company_id = $1", [companyId]);
        }
        for (const statement of bankStatements) {
          if (!statement.id) continue;
          await client.query(
            `INSERT INTO acct_bank_statements (id, company_id, date, description, amount, reconciled, matched_journal_id) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) 
             ON CONFLICT (company_id, id) 
             DO UPDATE SET date = EXCLUDED.date, description = EXCLUDED.description, amount = EXCLUDED.amount, reconciled = EXCLUDED.reconciled, matched_journal_id = EXCLUDED.matched_journal_id`,
            [
              statement.id,
              companyId,
              statement.date,
              statement.description || "",
              statement.amount || 0,
              statement.reconciled || false,
              statement.matched_journal_id || null
            ]
          );
        }
      }

      // 7. Sync Report Notes (we can group them all under a single report notes row or per period)
      if (Array.isArray(reportNotes)) {
        // Report notes has id, type, note_en, note_ar
        await client.query(
          `INSERT INTO acct_report_notes (company_id, period, notes) 
           VALUES ($1, $2, $3) 
           ON CONFLICT (company_id, period) 
           DO UPDATE SET notes = EXCLUDED.notes`,
          [
            companyId,
            "universal",
            JSON.stringify(reportNotes)
          ]
        );
      }

      await client.query("COMMIT");
      memoryCache.delete(`acct:summary:${companyId}`);
      await logAction(authUserId, 'UPDATE', 'AccountingData', 0, { message: "Synced accounting modules database payload", company_id: companyId });

      // Broadcast update to other active visual sessions
      wss.clients.forEach((c: any) => {
        c.send(JSON.stringify({ type: "MODULE_UPDATED", table: "accounting" }));
      });

      res.json({ success: true, message: "Accounting module data successfully synchronized with Postgres / Supabase" });
    } catch (err) {
      if (client) await client.query("ROLLBACK");
      console.error("Error database syncing accounting:", err);
      res.status(500).json({ error: "Failed to synchronize accounting modules database" });
    } finally {
      if (client) client.release();
    }
  });

  return router;
}
