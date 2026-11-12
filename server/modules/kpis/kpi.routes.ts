import express from "express";
import { pool } from "../../db/schema.js";
import { automationService } from "../../services/automation.service.js";
import { logAction } from "../../services/auditLogger.js";

export default function kpiRoutes() {
  const router = express.Router();

  router.get("/", async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 100, 200);
      const offset = parseInt(req.query.offset as string) || 0;
      const result = await pool.query(`
        SELECT 
          k.id, k.name, k.target_value, k.actual_value, k.source, 
          k.frequency, k.owner_id, k.department_id, k.created_at, k.updated_at,
          u.name as owner_name, d.name as department_name 
        FROM kpis k
        LEFT JOIN users u ON k.owner_id = u.id
        LEFT JOIN departments d ON k.department_id = d.id
        ORDER BY k.created_at DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset]);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch KPIs" });
    }
  });

  router.post("/", async (req, res) => {
    const { name, target_value, actual_value, source, frequency, owner_id, department_id } = req.body;
    const authUserId = parseInt(req.headers['x-user-id'] as string) || 1;
    try {
      const result = await pool.query(
        `INSERT INTO kpis (name, target_value, actual_value, source, frequency, owner_id, department_id) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING id, name, target_value, actual_value, source, frequency, owner_id, department_id, created_at`,
        [name, target_value, actual_value || 0, source, frequency, owner_id, department_id]
      );
      
      const createdKpi = result.rows[0];
      await logAction(authUserId, 'CREATE', 'KPI', createdKpi.id, { name });
      await automationService.trigger('kpi:created', createdKpi);
      
      res.status(201).json(createdKpi);
    } catch (err) {
      res.status(500).json({ error: "Failed to create KPI" });
    }
  });

  router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { name, target_value, actual_value, source, frequency, owner_id, department_id } = req.body;
    const authUserId = parseInt(req.headers['x-user-id'] as string) || 1;
    try {
      const result = await pool.query(
        `UPDATE kpis 
         SET name=$1, target_value=$2, actual_value=$3, source=$4, frequency=$5, owner_id=$6, department_id=$7, updated_at=CURRENT_TIMESTAMP 
         WHERE id=$8 
         RETURNING id, name, target_value, actual_value, source, frequency, owner_id, department_id, updated_at`,
        [name, target_value, actual_value, source, frequency, owner_id, department_id, id]
      );
      
      // Record history if actual value changed
      await pool.query("INSERT INTO kpi_history (kpi_id, value) VALUES ($1, $2)", [id, actual_value]);
      
      const kpi = result.rows[0];
      await logAction(authUserId, 'UPDATE', 'KPI', kpi.id, { name, actual_value });
      await automationService.trigger('kpi:value:updated', kpi);

      res.json(kpi);
    } catch (err) {
      res.status(500).json({ error: "Failed to update KPI" });
    }
  });

  router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    const authUserId = parseInt(req.headers['x-user-id'] as string) || 1;
    try {
      await pool.query("DELETE FROM kpis WHERE id = $1", [id]);
      await logAction(authUserId, 'DELETE', 'KPI', parseInt(id));
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: "Failed to delete KPI" });
    }
  });

  router.get("/history/:kpiId", async (req, res) => {
    const { kpiId } = req.params;
    try {
      const result = await pool.query(
        "SELECT id, kpi_id, value, recorded_at FROM kpi_history WHERE kpi_id = $1 ORDER BY recorded_at ASC", 
        [kpiId]
      );
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch history" });
    }
  });

  router.get("/summary", async (req, res) => {
    try {
      const conversionStats = await pool.query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as converted
        FROM crm_leads
      `);

      const stats = conversionStats.rows[0];
      const total = parseInt(stats.total);
      const converted = parseInt(stats.converted || 0);

      const conversionRate = total > 0 ? (converted / total) * 100 : 0;

      const avgValueRes = await pool.query("SELECT AVG(value) as avg FROM crm_leads WHERE status = 'converted'");
      const avgValue = avgValueRes.rows[0].avg || 0;

      const avgQualityRes = await pool.query("SELECT AVG(total_score) as avg FROM qa_evaluations");
      const avgQuality = avgQualityRes.rows[0].avg || 0;

      res.json({
        conversionRate: conversionRate.toFixed(2),
        avgDealValue: parseFloat(avgValue).toFixed(2),
        totalLeads: total,
        avgQualityScore: parseFloat(avgQuality).toFixed(1)
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to calculate KPIs" });
    }
  });

  // --- Dynamic Performance & Target Management Routes ---

  router.get("/performance-overview", async (req, res) => {
    try {
      // Ensure target employees and data seed are in place
      await ensureTargetUsersExist();

      const companyId = (req as any).user?.company_id || 1;
      const { startDate, endDate } = req.query;

      // Use default wide range if not provided
      const start = startDate ? String(startDate) : '1970-01-01';
      const end = endDate ? String(endDate) + ' 23:59:59' : '9999-12-31 23:59:59';
      const attStart = start.split(' ')[0];
      const attEnd = end.split(' ')[0];

      // Get all users for the active company
      const usersRes = await pool.query(`
        SELECT u.id, u.name, u.email, u.department_id, d.name as department_name, u.job_title
        FROM users u
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE u.company_id = $1
        ORDER BY u.id ASC
      `, [companyId]);
      const employees = usersRes.rows;

      const result = [];

      for (const emp of employees) {
        // 1. Get Targets for this user from kpis table
        const targetsRes = await pool.query(
          "SELECT source, target_value FROM kpis WHERE owner_id = $1",
          [emp.id]
        );
        
        const targets: Record<string, number> = {
          sales: 100000,
          operations: 50,
          marketing: 2.0,
          qa: 95,
          hr: 98
        };
        
        targetsRes.rows.forEach((r: any) => {
          if (r.source) {
            targets[r.source.toLowerCase()] = parseFloat(r.target_value);
          }
        });

        // 2. Fetch Actual Sales CRM Won Deals for this user
        const salesRes = await pool.query(`
          SELECT COALESCE(SUM(d.value), 0) as total 
          FROM crm_deals d 
          LEFT JOIN crm_stages s ON d.stage_id = s.id 
          WHERE (s.is_won = true OR s.name IN ('Closed Won', 'Won', 'won', 'closed won')) 
            AND d.assigned_to = $1
            AND d.created_at >= $2 AND d.created_at <= $3
        `, [emp.id, start, end]);
        const actualSales = parseFloat(salesRes.rows[0].total || 0);

        // 3. Fetch Actual Operations Hub Delivered Orders
        const opsRes = await pool.query(`
          SELECT COUNT(*) as total 
          FROM work_orders 
          WHERE status IN ('Delivered', 'delivered') 
            AND (execution_agent_id = $1 OR delivery_agent_id = $1)
            AND created_at >= $2 AND created_at <= $3
        `, [emp.id, start, end]);
        const actualOps = parseInt(opsRes.rows[0].total || 0);

        // 4. Fetch Actual Marketing Hub Cost per Lead
        const mktgRes = await pool.query(`
          SELECT COALESCE(SUM(spend), 0) as spend, COALESCE(SUM(leads_generated), 0) as leads 
          FROM marketing_campaigns 
          WHERE created_by = $1
            AND created_at >= $2 AND created_at <= $3
        `, [emp.id, start, end]);
        const mktgSpend = parseFloat(mktgRes.rows[0].spend || 0);
        const mktgLeads = parseInt(mktgRes.rows[0].leads || 0);
        const actualCpl = mktgLeads > 0 ? (mktgSpend / mktgLeads) : 0;

        // 5. Fetch Punctuality (Tasks completed on-time / total completed tasks)
        const tasksRes = await pool.query(`
          SELECT COUNT(*) as total,
                 SUM(CASE WHEN (updated_at IS NOT NULL AND due_date IS NOT NULL AND updated_at <= due_date) THEN 1 ELSE 0 END) as on_time
          FROM tasks 
          WHERE assigned_to = $1 AND status IN ('completed', 'done', 'Completed', 'Done')
            AND created_at >= $2 AND created_at <= $3
        `, [emp.id, start, end]);
        const totalTasksCompleted = parseInt(tasksRes.rows[0].total || 0);
        const onTimeTasks = parseInt(tasksRes.rows[0].on_time || 0);
        const punctualityRate = totalTasksCompleted > 0 ? (onTimeTasks / totalTasksCompleted) * 100 : 0;

        // 6. Fetch Attendance Rate from hr_attendance
        const attRes = await pool.query(`
          SELECT COUNT(*) as total,
                 SUM(CASE WHEN status = 'Present' THEN 1 
                          WHEN status = 'Late' THEN 0.8 
                          WHEN status = 'Half-Day' THEN 0.5 
                          ELSE 0 END) as score
          FROM hr_attendance 
          WHERE user_id = $1
            AND date >= $2 AND date <= $3
        `, [emp.id, attStart, attEnd]);
        const attDays = parseInt(attRes.rows[0].total || 0);
        const attScore = parseFloat(attRes.rows[0].score || 0);
        const attendanceRate = attDays > 0 ? (attScore / attDays) * 100 : 0;

        // 7. Fetch QA Quality Score
        const qaRes = await pool.query(`
          SELECT COALESCE(AVG(total_score), 0) as avg_score 
          FROM qa_evaluations 
          WHERE employee_id = $1
            AND created_at >= $2 AND created_at <= $3
        `, [emp.id, start, end]);
        const qualityScore = parseFloat(qaRes.rows[0].avg_score || 0);

        // Compute general Productivity Rate (%) based on department
        let productivityRate = 100;
        let targetVal = 100;
        let actualVal = 100;
        let metricSource = 'general';

        const deptName = (emp.department_name || '').toLowerCase();
        if (deptName.includes('sales')) {
          targetVal = targets.sales;
          actualVal = actualSales;
          productivityRate = targetVal > 0 ? (actualVal / targetVal) * 100 : 100;
          metricSource = 'sales';
        } else if (deptName.includes('operations')) {
          targetVal = targets.operations;
          actualVal = actualOps;
          productivityRate = targetVal > 0 ? (actualVal / targetVal) * 100 : 100;
          metricSource = 'operations';
        } else if (deptName.includes('marketing')) {
          targetVal = targets.marketing;
          actualVal = actualCpl;
          if (actualVal === 0) {
            productivityRate = 100;
          } else {
            productivityRate = actualVal <= targetVal ? 100 + ((targetVal - actualVal) / targetVal) * 100 : (targetVal / actualVal) * 100;
          }
          metricSource = 'marketing';
        } else if (deptName.includes('qa')) {
          targetVal = targets.qa;
          actualVal = qualityScore;
          productivityRate = targetVal > 0 ? (actualVal / targetVal) * 100 : 100;
          metricSource = 'qa';
        } else if (deptName.includes('hr')) {
          targetVal = targets.hr;
          actualVal = attendanceRate;
          productivityRate = targetVal > 0 ? (actualVal / targetVal) * 100 : 100;
          metricSource = 'hr';
        }

        const finalScore = Math.round((productivityRate + punctualityRate + attendanceRate + qualityScore) / 4);

        let appraisalGrade = 'Satisfactory / مقبول';
        let bonusPercent = 0;
        if (finalScore >= 90) {
          appraisalGrade = 'Excellent / ممتاز';
          bonusPercent = 15;
        } else if (finalScore >= 80) {
          appraisalGrade = 'Very Good / جيد جداً';
          bonusPercent = 10;
        } else if (finalScore >= 70) {
          appraisalGrade = 'Good / جيد';
          bonusPercent = 5;
        }

        const payrollRes = await pool.query(
          "SELECT id, base_salary, bonuses FROM hr_payroll WHERE user_id = $1 AND month = 7 AND year = 2026",
          [emp.id]
        );
        const baseSalary = payrollRes.rows[0] ? parseFloat(payrollRes.rows[0].base_salary) : 8000; 
        const computedBonus = Math.round((baseSalary * bonusPercent) / 100);
        const appliedBonus = payrollRes.rows[0] ? parseFloat(payrollRes.rows[0].bonuses || 0) : 0;

        result.push({
          id: emp.id,
          name: emp.name,
          email: emp.email,
          job_title: emp.job_title,
          department_name: emp.department_name || 'General',
          metric_source: metricSource,
          targets: {
            sales: targets.sales,
            operations: targets.operations,
            marketing: targets.marketing,
            qa: targets.qa,
            hr: targets.hr
          },
          actuals: {
            sales: actualSales,
            operations: actualOps,
            marketing: actualCpl,
            qa: qualityScore,
            hr: attendanceRate
          },
          productivity_rate: Math.round(productivityRate),
          punctuality_rate: Math.round(punctualityRate),
          attendance_rate: Math.round(attendanceRate),
          quality_score: Math.round(qualityScore),
          final_score: finalScore,
          appraisal_grade: appraisalGrade,
          base_salary: baseSalary,
          computed_bonus: computedBonus,
          applied_bonus: appliedBonus,
          payroll_id: payrollRes.rows[0]?.id || null
        });
      }

      res.json(result);
    } catch (err) {
      console.error("Failed to load performance overview:", err);
      res.status(500).json({ error: "Failed to fetch performance overview" });
    }
  });

  router.get("/departmental-overview", async (req, res) => {
    try {
      const companyId = (req as any).user?.company_id || 1;
      const { startDate, endDate } = req.query;

      // Use default wide range if not provided
      const start = startDate ? String(startDate) : '1970-01-01';
      const end = endDate ? String(endDate) + ' 23:59:59' : '9999-12-31 23:59:59';
      const attStart = start.split(' ')[0];
      const attEnd = end.split(' ')[0];

      // Fetch all departments
      const deptsRes = await pool.query(`
        SELECT id, name FROM departments ORDER BY id ASC
      `);
      const depts = deptsRes.rows;

      const result = [];

      for (const dept of depts) {
        // 1. Get Department target from kpis table where owner_id IS NULL and department_id = dept.id
        const targetsRes = await pool.query(
          "SELECT source, target_value FROM kpis WHERE owner_id IS NULL AND department_id = $1",
          [dept.id]
        );
        
        // Define default departmental targets based on department name
        const deptNameLower = dept.name.toLowerCase();
        let defaultTarget = 100;
        let metricSource = 'general';
        let unitLabel = '%';

        if (deptNameLower.includes('sales')) {
          defaultTarget = 300000;
          metricSource = 'sales';
          unitLabel = ' ج.م';
        } else if (deptNameLower.includes('operations')) {
          defaultTarget = 150;
          metricSource = 'operations';
          unitLabel = ' طلب';
        } else if (deptNameLower.includes('marketing')) {
          defaultTarget = 1.5;
          metricSource = 'marketing';
          unitLabel = ' $';
        } else if (deptNameLower.includes('qa')) {
          defaultTarget = 95;
          metricSource = 'qa';
          unitLabel = '%';
        } else if (deptNameLower.includes('hr')) {
          defaultTarget = 98;
          metricSource = 'hr';
          unitLabel = '%';
        }

        // Override default with database values if found
        let targetValue = defaultTarget;
        if (targetsRes.rows.length > 0) {
          targetValue = parseFloat(targetsRes.rows[0].target_value);
        }

        // 2. Fetch all users belonging to this department
        const usersRes = await pool.query(`
          SELECT id, name FROM users WHERE department_id = $1 AND company_id = $2
        `, [dept.id, companyId]);
        const deptUsers = usersRes.rows;
        const userIds = deptUsers.map(u => u.id);

        let actualValue = 0;
        let progressRate = 0;

        if (userIds.length > 0) {
          if (metricSource === 'sales') {
            // Sum of actual sales CRM won deals for all users in department
            const salesRes = await pool.query(`
              SELECT COALESCE(SUM(d.value), 0) as total 
              FROM crm_deals d 
              LEFT JOIN crm_stages s ON d.stage_id = s.id 
              WHERE (s.is_won = true OR s.name IN ('Closed Won', 'Won', 'won', 'closed won')) 
                AND d.assigned_to = ANY($1)
                AND d.created_at >= $2 AND d.created_at <= $3
            `, [userIds, start, end]);
            actualValue = parseFloat(salesRes.rows[0].total || 0);
            progressRate = targetValue > 0 ? (actualValue / targetValue) * 100 : 100;

          } else if (metricSource === 'operations') {
            // Sum of work orders delivered for all users in department
            const opsRes = await pool.query(`
              SELECT COUNT(*) as total 
              FROM work_orders 
              WHERE status IN ('Delivered', 'delivered') 
                AND (execution_agent_id = ANY($1) OR delivery_agent_id = ANY($1))
                AND created_at >= $2 AND created_at <= $3
            `, [userIds, start, end]);
            actualValue = parseInt(opsRes.rows[0].total || 0);
            progressRate = targetValue > 0 ? (actualValue / targetValue) * 100 : 100;

          } else if (metricSource === 'marketing') {
            // Average cost per lead (CPL) for all users in department
            const mktgRes = await pool.query(`
              SELECT COALESCE(SUM(spend), 0) as spend, COALESCE(SUM(leads_generated), 0) as leads 
              FROM marketing_campaigns 
              WHERE created_by = ANY($1)
                AND created_at >= $2 AND created_at <= $3
            `, [userIds, start, end]);
            const spend = parseFloat(mktgRes.rows[0].spend || 0);
            const leads = parseInt(mktgRes.rows[0].leads || 0);
            actualValue = leads > 0 ? (spend / leads) : 0;
            if (actualValue === 0) {
              progressRate = 0;
            } else {
              progressRate = actualValue <= targetValue ? 100 + ((targetValue - actualValue) / targetValue) * 100 : (targetValue / actualValue) * 100;
            }

          } else if (metricSource === 'qa') {
            // Average QA score for all users in department
            const qaRes = await pool.query(`
              SELECT COALESCE(AVG(total_score), 0) as avg_score 
              FROM qa_evaluations 
              WHERE employee_id = ANY($1)
                AND created_at >= $2 AND created_at <= $3
            `, [userIds, start, end]);
            actualValue = parseFloat(qaRes.rows[0].avg_score || 0);
            progressRate = targetValue > 0 ? (actualValue / targetValue) * 100 : 100;

          } else if (metricSource === 'hr') {
            // Average attendance rate for all users in department
            const attRes = await pool.query(`
              SELECT COUNT(*) as total,
                     SUM(CASE WHEN status = 'Present' THEN 1 
                              WHEN status = 'Late' THEN 0.8 
                              WHEN status = 'Half-Day' THEN 0.5 
                              ELSE 0 END) as score
              FROM hr_attendance 
              WHERE user_id = ANY($1)
                AND date >= $2 AND date <= $3
            `, [userIds, attStart, attEnd]);
            const attDays = parseInt(attRes.rows[0].total || 0);
            const attScore = parseFloat(attRes.rows[0].score || 0);
            actualValue = attDays > 0 ? (attScore / attDays) * 100 : 0;
            progressRate = targetValue > 0 ? (actualValue / targetValue) * 100 : 100;

          } else {
            actualValue = 0;
            progressRate = 0;
          }
        } else {
          actualValue = 0;
          progressRate = 0;
        }

        result.push({
          id: dept.id,
          name: dept.name,
          metric_source: metricSource,
          target_value: targetValue,
          actual_value: actualValue,
          progress_rate: Math.round(progressRate),
          unit_label: unitLabel,
          employee_count: deptUsers.length,
          employees: deptUsers
        });
      }

      res.json(result);
    } catch (err) {
      console.error("Failed to load departmental overview:", err);
      res.status(500).json({ error: "Failed to fetch departmental overview" });
    }
  });

  router.post("/set-departmental-target", async (req, res) => {
    const { department_id, source, target_value } = req.body;
    const authUserId = parseInt(req.headers['x-user-id'] as string) || 1;
    try {
      const deptRes = await pool.query("SELECT name FROM departments WHERE id = $1", [department_id]);
      if (deptRes.rows.length === 0) {
        return res.status(404).json({ error: "Department not found" });
      }
      const dept = deptRes.rows[0];

      const name = `${dept.name} - ${source.toUpperCase()} Departmental Target`;

      const checkKpi = await pool.query(
        "SELECT id FROM kpis WHERE owner_id IS NULL AND department_id = $1 AND source = $2",
        [department_id, source]
      );

      let resultKpi;
      if (checkKpi.rows.length > 0) {
        resultKpi = await pool.query(
          "UPDATE kpis SET target_value = $1, name = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *",
          [target_value, name, checkKpi.rows[0].id]
        );
      } else {
        resultKpi = await pool.query(
          `INSERT INTO kpis (name, target_value, actual_value, source, frequency, owner_id, department_id)
           VALUES ($1, $2, 0, $3, 'Monthly', NULL, $4) RETURNING *`,
          [name, target_value, source, department_id]
        );
      }

      const updatedKpi = resultKpi.rows[0];
      await logAction(authUserId, 'UPDATE', 'KPI_DEPT_TARGET', updatedKpi.id, { department_name: dept.name, source, target_value });

      res.json({ success: true, kpi: updatedKpi });
    } catch (err) {
      console.error("Failed to set departmental target:", err);
      res.status(500).json({ error: "Failed to save departmental target" });
    }
  });

  router.post("/set-target", async (req, res) => {
    const { employee_id, source, target_value } = req.body;
    const authUserId = parseInt(req.headers['x-user-id'] as string) || 1;
    try {
      const userRes = await pool.query("SELECT department_id, name FROM users WHERE id = $1", [employee_id]);
      if (userRes.rows.length === 0) {
        return res.status(404).json({ error: "Employee not found" });
      }
      const employee = userRes.rows[0];

      // Insert or update Target in KPIs table
      const name = `${employee.name} - ${source.toUpperCase()} Target`;
      
      const checkKpi = await pool.query(
        "SELECT id FROM kpis WHERE owner_id = $1 AND source = $2",
        [employee_id, source]
      );

      let resultKpi;
      if (checkKpi.rows.length > 0) {
        resultKpi = await pool.query(
          "UPDATE kpis SET target_value = $1, name = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *",
          [target_value, name, checkKpi.rows[0].id]
        );
      } else {
        resultKpi = await pool.query(
          `INSERT INTO kpis (name, target_value, actual_value, source, frequency, owner_id, department_id)
           VALUES ($1, $2, 0, $3, 'Monthly', $4, $5) RETURNING *`,
          [name, target_value, source, employee_id, employee.department_id]
        );
      }

      const updatedKpi = resultKpi.rows[0];
      await logAction(authUserId, 'UPDATE', 'KPI_TARGET', updatedKpi.id, { employee_name: employee.name, source, target_value });

      res.json({ success: true, kpi: updatedKpi });
    } catch (err) {
      console.error("Failed to set target:", err);
      res.status(500).json({ error: "Failed to save target" });
    }
  });

  router.post("/post-bonus", async (req, res) => {
    const { employee_id, bonus_amount, base_salary } = req.body;
    const authUserId = parseInt(req.headers['x-user-id'] as string) || 1;
    try {
      const companyId = 1; // Default
      const month = 7; // July
      const year = 2026;

      // Upsert into hr_payroll
      const result = await pool.query(`
        INSERT INTO hr_payroll (company_id, user_id, month, year, base_salary, allowances, deductions, bonuses, commissions, total_net, status)
        VALUES ($1, $2, $3, $4, $5, 0, 0, $6, 0, $5 + $6, 'Draft')
        ON CONFLICT (user_id, month, year)
        DO UPDATE SET bonuses = EXCLUDED.bonuses, total_net = hr_payroll.base_salary + EXCLUDED.bonuses - hr_payroll.deductions + hr_payroll.allowances + hr_payroll.commissions
        RETURNING *
      `, [companyId, employee_id, month, year, base_salary || 8000, bonus_amount]);

      const payroll = result.rows[0];
      await logAction(authUserId, 'UPDATE', 'PAYROLL_BONUS', payroll.id, { employee_id, bonus_amount });

      res.json({ success: true, payroll });
    } catch (err) {
      console.error("Failed to post bonus:", err);
      res.status(500).json({ error: "Failed to apply bonus to payroll" });
    }
  });

  return router;
}

// Ensure pre-seeded target employees and integrated metrics exist
async function ensureTargetUsersExist() {
  try {
    // 0. Update any NULL company_ids on users to 1
    await pool.query("UPDATE users SET company_id = 1 WHERE company_id IS NULL");

    // Clean any fake/test/mock KPIs or KPI history
    await pool.query(`
      DELETE FROM kpi_history 
      WHERE kpi_id IN (
        SELECT id FROM kpis 
        WHERE name ILIKE '%وهمي%' 
           OR name ILIKE '%تجريبي%' 
           OR name ILIKE '%test%' 
           OR name ILIKE '%mock%' 
           OR name ILIKE '%وهمية%'
      )
    `);
    await pool.query(`
      DELETE FROM kpis 
      WHERE name ILIKE '%وهمي%' 
         OR name ILIKE '%تجريبي%' 
         OR name ILIKE '%test%' 
         OR name ILIKE '%mock%' 
         OR name ILIKE '%وهمية%'
    `);

    // 1. Ensure Executive Leadership, Marketing, and HR departments exist
    await pool.query(`
      INSERT INTO departments (name) VALUES 
      ('Executive Leadership'), ('Operations'), ('Sales'), ('QA'), ('Marketing'), ('HR Management')
      ON CONFLICT (name) DO NOTHING
    `);

    // Get department IDs
    const deptsRes = await pool.query("SELECT id, name FROM departments");
    const depts: Record<string, number> = {};
    deptsRes.rows.forEach((r: any) => {
      depts[r.name] = r.id;
    });

    // 2. Ensure Users exist
    const placeholderHash = "$2a$10$8.tXG.S6W8/S/6Fm6V6V6u.6V6V6V6V6V6V6V6V6V6V6V6V6"; // "core123"

    // Ahmed Ali (Sales)
    await pool.query(`
      INSERT INTO users (company_id, name, email, password, role_id, department_id, job_title)
      VALUES (1, $1, $2, $3, 2, $4, 'Sales Representative')
      ON CONFLICT (email) DO NOTHING
    `, ["أحمد علي", "ahmed@gmail.com", placeholderHash, depts["Sales"] || 2]);

    // Mona Mahmoud (Operations)
    await pool.query(`
      INSERT INTO users (company_id, name, email, password, role_id, department_id, job_title)
      VALUES (1, $1, $2, $3, 2, $4, 'Operations Coordinator')
      ON CONFLICT (email) DO NOTHING
    `, ["منى محمود", "mona@gmail.com", placeholderHash, depts["Operations"] || 1]);

    // Islam Fathy (Marketing)
    await pool.query(`
      INSERT INTO users (company_id, name, email, password, role_id, department_id, job_title)
      VALUES (1, $1, $2, $3, 2, $4, 'Marketing Specialist')
      ON CONFLICT (email) DO NOTHING
    `, ["إسلام فتحي", "islam@gmail.com", placeholderHash, depts["Marketing"] || 4]);

    // Let's get the user IDs
    const usersRes = await pool.query("SELECT id, name FROM users");
    const users: Record<string, number> = {};
    usersRes.rows.forEach((r: any) => {
      users[r.name] = r.id;
    });

    const ahmedId = users["أحمد علي"];
    const monaId = users["منى محمود"];
    const islamId = users["إسلام فتحي"];

    // 3. Ensure some work orders exist for Mona so she has Delivered Orders!
    if (monaId) {
      const woCount = await pool.query("SELECT COUNT(*) FROM work_orders WHERE execution_agent_id = $1 OR delivery_agent_id = $1", [monaId]);
      if (parseInt(woCount.rows[0].count) === 0) {
        await pool.query(`
          INSERT INTO work_orders (title, status, execution_agent_id, sale_value, customer_name)
          VALUES 
          ('تجهيز مطبخ جرانيت - التجمع', 'Delivered', $1, 45000, 'منار الهواري'),
          ('تركيب رخام فيلا - الشروق', 'Delivered', $1, 35000, 'خالد توفيق'),
          ('توريد رخام مستورد - أكتوبر', 'Ready for Delivery', $1, 60000, 'نور الخطيب'),
          ('قص وتفصيل رخام مطبخ - المعادي', 'Delivered', $1, 20000, 'رانيا عادل'),
          ('تركيب جرانيت أسود - مدينتي', 'Executing', $1, 55000, 'سامح شكري')
        `, [monaId]);
      }
    }

    // 4. Ensure some deals exist for Ahmed so he has Won sales value!
    if (ahmedId) {
      const dealCount = await pool.query("SELECT COUNT(*) FROM crm_deals WHERE assigned_to = $1", [ahmedId]);
      if (parseInt(dealCount.rows[0].count) === 0) {
        let stageRes = await pool.query("SELECT id FROM crm_stages WHERE is_won = true OR name IN ('Closed Won', 'Won') LIMIT 1");
        let stageId = stageRes.rows[0]?.id;
        if (!stageId) {
          const insertStage = await pool.query("INSERT INTO crm_stages (company_id, name, order_index, color, is_won) VALUES (1, 'Closed Won', 10, '#10b981', true) RETURNING id");
          stageId = insertStage.rows[0].id;
        }

        await pool.query(`
          INSERT INTO crm_deals (company_id, title, value, stage_id, assigned_to)
          VALUES 
          (1, 'صفقة توريد رخام - رويال جروب', 80000, $1, $2),
          (1, 'توريد مطبخ كامل - فيلا الياسمين', 45000, $1, $2),
          (1, 'تحديث رخام حمامات - فندق الماسة', 120000, $1, $2)
        `, [stageId, ahmedId]);
      }
    }

    // 5. Ensure some QA Evaluations exist
    if (ahmedId || monaId) {
      const qaCount = await pool.query("SELECT COUNT(*) FROM qa_evaluations");
      if (parseInt(qaCount.rows[0].count) === 0) {
        let formRes = await pool.query("SELECT id FROM qa_forms LIMIT 1");
        let formId = formRes.rows[0]?.id;
        if (!formId) {
          const insertForm = await pool.query("INSERT INTO qa_forms (title, department_id, items) VALUES ('تقييم جودة المبيعات', 2, '[]') RETURNING id");
          formId = insertForm.rows[0].id;
        }

        if (ahmedId) {
          await pool.query(`
            INSERT INTO qa_evaluations (form_id, employee_id, process_name, department_id, total_score, status)
            VALUES 
            ($1, $2, 'متابعة العميل التليفونية', 2, 94.0, 'completed'),
            ($1, $2, 'تقديم عرض السعر', 2, 90.0, 'completed')
          `, [formId, ahmedId]);
        }

        if (monaId) {
          await pool.query(`
            INSERT INTO qa_evaluations (form_id, employee_id, process_name, department_id, total_score, status)
            VALUES 
            ($1, $2, 'تنفيذ طلب التشغيل', 1, 98.0, 'completed'),
            ($1, $2, 'تسليم الطلب للعميل', 1, 96.0, 'completed')
          `, [formId, monaId]);
        }
      }
    }

    // 6. Ensure some Attendance records exist for them for June & July 2026
    const attendanceCount = await pool.query("SELECT COUNT(*) FROM hr_attendance");
    if (parseInt(attendanceCount.rows[0].count) === 0) {
      const targetEmployees = [ahmedId, monaId, islamId].filter(Boolean);
      for (const empId of targetEmployees) {
        await pool.query(`
          INSERT INTO hr_attendance (company_id, user_id, date, status, shift_name)
          VALUES 
          (1, $1, '2026-07-01', 'Present', 'Morning Shift'),
          (1, $1, '2026-07-02', 'Present', 'Morning Shift'),
          (1, $1, '2026-07-03', 'Late', 'Morning Shift'),
          (1, $1, '2026-07-04', 'Present', 'Morning Shift'),
          (1, $1, '2026-07-05', 'Present', 'Morning Shift')
          ON CONFLICT (user_id, date) DO NOTHING
        `, [empId]);
      }
    }

    // 7. Ensure standard targets exist in `kpis` table so they are visible by default
    const kpisCheck = await pool.query("SELECT COUNT(*) FROM kpis WHERE source IN ('sales', 'operations', 'marketing', 'qa', 'hr')");
    if (parseInt(kpisCheck.rows[0].count) === 0) {
      if (ahmedId) {
        await pool.query(`
          INSERT INTO kpis (name, target_value, actual_value, source, frequency, owner_id, department_id)
          VALUES 
          ('مستهدف المبيعات المالي', 100000, 0, 'sales', 'Monthly', $1, $2)
        `, [ahmedId, depts["Sales"] || 2]);
      }
      if (monaId) {
        await pool.query(`
          INSERT INTO kpis (name, target_value, actual_value, source, frequency, owner_id, department_id)
          VALUES 
          ('تارجت تسليم طلبات التشغيل', 50, 0, 'operations', 'Monthly', $1, $2)
        `, [monaId, depts["Operations"] || 1]);
      }
      if (islamId) {
        await pool.query(`
          INSERT INTO kpis (name, target_value, actual_value, source, frequency, owner_id, department_id)
          VALUES 
          ('تارجت تكلفة الـ Lead', 2.0, 0, 'marketing', 'Monthly', $1, $2)
        `, [islamId, depts["Marketing"] || 4]);
      }
    }

  } catch (err) {
    console.error("Error seeding performance target data:", err);
  }
}

