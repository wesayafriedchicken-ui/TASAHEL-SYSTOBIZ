import express, { Request, Response } from "express";
import multer from "multer";
import Papa from "papaparse";
import { pool, getDbType } from "../../db/schema.js";
import { memoryCache } from "../../utils/cache.js";

async function loadExcelJs(): Promise<any | null> {
  try {
    const mod: any = await import("exceljs");
    return mod?.default || mod;
  } catch (err: any) {
    console.warn("⚠️ exceljs is not available on this host; falling back to CSV mode:", err?.message || err);
    return null;
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 12 * 1024 * 1024, // 12 MB max
  },
});

const MAX_IMPORT_ROWS = 2500;

export type QaExcelCaseType =
  | "complaints"
  | "delays"
  | "refunds"
  | "cancellations"
  | "nps"
  | "action_plans"
  | "checklists";

interface QaColumnDef {
  key: string;
  header: string;
  arLabel: string;
  required?: boolean;
  width: number;
  example1: string | number;
  example2: string | number;
  notes: string;
  aliases: string[];
  preview?: boolean;
}

interface QaCaseConfig {
  caseType: QaExcelCaseType;
  labelEn: string;
  labelAr: string;
  sheetName: string;
  filePrefix: string;
  incidentType?: "complaint" | "delay" | "refund" | "cancellation";
  columns: QaColumnDef[];
}

function buildTransactionColumns(
  incidentType: "complaint" | "delay" | "refund" | "cancellation"
): QaColumnDef[] {
  const isRefund = incidentType === "refund";
  const isComplaint = incidentType === "complaint";
  const isDelay = incidentType === "delay";
  const isCancellation = incidentType === "cancellation";

  const prefix = isComplaint ? "CMP" : isDelay ? "DLY" : isRefund ? "RFD" : "CNC";
  const sampleCause1 = isComplaint
    ? "Agent Communication"
    : isDelay
    ? "Courier Dispatch Delay"
    : isRefund
    ? "Service Overpromise"
    : "Customer Changed Mind";
  const sampleCause2 = isComplaint
    ? "Delayed Escalation"
    : isDelay
    ? "Warehouse Processing Bottleneck"
    : isRefund
    ? "Duplicate Billing Error"
    : "Price / Delivery Time Issue";

  const cols: QaColumnDef[] = [
    {
      key: "transaction_id",
      header: "Transaction_ID *",
      arLabel: "رقم الطلب / المعاملة (مطلوب)",
      required: true,
      width: 20,
      example1: `TRX-${prefix}-1001`,
      example2: `TRX-${prefix}-1002`,
      notes: "مطلوب — رقم الطلب أو المعاملة الفريد (يُستخدم لمطابقة وتحديث السجلات المكررة). Required transaction / order ID.",
      aliases: ["transaction_id", "transaction id", "trx_id", "trx id", "order_id", "order id", "رقم الطلب", "رقم المعاملة", "رقم التذكرة"],
      preview: true,
    },
    {
      key: "qa_reference_number",
      header: "QA_Reference",
      arLabel: "الرقم المرجعي للجودة",
      width: 20,
      example1: `QA-${prefix}-100001`,
      example2: `QA-${prefix}-100002`,
      notes: "اختياري — يتم توليده تلقائياً إذا تُرك فارغاً. Optional QA reference number.",
      aliases: ["qa_reference", "qa_reference_number", "qa ref", "reference", "الرقم المرجعي", "المرجع"],
    },
    {
      key: "order_date",
      header: "Order_Date",
      arLabel: "تاريخ الطلب (YYYY-MM-DD)",
      width: 18,
      example1: "2026-05-01",
      example2: "2026-05-03",
      notes: "تاريخ الطلب بصيغة YYYY-MM-DD. Order date in YYYY-MM-DD format.",
      aliases: ["order_date", "order date", "date", "request_date", "تاريخ الطلب", "التاريخ"],
      preview: true,
    },
    {
      key: "customer_name",
      header: "Customer_Name *",
      arLabel: "اسم العميل (مطلوب)",
      required: true,
      width: 24,
      example1: "Mohamed Ali Hassan",
      example2: "Nourhan Tarek",
      notes: "مطلوب — اسم العميل. Required customer name.",
      aliases: ["customer_name", "customer name", "customer", "client", "client_name", "اسم العميل", "العميل"],
      preview: true,
    },
    {
      key: "customer_phone",
      header: "Customer_Phone",
      arLabel: "رقم هاتف العميل",
      width: 18,
      example1: "01012345678",
      example2: "01198765432",
      notes: "اختياري — رقم موبايل العميل. Optional customer phone.",
      aliases: ["customer_phone", "customer phone", "phone", "mobile", "رقم الهاتف", "هاتف العميل", "الموبايل"],
    },
    {
      key: "agent_name",
      header: "Agent_Name",
      arLabel: "اسم الموظف المسؤول",
      width: 22,
      example1: "Sara Mahmoud",
      example2: "Omar Khaled",
      notes: "اسم الموظف المسؤول عن المعاملة. Responsible agent name.",
      aliases: ["agent_name", "agent name", "agent", "employee", "employee_name", "اسم الموظف", "الموظف"],
      preview: true,
    },
    {
      key: "department",
      header: "Department",
      arLabel: "القسم",
      width: 20,
      example1: "Customer Service",
      example2: "Operations",
      notes: "القسم المختص (مثل Operations, Customer Service, Sales, Finance). Department name.",
      aliases: ["department", "dept", "department_name", "القسم", "الادارة", "الإدارة"],
      preview: true,
    },
    {
      key: "owner",
      header: "Owner",
      arLabel: "المسؤول / Operation Owner",
      width: 20,
      example1: "Ahmed Samir",
      example2: "Mona Adel",
      notes: "مسؤول التشغيل أو المتابعة. Case / Operations owner.",
      aliases: ["owner", "operation_owner", "operations_owner", "handled_by", "المسؤول", "مسؤول التشغيل"],
    },
    {
      key: "auditor_name",
      header: "Auditor_Name",
      arLabel: "اسم مراجع الجودة",
      width: 20,
      example1: "Omnia Mosalam",
      example2: "Omnia Mosalam",
      notes: "اسم مراجع الجودة (QA Auditor). QA Auditor name.",
      aliases: ["auditor_name", "auditor name", "auditor", "qa_auditor", "مراجع الجودة", "المراجع"],
    },
    {
      key: "order_amount",
      header: "Order_Amount",
      arLabel: "قيمة الطلب",
      width: 15,
      example1: 1500,
      example2: 2450,
      notes: "القيمة الإجمالية للطلب (رقم). Total order amount.",
      aliases: ["order_amount", "order amount", "amount", "قيمة الطلب", "المبلغ"],
    },
  ];

  if (isRefund) {
    cols.push(
      {
        key: "refund_amount",
        header: "Refund_Amount",
        arLabel: "مبلغ الاسترداد",
        width: 16,
        example1: 500,
        example2: 2450,
        notes: "قيمة المبلغ المسترد للعميل (رقم). Refund amount.",
        aliases: ["refund_amount", "refund amount", "مبلغ الاسترداد", "قيمة الاسترداد"],
        preview: true,
      },
      {
        key: "refund_reason",
        header: "Refund_Reason",
        arLabel: "سبب الاسترداد",
        width: 24,
        example1: "Wrong Service Promised",
        example2: "Double Charge",
        notes: "السبب الرئيسي لطلب الاسترداد. Primary refund reason.",
        aliases: ["refund_reason", "refund reason", "سبب الاسترداد"],
      },
      {
        key: "refund_sub_reason",
        header: "Refund_Sub_Reason",
        arLabel: "السبب الفرعي للاسترداد",
        width: 24,
        example1: "Miscommunication",
        example2: "Payment Gateway Retry",
        notes: "السبب الفرعي للاسترداد. Sub-reason for refund.",
        aliases: ["refund_sub_reason", "refund sub reason", "السبب الفرعي للاسترداد"],
      },
      {
        key: "lose_on_employee",
        header: "Lose_On_Employee",
        arLabel: "خصم على الموظف (Yes/No)",
        width: 18,
        example1: "No",
        example2: "Yes",
        notes: "هل يتم تحميل الخسارة على الموظف؟ (Yes / No). Charged on employee? (Yes/No).",
        aliases: ["lose_on_employee", "loss_on_employee", "deduction", "خصم على الموظف"],
      },
      {
        key: "lose_employee_name",
        header: "Lose_Employee_Name",
        arLabel: "اسم الموظف المحمّل بالخسارة",
        width: 22,
        example1: "",
        example2: "Omar Khaled",
        notes: "اسم الموظف المحمّل بالخصم في حال كانت Lose_On_Employee = Yes.",
        aliases: ["lose_employee_name", "loss_employee_name", "الموظف المحمل بالخسارة"],
      },
      {
        key: "lose_amount",
        header: "Lose_Amount",
        arLabel: "مبلغ الخصم على الموظف",
        width: 16,
        example1: 0,
        example2: 250,
        notes: "قيمة المبلغ المخصوم (رقم). Deduction amount.",
        aliases: ["lose_amount", "loss_amount", "مبلغ الخصم"],
      }
    );
  }

  if (isComplaint) {
    cols.push({
      key: "complaint_reason",
      header: "Complaint_Reason",
      arLabel: "سبب الشكوى",
      width: 26,
      example1: "Delayed Response",
      example2: "Unprofessional Tone",
      notes: "السبب المباشر لشكوى العميل. Direct complaint reason.",
      aliases: ["complaint_reason", "complaint reason", "سبب الشكوى"],
    });
  }

  if (isDelay) {
    cols.push({
      key: "delay_reason",
      header: "Delay_Reason",
      arLabel: "سبب التأخير",
      width: 26,
      example1: "Courier Delay",
      example2: "Missing Document Verification",
      notes: "السبب المباشر للتأخير. Direct delay reason.",
      aliases: ["delay_reason", "delay reason", "سبب التأخير"],
    });
  }

  if (isCancellation) {
    cols.push({
      key: "cancellation_reason",
      header: "Cancellation_Reason",
      arLabel: "سبب الإلغاء",
      width: 26,
      example1: "Customer Requested Cancel",
      example2: "Out of SLA Window",
      notes: "السبب المباشر للإلغاء. Direct cancellation reason.",
      aliases: ["cancellation_reason", "cancellation reason", "سبب الإلغاء", "سبب الالغاء"],
    });
  }

  cols.push(
    {
      key: "sla_status",
      header: "SLA_Status",
      arLabel: "حالة SLA (Met SLA / Breached SLA)",
      width: 18,
      example1: "Met SLA",
      example2: "Breached SLA",
      notes: "القيم المتاحة: Met SLA أو Breached SLA. Allowed: Met SLA / Breached SLA.",
      aliases: ["sla_status", "sla status", "sla", "حالة sla"],
    },
    {
      key: "qa_status",
      header: "QA_Status",
      arLabel: "نتيجة الجودة (Pass / Fail / Pending)",
      width: 16,
      example1: "Pass",
      example2: "Fail",
      notes: "القيم المتاحة: Pass أو Fail أو Pending. Allowed: Pass / Fail / Pending.",
      aliases: ["qa_status", "qa status", "status", "نتيجة الجودة", "حالة الجودة"],
      preview: true,
    },
    {
      key: "root_cause",
      header: "Root_Cause",
      arLabel: "السبب الجذري (Root Cause)",
      width: 26,
      example1: sampleCause1,
      example2: sampleCause2,
      notes: "السبب الجذري بعد المراجعة. Audited root cause.",
      aliases: ["root_cause", "root cause", "bucket_3_root_cause", "السبب الجذري"],
      preview: true,
    },
    {
      key: "sub_reason",
      header: "Sub_Reason",
      arLabel: "السبب الفرعي",
      width: 24,
      example1: "Missed Follow-up",
      example2: "SOP Step Skipped",
      notes: "تفصيل السبب الفرعي. Sub-reason details.",
      aliases: ["sub_reason", "sub reason", "السبب الفرعي"],
    },
    {
      key: "error_classification",
      header: "Error_Classification",
      arLabel: "تصنيف الخطأ",
      width: 22,
      example1: "Process Error",
      example2: isRefund ? "Avoidable Refund" : "Agent Error",
      notes: "تصنيف الخطأ (مثل Process Error, Agent Error, System Error, Avoidable Refund).",
      aliases: ["error_classification", "error classification", "classification", "تصنيف الخطأ"],
    },
    {
      key: "corrective_action",
      header: "Corrective_Action",
      arLabel: "الإجراء التصحيحي",
      width: 28,
      example1: "Coaching session with agent",
      example2: "Update handover SOP checklist",
      notes: "الإجراء التصحيحي المقترح أو المنفذ. Corrective action taken.",
      aliases: ["corrective_action", "corrective action", "action_required", "الإجراء التصحيحي", "الاجراء التصحيحي"],
    },
    {
      key: "manager_approval",
      header: "Manager_Approval",
      arLabel: "اعتماد المدير (Pending / Approved / Rejected)",
      width: 18,
      example1: "Approved",
      example2: "Pending",
      notes: "حالة اعتماد المدير: Pending أو Approved أو Rejected.",
      aliases: ["manager_approval", "manager approval", "approval", "اعتماد المدير"],
    },
    {
      key: "assigned_manager",
      header: "Assigned_Manager",
      arLabel: "المدير المختص",
      width: 20,
      example1: "Operations Manager",
      example2: "CS Team Lead",
      notes: "اسم المدير المختص بالاعتماد. Assigned manager name.",
      aliases: ["assigned_manager", "assigned manager", "manager", "المدير المختص"],
    },
    {
      key: "workflow_status",
      header: "Workflow_Status",
      arLabel: "حالة سير العمل",
      width: 18,
      example1: "Closed",
      example2: "Under Review",
      notes: "حالة التدقيق (Under Review, Pending Approval, Approved, Closed).",
      aliases: ["workflow_status", "workflow status", "حالة سير العمل"],
    },
    {
      key: "request_type",
      header: "Request_Type",
      arLabel: "نوع الطلب",
      width: 20,
      example1: "Standard Order",
      example2: "Priority Service",
      notes: "نوع الطلب التشغيلي. Operational request type.",
      aliases: ["request_type", "request type", "نوع الطلب"],
    },
    {
      key: "operations_status",
      header: "Operations_Status",
      arLabel: "حالة التشغيل",
      width: 18,
      example1: "Completed",
      example2: "In Progress",
      notes: "حالة الطلب في التشغيل. Operations status.",
      aliases: ["operations_status", "operations status", "حالة التشغيل"],
    },
    {
      key: "action_plan_required",
      header: "Action_Plan_Required",
      arLabel: "يحتاج خطة عمل (Yes/No)",
      width: 18,
      example1: "No",
      example2: "Yes",
      notes: "هل يتطلب إنشاء خطة عمل تصحيحية؟ (Yes / No).",
      aliases: ["action_plan_required", "action plan required", "يحتاج خطة عمل"],
    },
    {
      key: "action_plan_type",
      header: "Action_Plan_Type",
      arLabel: "نوع خطة العمل",
      width: 20,
      example1: "Training Action",
      example2: "Quality Action",
      notes: "نوع خطة العمل (Training Action, Quality Action, Process Improvement).",
      aliases: ["action_plan_type", "action plan type", "نوع خطة العمل"],
    },
    {
      key: "channel",
      header: "Channel",
      arLabel: "القناة",
      width: 16,
      example1: "Phone",
      example2: "WhatsApp",
      notes: "قناة التواصل (Phone, WhatsApp, Email, Web, App).",
      aliases: ["channel", "القناة", "قناة التواصل"],
    },
    {
      key: "priority",
      header: "Priority",
      arLabel: "الأولوية (Low / Medium / High / Critical)",
      width: 15,
      example1: "Medium",
      example2: "High",
      notes: "مستوى الأولوية: Low / Medium / High / Critical.",
      aliases: ["priority", "الأولوية", "الاولوية"],
    },
    {
      key: "comment",
      header: "Comment",
      arLabel: "ملاحظات / تعليق المراجع",
      width: 34,
      example1: "Customer notified and case resolved smoothly.",
      example2: "Escalated to supervisor for preventive follow-up.",
      notes: "أي ملاحظات أو تعليقات تفصيلية حول الحالة.",
      aliases: ["comment", "comments", "notes", "remarks", "ملاحظات", "تعليق"],
    }
  );

  return cols;
}

const QA_CASES: Record<QaExcelCaseType, QaCaseConfig> = {
  complaints: {
    caseType: "complaints",
    labelEn: "Complaints Audit",
    labelAr: "تدقيق الشكاوى (Complaints)",
    sheetName: "Complaints",
    filePrefix: "SystoBiz_QA_Complaints",
    incidentType: "complaint",
    columns: buildTransactionColumns("complaint"),
  },
  delays: {
    caseType: "delays",
    labelEn: "Delays Audit",
    labelAr: "تدقيق التأخيرات (Delays)",
    sheetName: "Delays",
    filePrefix: "SystoBiz_QA_Delays",
    incidentType: "delay",
    columns: buildTransactionColumns("delay"),
  },
  refunds: {
    caseType: "refunds",
    labelEn: "Refunds Audit",
    labelAr: "تدقيق الاستردادات المالية (Refunds)",
    sheetName: "Refunds",
    filePrefix: "SystoBiz_QA_Refunds",
    incidentType: "refund",
    columns: buildTransactionColumns("refund"),
  },
  cancellations: {
    caseType: "cancellations",
    labelEn: "Cancellations Audit",
    labelAr: "تدقيق الإلغاءات (Cancellations)",
    sheetName: "Cancellations",
    filePrefix: "SystoBiz_QA_Cancellations",
    incidentType: "cancellation",
    columns: buildTransactionColumns("cancellation"),
  },
  nps: {
    caseType: "nps",
    labelEn: "NPS & CSAT Feedback",
    labelAr: "استبيانات رضا العملاء (NPS)",
    sheetName: "NPS_Feedback",
    filePrefix: "SystoBiz_QA_NPS",
    columns: [
      {
        key: "transaction_id",
        header: "Transaction_ID *",
        arLabel: "رقم الطلب / المعاملة (مطلوب)",
        required: true,
        width: 20,
        example1: "TRX-NPS-5001",
        example2: "TRX-NPS-5002",
        notes: "مطلوب — رقم الطلب المرتبط بالتقييم. Required transaction ID.",
        aliases: ["transaction_id", "transaction id", "trx_id", "order_id", "رقم الطلب", "رقم المعاملة"],
        preview: true,
      },
      {
        key: "qa_reference_number",
        header: "QA_Reference",
        arLabel: "الرقم المرجعي للجودة",
        width: 20,
        example1: "QA-NPS-100001",
        example2: "QA-NPS-100002",
        notes: "اختياري — يتم توليده تلقائياً إذا تُرك فارغاً.",
        aliases: ["qa_reference", "qa_reference_number", "qa ref", "الرقم المرجعي"],
      },
      {
        key: "survey_date",
        header: "Survey_Date",
        arLabel: "تاريخ التقييم (YYYY-MM-DD)",
        width: 18,
        example1: "2026-05-01",
        example2: "2026-05-02",
        notes: "تاريخ استبيان العميل بصيغة YYYY-MM-DD.",
        aliases: ["survey_date", "survey date", "date", "created_at", "تاريخ التقييم", "التاريخ"],
        preview: true,
      },
      {
        key: "customer_name",
        header: "Customer_Name *",
        arLabel: "اسم العميل (مطلوب)",
        required: true,
        width: 24,
        example1: "Youssef Ibrahim",
        example2: "Heba Gamal",
        notes: "مطلوب — اسم العميل صاحب التقييم.",
        aliases: ["customer_name", "customer name", "customer", "client", "اسم العميل", "العميل"],
        preview: true,
      },
      {
        key: "agent_name",
        header: "Agent_Name *",
        arLabel: "اسم الموظف (مطلوب)",
        required: true,
        width: 22,
        example1: "Sara Mahmoud",
        example2: "Karim Adel",
        notes: "مطلوب — اسم الموظف الذي خدم العميل.",
        aliases: ["agent_name", "agent name", "agent", "employee", "اسم الموظف", "الموظف"],
        preview: true,
      },
      {
        key: "rating",
        header: "Rating *",
        arLabel: "التقييم من 0 إلى 10 (مطلوب)",
        required: true,
        width: 14,
        example1: 10,
        example2: 5,
        notes: "مطلوب — رقم صحيح من 0 إلى 10 (9-10 Promoter، 7-8 Passive، 0-6 Detractor).",
        aliases: ["rating", "score", "nps_score", "nps", "التقييم", "الدرجة"],
        preview: true,
      },
      {
        key: "category",
        header: "Category",
        arLabel: "التصنيف (Promoter / Passive / Detractor)",
        width: 18,
        example1: "Promoter",
        example2: "Detractor",
        notes: "اختياري — يُحسب تلقائياً من التقييم إذا تُرك فارغاً.",
        aliases: ["category", "nps_category", "التصنيف"],
        preview: true,
      },
      {
        key: "feedback_text",
        header: "Feedback_Text",
        arLabel: "رأي وملاحظات العميل",
        width: 34,
        example1: "Fast and courteous service!",
        example2: "Delivery arrived later than promised.",
        notes: "نص تقييم العميل أو تعليقه.",
        aliases: ["feedback_text", "feedback text", "feedback", "comment", "comments", "ملاحظات العميل", "التعليق"],
      },
      {
        key: "delay_linked",
        header: "Delay_Linked",
        arLabel: "مرتبط بتأخير (Yes/No)",
        width: 16,
        example1: "No",
        example2: "Yes",
        notes: "هل التقييم مرتبط بتأخير؟ (Yes / No).",
        aliases: ["delay_linked", "delay linked", "مرتبط بتأخير"],
      },
      {
        key: "root_cause",
        header: "Root_Cause",
        arLabel: "السبب الجذري",
        width: 24,
        example1: "",
        example2: "Courier Dispatch Delay",
        notes: "السبب الجذري في حالة التقييم السلبي.",
        aliases: ["root_cause", "root cause", "السبب الجذري"],
        preview: true,
      },
      {
        key: "corrective_action",
        header: "Corrective_Action",
        arLabel: "الإجراء التصحيحي",
        width: 28,
        example1: "Thank-you call logged",
        example2: "Proactive ETA alert coaching",
        notes: "الإجراء المتخذ أو المقترح.",
        aliases: ["corrective_action", "corrective action", "الإجراء التصحيحي"],
      },
      {
        key: "owner",
        header: "Owner",
        arLabel: "المسؤول",
        width: 20,
        example1: "Ahmed Samir",
        example2: "Mona Adel",
        notes: "المسؤول التشغيلي عن المتابعة.",
        aliases: ["owner", "operations_owner", "المسؤول"],
      },
      {
        key: "auditor_name",
        header: "Auditor_Name",
        arLabel: "اسم مراجع الجودة",
        width: 20,
        example1: "Omnia Mosalam",
        example2: "Omnia Mosalam",
        notes: "اسم مراجع الجودة المسؤول.",
        aliases: ["auditor_name", "auditor name", "auditor", "مراجع الجودة"],
      },
      {
        key: "status",
        header: "Status",
        arLabel: "الحالة (Reviewed / Pending / Escalated / Closed)",
        width: 16,
        example1: "Reviewed",
        example2: "Pending",
        notes: "حالة المراجعة: Reviewed / Pending / Escalated / Closed.",
        aliases: ["status", "الحالة"],
      },
    ],
  },
  action_plans: {
    caseType: "action_plans",
    labelEn: "Action Plans (CAPA)",
    labelAr: "خطط العمل التصحيحية (Action Plans)",
    sheetName: "Action_Plans",
    filePrefix: "SystoBiz_QA_Action_Plans",
    columns: [
      {
        key: "plan_code",
        header: "Plan_Code",
        arLabel: "كود خطة العمل",
        width: 18,
        example1: "AP-2026-101",
        example2: "AP-2026-102",
        notes: "اختياري — يُولّد تلقائياً إذا تُرك فارغاً، ويُستخدم لمطابقة التحديث عند التكرار.",
        aliases: ["plan_code", "plan code", "code", "كود الخطة", "رقم الخطة"],
        preview: true,
      },
      {
        key: "title",
        header: "Title *",
        arLabel: "عنوان خطة العمل (مطلوب)",
        required: true,
        width: 34,
        example1: "Reduce Delivery SLA Breaches in Cairo Zone",
        example2: "Agent Script Coaching for Refund Policy",
        notes: "مطلوب — عنوان واضح ومختصر لخطة العمل.",
        aliases: ["title", "plan_title", "name", "العنوان", "عنوان الخطة"],
        preview: true,
      },
      {
        key: "incident_type",
        header: "Incident_Type *",
        arLabel: "نوع الحالة (complaint/delay/refund/cancellation/nps)",
        required: true,
        width: 18,
        example1: "delay",
        example2: "refund",
        notes: "مطلوب — القيم المقبولة: complaint, delay, refund, cancellation, nps.",
        aliases: ["incident_type", "incident type", "type", "case_type", "نوع الحالة", "النوع"],
        preview: true,
      },
      {
        key: "transaction_id",
        header: "Transaction_ID",
        arLabel: "رقم الطلب / المعاملة المرتبط",
        width: 20,
        example1: "TRX-DLY-1001",
        example2: "TRX-RFD-1002",
        notes: "رقم الطلب المرتبط بالخطة (إن وجد).",
        aliases: ["transaction_id", "transaction id", "trx_id", "رقم الطلب", "رقم المعاملة"],
        preview: true,
      },
      {
        key: "customer_name",
        header: "Customer_Name",
        arLabel: "اسم العميل",
        width: 22,
        example1: "Mohamed Ali Hassan",
        example2: "Nourhan Tarek",
        notes: "اسم العميل المرتبط بالحالة.",
        aliases: ["customer_name", "customer name", "customer", "اسم العميل"],
      },
      {
        key: "agent_name",
        header: "Agent_Name",
        arLabel: "اسم الموظف",
        width: 22,
        example1: "Sara Mahmoud",
        example2: "Omar Khaled",
        notes: "اسم الموظف المعني بالتطوير أو المتابعة.",
        aliases: ["agent_name", "agent name", "agent", "اسم الموظف"],
      },
      {
        key: "department",
        header: "Department",
        arLabel: "القسم",
        width: 20,
        example1: "Operations",
        example2: "Customer Service",
        notes: "القسم المسؤول عن تنفيذ الخطة.",
        aliases: ["department", "dept", "القسم"],
        preview: true,
      },
      {
        key: "severity",
        header: "Severity",
        arLabel: "درجة الخطورة (Low / Medium / High / Critical)",
        width: 16,
        example1: "High",
        example2: "Critical",
        notes: "درجة الخطورة: Low / Medium / High / Critical.",
        aliases: ["severity", "priority", "درجة الخطورة", "الخطورة"],
        preview: true,
      },
      {
        key: "status",
        header: "Status",
        arLabel: "حالة الخطة (Draft/Root Cause Analysis/In Progress/Verification/Closed)",
        width: 22,
        example1: "In Progress",
        example2: "Root Cause Analysis",
        notes: "الحالة: Draft, Open, Root Cause Analysis, In Progress, Verification, Completed, Closed.",
        aliases: ["status", "الحالة", "حالة الخطة"],
        preview: true,
      },
      {
        key: "current_step",
        header: "Current_Step",
        arLabel: "المرحلة الحالية (1 إلى 5)",
        width: 14,
        example1: 4,
        example2: 2,
        notes: "رقم المرحلة من 1 إلى 5.",
        aliases: ["current_step", "step", "المرحلة"],
      },
      {
        key: "action_plan_type",
        header: "Action_Plan_Type",
        arLabel: "نوع خطة العمل",
        width: 20,
        example1: "Quality Action",
        example2: "Training Action",
        notes: "نوع الخطة (Quality Action, Training Action, Process CAPA).",
        aliases: ["action_plan_type", "plan_type", "نوع خطة العمل"],
      },
      {
        key: "root_cause_category",
        header: "Root_Cause_Category",
        arLabel: "تصنيف السبب الجذري",
        width: 22,
        example1: "Operations",
        example2: "Customer Service",
        notes: "تصنيف السبب الجذري.",
        aliases: ["root_cause_category", "category", "تصنيف السبب"],
      },
      {
        key: "root_cause_name",
        header: "Root_Cause_Name",
        arLabel: "السبب الجذري",
        width: 26,
        example1: "Courier Dispatch Delay",
        example2: "Service Overpromise",
        notes: "اسم السبب الجذري المحدد.",
        aliases: ["root_cause_name", "root_cause", "السبب الجذري"],
      },
      {
        key: "root_cause_analysis",
        header: "Root_Cause_Analysis",
        arLabel: "تحليل السبب الجذري",
        width: 34,
        example1: "Batch handover after 4 PM missed courier cutoff window.",
        example2: "Agent quoted outdated refund policy terms.",
        notes: "وصف تفصيلي لتحليل السبب الجذري.",
        aliases: ["root_cause_analysis", "analysis", "تحليل السبب"],
      },
      {
        key: "assigned_to",
        header: "Assigned_To",
        arLabel: "المسؤول عن التنفيذ",
        width: 22,
        example1: "Operations Team Lead",
        example2: "QA Training Lead",
        notes: "الشخص أو الفريق المسؤول عن تنفيذ خطة العمل.",
        aliases: ["assigned_to", "assignee", "owner", "المسؤول عن التنفيذ"],
      },
      {
        key: "target_completion_date",
        header: "Target_Completion_Date",
        arLabel: "تاريخ الإنجاز المستهدف (YYYY-MM-DD)",
        width: 22,
        example1: "2026-05-20",
        example2: "2026-05-25",
        notes: "الموعد النهائي المستهدف بصيغة YYYY-MM-DD.",
        aliases: ["target_completion_date", "due_date", "target_date", "تاريخ الإنجاز", "الموعد النهائي"],
      },
      {
        key: "effectiveness_score",
        header: "Effectiveness_Score",
        arLabel: "نسبة الفاعلية (0-100)",
        width: 18,
        example1: 90,
        example2: 100,
        notes: "نسبة فاعلية الخطة (0 إلى 100).",
        aliases: ["effectiveness_score", "score", "نسبة الفاعلية"],
      },
      {
        key: "verification_notes",
        header: "Verification_Notes",
        arLabel: "ملاحظات التحقق والإغلاق",
        width: 30,
        example1: "Verified against weekly SLA report.",
        example2: "Pending follow-up coaching audit.",
        notes: "ملاحظات مراجع الجودة عند التحقق.",
        aliases: ["verification_notes", "notes", "ملاحظات التحقق"],
      },
      {
        key: "verified_by",
        header: "Verified_By",
        arLabel: "تم التحقق بواسطة",
        width: 20,
        example1: "Omnia Mosalam",
        example2: "",
        notes: "اسم من قام بالتحقق والإغلاق.",
        aliases: ["verified_by", "تم التحقق بواسطة"],
      },
      {
        key: "created_by",
        header: "Created_By",
        arLabel: "أنشئت بواسطة",
        width: 20,
        example1: "QA Specialist",
        example2: "QA Manager",
        notes: "اسم منشئ خطة العمل.",
        aliases: ["created_by", "أنشئت بواسطة"],
      },
    ],
  },
  checklists: {
    caseType: "checklists",
    labelEn: "Audit Checklists (Root Cause Presets)",
    labelAr: "قوائم التدقيق والأسباب الجذرية (Audit Checklists)",
    sheetName: "Audit_Checklists",
    filePrefix: "SystoBiz_QA_Audit_Checklists",
    columns: [
      {
        key: "type",
        header: "Incident_Type *",
        arLabel: "نوع الحالة (complaint/delay/refund/cancellation) (مطلوب)",
        required: true,
        width: 20,
        example1: "complaint",
        example2: "refund",
        notes: "مطلوب — القيم المتاحة: complaint, delay, refund, cancellation.",
        aliases: ["incident_type", "type", "case_type", "نوع الحالة", "النوع"],
        preview: true,
      },
      {
        key: "department",
        header: "Department *",
        arLabel: "القسم (مطلوب)",
        required: true,
        width: 22,
        example1: "Customer Service",
        example2: "Operations",
        notes: "مطلوب — اسم القسم المختص بالقائمة.",
        aliases: ["department", "dept", "department_name", "القسم"],
        preview: true,
      },
      {
        key: "root_cause_name",
        header: "Root_Cause_Name *",
        arLabel: "اسم السبب الجذري الرئيسي (مطلوب)",
        required: true,
        width: 30,
        example1: "Agent Communication Gap",
        example2: "Avoidable Billing Error",
        notes: "مطلوب — اسم بند التدقيق / السبب الجذري الرئيسي.",
        aliases: ["root_cause_name", "root_cause", "root cause", "name", "title", "السبب الجذري", "البند"],
        preview: true,
      },
      {
        key: "weight",
        header: "Weight",
        arLabel: "الوزن / نقاط الخصم",
        width: 14,
        example1: 25,
        example2: 40,
        notes: "وزن السبب الجذري في تقييم الجودة (رقم، الافتراضي 25).",
        aliases: ["weight", "points", "score", "الوزن", "النقاط"],
        preview: true,
      },
      {
        key: "sub_reasons",
        header: "Sub_Reasons",
        arLabel: "الأسباب الفرعية (مفصولة بـ ; أو ,)",
        width: 46,
        example1: "Wrong Information:50; Unprofessional Tone:50",
        example2: "Duplicate Invoice:60; Wrong Tax Rate:40",
        notes: "قائمة الأسباب الفرعية مفصولة بفاصلة منقوطة (;) ويمكن كتابة النسبة بعد نقطتين مثل Name:50 أو أسماء فقط.",
        aliases: ["sub_reasons", "sub reasons", "checklist_items", "items", "الأسباب الفرعية", "البنود الفرعية"],
        preview: true,
      },
      {
        key: "is_active",
        header: "Is_Active",
        arLabel: "مفعّل (Yes/No)",
        width: 14,
        example1: "Yes",
        example2: "Yes",
        notes: "هل البند مفعّل؟ (Yes / No). Active status.",
        aliases: ["is_active", "active", "status", "مفعل", "الحالة"],
        preview: true,
      },
    ],
  },
};

function resolveCaseConfig(rawCaseType: string): QaCaseConfig | null {
  const key = String(rawCaseType || "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");
  const aliases: Record<string, QaExcelCaseType> = {
    complaint: "complaints",
    complaints: "complaints",
    delay: "delays",
    delays: "delays",
    refund: "refunds",
    refunds: "refunds",
    cancellation: "cancellations",
    cancellations: "cancellations",
    nps: "nps",
    action_plan: "action_plans",
    action_plans: "action_plans",
    checklist: "checklists",
    checklists: "checklists",
    presets: "checklists",
  };
  const resolved = aliases[key];
  return resolved ? QA_CASES[resolved] : null;
}

function normalizeHeaderKey(raw: string): string {
  return String(raw || "")
    .replace(/\*+/g, "")
    .replace(/[()\[\]]/g, " ")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function cellToString(val: any): string {
  if (val === null || val === undefined) return "";
  if (val instanceof Date && !Number.isNaN(val.getTime())) {
    return val.toISOString().slice(0, 10);
  }
  if (typeof val === "object") {
    if ("text" in val && typeof val.text === "string") return val.text.trim();
    if ("richText" in val && Array.isArray(val.richText)) {
      return val.richText.map((r: any) => r.text || "").join("").trim();
    }
    if ("result" in val && val.result !== undefined && val.result !== null) {
      return cellToString(val.result);
    }
    if ("hyperlink" in val && typeof val.hyperlink === "string") {
      return (val.text || val.hyperlink).trim();
    }
  }
  return String(val).trim();
}

function parseBool(val: any, defaultVal = false): boolean {
  if (val === null || val === undefined || val === "") return defaultVal;
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val !== 0;
  const s = String(val).trim().toLowerCase();
  if (["true", "1", "yes", "y", "نعم", "صح", "مفعل", "active"].includes(s)) return true;
  if (["false", "0", "no", "n", "لا", "خطأ", "غير مفعل", "inactive"].includes(s)) return false;
  return defaultVal;
}

function parseNum(val: any, defaultVal = 0): number {
  if (val === null || val === undefined || val === "") return defaultVal;
  const cleaned = String(val).replace(/[,،\sEGPUSD$%]/gi, "").trim();
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : defaultVal;
}

function parseIntSafe(val: any, defaultVal: number): number {
  const n = Math.round(parseNum(val, defaultVal));
  return Number.isFinite(n) ? n : defaultVal;
}

function parseDateOnly(val: any): string | null {
  if (val === null || val === undefined || val === "") return null;
  if (val instanceof Date && !Number.isNaN(val.getTime())) {
    return val.toISOString().slice(0, 10);
  }
  if (typeof val === "number" && val > 20000 && val < 90000) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const dt = new Date(excelEpoch.getTime() + Math.round(val) * 86400000);
    if (!Number.isNaN(dt.getTime())) return dt.toISOString().slice(0, 10);
  }
  const str = String(val).trim();
  if (!str) return null;
  const isoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, "0")}-${isoMatch[3].padStart(2, "0")}`;
  }
  const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    const a = parseInt(dmyMatch[1], 10);
    const b = parseInt(dmyMatch[2], 10);
    const year = dmyMatch[3];
    const day = a > 12 ? a : b > 12 ? b : a;
    const month = a > 12 ? b : b > 12 ? a : b;
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }
  const parsed = new Date(str);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return null;
}

function toMysqlDateTime(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const d = parseDateOnly(dateStr);
  if (!d) return null;
  return `${d} 00:00:00`;
}

function normalizeIncidentTypeValue(raw: string, fallback = "complaint"): string {
  const s = String(raw || "").trim().toLowerCase();
  if (s.startsWith("comp") || s.includes("شكو")) return "complaint";
  if (s.startsWith("del") || s.includes("تأخ") || s.includes("تاخ")) return "delay";
  if (s.startsWith("ref") || s.includes("استرد")) return "refund";
  if (s.startsWith("canc") || s.includes("إلغ") || s.includes("الغ")) return "cancellation";
  if (s === "nps" || s.includes("رضا")) return "nps";
  return fallback;
}

function parseSubReasonsForStorage(raw: any): Array<{ id: string; name: string; weight_percentage: number; is_active: boolean }> {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((item, idx) => {
        if (typeof item === "string") {
          return { id: `sr-${idx + 1}`, name: item.trim(), weight_percentage: Math.floor(100 / Math.max(1, raw.length)), is_active: true };
        }
        return {
          id: item.id || `sr-${idx + 1}`,
          name: String(item.name || "").trim(),
          weight_percentage: parseNum(item.weight_percentage ?? item.weight, 0),
          is_active: item.is_active !== undefined ? Boolean(item.is_active) : true,
        };
      })
      .filter((x) => x.name);
  }
  const str = String(raw).trim();
  if (!str) return [];
  if (str.startsWith("[")) {
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) return parseSubReasonsForStorage(parsed);
    } catch {
      // fall through to delimiter split
    }
  }
  const parts = str
    .split(/[;؛|\n,]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return [];
  const defaultPct = Math.round(100 / parts.length);
  return parts.map((part, idx) => {
    const colonMatch = part.match(/^(.+?)\s*:\s*(\d+(?:\.\d+)?)%?$/);
    if (colonMatch) {
      return {
        id: `sr-${idx + 1}`,
        name: colonMatch[1].trim(),
        weight_percentage: parseNum(colonMatch[2], defaultPct),
        is_active: true,
      };
    }
    return {
      id: `sr-${idx + 1}`,
      name: part,
      weight_percentage: defaultPct,
      is_active: true,
    };
  });
}

function formatSubReasonsForExport(raw: any): string {
  const list = parseSubReasonsForStorage(raw);
  if (list.length === 0) return "";
  return list.map((item) => `${item.name}:${item.weight_percentage}`).join("; ");
}

function buildColumnMap(columns: QaColumnDef[], rawHeaders: string[]): {
  colIndexToKey: Map<number, string>;
  matchedColumns: string[];
} {
  const aliasLookup = new Map<string, string>();
  for (const col of columns) {
    aliasLookup.set(normalizeHeaderKey(col.key), col.key);
    aliasLookup.set(normalizeHeaderKey(col.header), col.key);
    aliasLookup.set(normalizeHeaderKey(col.arLabel), col.key);
    for (const a of col.aliases) {
      aliasLookup.set(normalizeHeaderKey(a), col.key);
    }
  }

  const colIndexToKey = new Map<number, string>();
  const matchedSet = new Set<string>();
  rawHeaders.forEach((h, idx) => {
    const norm = normalizeHeaderKey(h);
    if (!norm) return;
    const mapped = aliasLookup.get(norm);
    if (mapped && !matchedSet.has(mapped)) {
      colIndexToKey.set(idx, mapped);
      matchedSet.add(mapped);
    }
  });

  return { colIndexToKey, matchedColumns: Array.from(matchedSet) };
}

function isArabicSubHeaderRow(rowValues: string[], columns: QaColumnDef[]): boolean {
  const nonEmpty = rowValues.filter((v) => v.trim().length > 0);
  if (nonEmpty.length === 0) return false;
  const arLabels = new Set(columns.map((c) => normalizeHeaderKey(c.arLabel)));
  let hits = 0;
  for (const v of nonEmpty) {
    if (arLabels.has(normalizeHeaderKey(v)) || v.includes("(مطلوب)") || v.includes("(YYYY-MM-DD)")) {
      hits++;
    }
  }
  return hits >= Math.min(2, nonEmpty.length);
}

async function parseUploadedTabularFile(
  fileBuffer: Buffer,
  originalName: string
): Promise<{ headers: string[]; rows: Array<{ rowNumber: number; values: string[] }> }> {
  const lower = originalName.toLowerCase();
  if (lower.endsWith(".csv")) {
    const text = fileBuffer.toString("utf8").replace(/^\uFEFF/, "");
    const parsed = Papa.parse<string[]>(text, {
      skipEmptyLines: "greedy",
    });
    const matrix = (parsed.data || []).map((row) =>
      Array.isArray(row) ? row.map((cell) => cellToString(cell)) : []
    );
    if (matrix.length === 0) return { headers: [], rows: [] };
    const headers = matrix[0];
    const rows = matrix.slice(1).map((values, idx) => ({
      rowNumber: idx + 2,
      values,
    }));
    return { headers, rows };
  }

  const ExcelJS = await loadExcelJs();
  if (!ExcelJS) {
    throw new Error("قراءة ملفات .xlsx غير متاحة حالياً على هذا السيرفر — يرجى حفظ الملف بصيغة CSV UTF-8 ورفعه.");
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(fileBuffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) {
    return { headers: [], rows: [] };
  }

  let headerRowIdx = -1;
  let headers: string[] = [];
  const dataRows: Array<{ rowNumber: number; values: string[] }> = [];

  worksheet.eachRow({ includeEmpty: false }, (row: any, rowNumber: number) => {
    const rawVals: string[] = [];
    const colCount = Math.max(row.cellCount || 0, headers.length || 0);
    for (let c = 1; c <= colCount; c++) {
      rawVals.push(cellToString(row.getCell(c).value));
    }
    const hasContent = rawVals.some((v) => v.trim().length > 0);
    if (!hasContent) return;

    if (headerRowIdx === -1) {
      headerRowIdx = rowNumber;
      headers = rawVals;
    } else {
      dataRows.push({ rowNumber, values: rawVals });
    }
  });

  return { headers, rows: dataRows };
}

function escapeCsvCell(val: any): string {
  if (val === null || val === undefined) return '""';
  const s = String(val).replace(/"/g, '""');
  return `"${s}"`;
}

async function sendWorkbookOrCsv(
  res: Response,
  config: QaCaseConfig,
  rowsData: Array<Record<string, any>>,
  options: { isTemplate: boolean }
) {
  const dateStamp = new Date().toISOString().slice(0, 10);
  const fileBase = options.isTemplate
    ? `${config.filePrefix}_Import_Template`
    : `${config.filePrefix}_Export_${dateStamp}`;

  const ExcelJS = await loadExcelJs();
  if (!ExcelJS) {
    const headerLine = config.columns.map((c) => escapeCsvCell(c.header)).join(",");
    const arLine = config.columns.map((c) => escapeCsvCell(c.arLabel)).join(",");
    const dataLines = rowsData.map((r) =>
      config.columns.map((c) => escapeCsvCell(r[c.key] ?? "")).join(",")
    );
    const lines = options.isTemplate ? [headerLine, arLine, ...dataLines] : [headerLine, ...dataLines];
    const csvContent = "\uFEFF" + lines.join("\r\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${fileBase}.csv"`);
    return res.send(csvContent);
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Systo Biz QA";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(config.sheetName, {
    views: [{ state: "frozen", ySplit: options.isTemplate ? 2 : 1 }],
  });

  sheet.columns = config.columns.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width,
  }));

  // Style Row 1 (Headers)
  const headerRow = sheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell: any, colNum: number) => {
    const colDef = config.columns[colNum - 1];
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: colDef?.required ? "FF1E3A8A" : "FF334155" },
    };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: "FFCBD5E1" } },
      bottom: { style: "medium", color: { argb: "FF0F172A" } },
      left: { style: "thin", color: { argb: "FF475569" } },
      right: { style: "thin", color: { argb: "FF475569" } },
    };
  });

  if (options.isTemplate) {
    // Row 2: Arabic helper labels
    const arRowValues: Record<string, string> = {};
    config.columns.forEach((c) => {
      arRowValues[c.key] = c.arLabel;
    });
    const arRow = sheet.addRow(arRowValues);
    arRow.height = 24;
    arRow.eachCell((cell: any) => {
      cell.font = { italic: true, bold: true, color: { argb: "FF1E293B" }, size: 10 };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE2E8F0" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
      cell.border = {
        bottom: { style: "thin", color: { argb: "FF94A3B8" } },
        left: { style: "thin", color: { argb: "FFCBD5E1" } },
        right: { style: "thin", color: { argb: "FFCBD5E1" } },
      };
    });
  }

  // Add data / example rows
  rowsData.forEach((rowObj, idx) => {
    const addedRow = sheet.addRow(rowObj);
    addedRow.height = 22;
    const isEven = idx % 2 === 1;
    addedRow.eachCell({ includeEmpty: true }, (cell: any) => {
      cell.font = { size: 10, color: { argb: "FF0F172A" } };
      if (isEven) {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF8FAFC" },
        };
      }
      cell.alignment = { vertical: "middle", horizontal: "left", wrapText: false };
      cell.border = {
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFF1F5F9" } },
        right: { style: "thin", color: { argb: "FFF1F5F9" } },
      };
    });
  });

  // Auto-filter
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: config.columns.length },
  };

  // Sheet 2: Instructions (for Templates)
  if (options.isTemplate) {
    const guide = workbook.addWorksheet("Instructions");
    guide.columns = [
      { header: "Column Header", key: "header", width: 26 },
      { header: "الوصف بالعربية", key: "arLabel", width: 32 },
      { header: "Required?", key: "required", width: 14 },
      { header: "Notes / Valid Values", key: "notes", width: 68 },
    ];
    const gHeader = guide.getRow(1);
    gHeader.height = 26;
    gHeader.eachCell((cell: any) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F766E" } };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    config.columns.forEach((col) => {
      const r = guide.addRow({
        header: col.header,
        arLabel: col.arLabel,
        required: col.required ? "YES *" : "Optional",
        notes: col.notes,
      });
      r.height = 22;
      r.eachCell((cell: any, cIdx: number) => {
        cell.font = {
          size: 10,
          bold: cIdx === 1 || (cIdx === 3 && col.required),
          color: { argb: cIdx === 3 && col.required ? "FFB91C1C" : "FF1E293B" },
        };
        cell.alignment = { vertical: "middle", wrapText: true };
      });
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", `attachment; filename="${fileBase}.xlsx"`);
  return res.send(Buffer.from(buffer));
}

export function createQaExcelImportExportRouter() {
  const router = express.Router();

  // 1. Download Excel Template for any of the 7 QA cases
  router.get("/excel/:caseType/template", async (req: Request, res: Response) => {
    const config = resolveCaseConfig(req.params.caseType);
    if (!config) {
      return res.status(400).json({ error: `Unsupported QA case type: ${req.params.caseType}` });
    }
    try {
      const ex1: Record<string, any> = {};
      const ex2: Record<string, any> = {};
      for (const col of config.columns) {
        ex1[col.key] = col.example1;
        ex2[col.key] = col.example2;
      }
      return await sendWorkbookOrCsv(res, config, [ex1, ex2], { isTemplate: true });
    } catch (err: any) {
      console.error(`QA Excel template error (${config.caseType}):`, err);
      return res.status(500).json({ error: err?.message || "Failed to generate Excel template" });
    }
  });

  // 2. Export Live Database Records to Excel (.xlsx / CSV fallback)
  router.get("/excel/:caseType/export", async (req: Request, res: Response) => {
    const config = resolveCaseConfig(req.params.caseType);
    if (!config) {
      return res.status(400).json({ error: `Unsupported QA case type: ${req.params.caseType}` });
    }

    try {
      let exportRows: Array<Record<string, any>> = [];

      if (config.incidentType) {
        const result = await pool.query(
          `SELECT * FROM qa_transaction_audits WHERE type = $1 ORDER BY order_date DESC, created_at DESC`,
          [config.incidentType]
        );
        exportRows = (result.rows || []).map((r: any) => ({
          transaction_id: r.transaction_id || "",
          qa_reference_number: r.qa_reference_number || "",
          order_date: parseDateOnly(r.order_date || r.request_date || r.created_at) || "",
          customer_name: r.customer_name || "",
          customer_phone: r.customer_phone || "",
          agent_name: r.agent_name || "",
          department: r.department || "",
          owner: r.owner || r.operation_owner || r.operations_owner || "",
          auditor_name: r.auditor_name || "",
          order_amount: parseNum(r.order_amount, 0),
          refund_amount: parseNum(r.refund_amount, 0),
          refund_reason: r.refund_reason || "",
          refund_sub_reason: r.refund_sub_reason || "",
          lose_on_employee: parseBool(r.lose_on_employee, false) ? "Yes" : "No",
          lose_employee_name: r.lose_employee_name || "",
          lose_amount: parseNum(r.lose_amount, 0),
          complaint_reason: r.complaint_reason || "",
          delay_reason: r.delay_reason || "",
          cancellation_reason: r.cancellation_reason || "",
          sla_status: r.sla_status || "Met SLA",
          qa_status: r.qa_status || "Pass",
          root_cause: r.root_cause || r.bucket_3_root_cause || "",
          sub_reason: r.sub_reason || "",
          error_classification: r.error_classification || "",
          corrective_action: r.corrective_action || r.action_required || "",
          manager_approval: r.manager_approval || "Pending",
          assigned_manager: r.assigned_manager || "",
          workflow_status: r.workflow_status || "Under Review",
          request_type: r.request_type || "",
          operations_status: r.operations_status || "",
          action_plan_required: parseBool(r.action_plan_required, false) ? "Yes" : "No",
          action_plan_type: r.action_plan_type || "",
          channel: r.channel || "",
          priority: r.priority || "",
          comment: r.comment || "",
        }));
      } else if (config.caseType === "nps") {
        const result = await pool.query(
          `SELECT * FROM qa_nps_feedbacks ORDER BY created_at DESC`
        );
        exportRows = (result.rows || []).map((r: any) => ({
          transaction_id: r.transaction_id || "",
          qa_reference_number: r.qa_reference_number || "",
          survey_date: parseDateOnly(r.survey_date || r.date || r.created_at) || "",
          customer_name: r.customer_name || "",
          agent_name: r.agent_name || "",
          rating: parseIntSafe(r.rating, 0),
          category: r.category || "",
          feedback_text: r.feedback_text || r.comment || "",
          delay_linked: parseBool(r.delay_linked, false) ? "Yes" : "No",
          root_cause: r.root_cause || "",
          corrective_action: r.corrective_action || "",
          owner: r.owner || r.operations_owner || "",
          auditor_name: r.auditor_name || "",
          status: r.status || "Reviewed",
        }));
      } else if (config.caseType === "action_plans") {
        const result = await pool.query(
          `SELECT * FROM qa_action_plans ORDER BY created_at DESC`
        );
        exportRows = (result.rows || []).map((r: any) => ({
          plan_code: r.plan_code || "",
          title: r.title || "",
          incident_type: r.incident_type || "complaint",
          transaction_id: r.transaction_id || "",
          customer_name: r.customer_name || "",
          agent_name: r.agent_name || "",
          department: r.department || "Operations",
          severity: r.severity || "Medium",
          status: r.status || "Open",
          current_step: parseIntSafe(r.current_step, 1),
          action_plan_type: r.action_plan_type || "Quality Action",
          root_cause_category: r.root_cause_category || "",
          root_cause_name: r.root_cause_name || "",
          root_cause_analysis: r.root_cause_analysis || "",
          assigned_to: r.assigned_to || "",
          target_completion_date: parseDateOnly(r.target_completion_date) || "",
          effectiveness_score: parseIntSafe(r.effectiveness_score, 100),
          verification_notes: r.verification_notes || "",
          verified_by: r.verified_by || "",
          created_by: r.created_by || "",
        }));
      } else if (config.caseType === "checklists") {
        const result = await pool.query(
          `SELECT * FROM qa_root_cause_presets ORDER BY type ASC, department ASC, id ASC`
        );
        exportRows = (result.rows || []).map((r: any) => ({
          type: r.type || "complaint",
          department: r.department || "",
          root_cause_name: r.root_cause_name || "",
          weight: parseNum(r.weight, 25),
          sub_reasons: formatSubReasonsForExport(r.sub_reasons),
          is_active: parseBool(r.is_active, true) ? "Yes" : "No",
        }));
      }

      return await sendWorkbookOrCsv(res, config, exportRows, { isTemplate: false });
    } catch (err: any) {
      console.error(`QA Excel export error (${config.caseType}):`, err);
      return res.status(500).json({ error: err?.message || "Failed to export Excel file" });
    }
  });

  // 3. Preview & Validate Uploaded Excel / CSV File before Saving
  router.post(
    "/excel/:caseType/import/preview",
    upload.single("file"),
    async (req: Request, res: Response) => {
      const config = resolveCaseConfig(req.params.caseType);
      if (!config) {
        return res.status(400).json({ error: `Unsupported QA case type: ${req.params.caseType}` });
      }
      if (!req.file) {
        return res.status(400).json({ error: "لم يتم رفع أي ملف. يرجى اختيار ملف Excel (.xlsx) أو CSV." });
      }

      try {
        const { headers, rows: rawRows } = await parseUploadedTabularFile(
          req.file.buffer,
          req.file.originalname
        );
        if (headers.length === 0) {
          return res.status(400).json({ error: "الملف فارغ ولا يحتوي على صف عناوين أعمدة." });
        }

        const { colIndexToKey, matchedColumns } = buildColumnMap(config.columns, headers);
        if (matchedColumns.length === 0) {
          return res.status(400).json({
            error: "لم يتم التعرف على أعمدة الملف. يرجى تحميل قالب Excel الرسمي أولاً وملء البيانات بنفس الأعمدة.",
          });
        }

        const filteredRawRows = rawRows.filter((r, idx) => {
          if (idx === 0 && isArabicSubHeaderRow(r.values, config.columns)) return false;
          return r.values.some((v) => v.trim().length > 0);
        });

        if (filteredRawRows.length === 0) {
          return res.status(400).json({ error: "لا توجد صفوف بيانات داخل الملف المرفوع." });
        }

        if (filteredRawRows.length > MAX_IMPORT_ROWS) {
          return res.status(400).json({
            error: `الحد الأقصى للاستيراد في المرة الواحدة هو ${MAX_IMPORT_ROWS} صف. الملف يحتوي على ${filteredRawRows.length} صف.`,
          });
        }

        // Load existing keys from DB to detect duplicates accurately
        const existingLookup = new Map<string, number>();

        if (config.incidentType) {
          const existingRes = await pool.query(
            `SELECT id, transaction_id, qa_reference_number FROM qa_transaction_audits WHERE type = $1`,
            [config.incidentType]
          );
          for (const r of existingRes.rows || []) {
            if (r.transaction_id) {
              existingLookup.set(`trx:${String(r.transaction_id).trim().toLowerCase()}`, Number(r.id));
            }
            if (r.qa_reference_number) {
              existingLookup.set(`ref:${String(r.qa_reference_number).trim().toLowerCase()}`, Number(r.id));
            }
          }
        } else if (config.caseType === "nps") {
          const existingRes = await pool.query(
            `SELECT id, transaction_id, qa_reference_number FROM qa_nps_feedbacks`
          );
          for (const r of existingRes.rows || []) {
            if (r.transaction_id) {
              existingLookup.set(`trx:${String(r.transaction_id).trim().toLowerCase()}`, Number(r.id));
            }
            if (r.qa_reference_number) {
              existingLookup.set(`ref:${String(r.qa_reference_number).trim().toLowerCase()}`, Number(r.id));
            }
          }
        } else if (config.caseType === "action_plans") {
          const existingRes = await pool.query(
            `SELECT id, plan_code, transaction_id, title FROM qa_action_plans`
          );
          for (const r of existingRes.rows || []) {
            if (r.plan_code) {
              existingLookup.set(`code:${String(r.plan_code).trim().toLowerCase()}`, Number(r.id));
            }
            if (r.transaction_id && r.title) {
              existingLookup.set(
                `tt:${String(r.transaction_id).trim().toLowerCase()}|${String(r.title).trim().toLowerCase()}`,
                Number(r.id)
              );
            }
          }
        } else if (config.caseType === "checklists") {
          const existingRes = await pool.query(
            `SELECT id, type, department, root_cause_name FROM qa_root_cause_presets`
          );
          for (const r of existingRes.rows || []) {
            const k = `${String(r.type || "").trim().toLowerCase()}|${String(r.department || "").trim().toLowerCase()}|${String(r.root_cause_name || "").trim().toLowerCase()}`;
            existingLookup.set(k, Number(r.id));
          }
        }

        const seenInFile = new Set<string>();
        const previewRows: any[] = [];
        let validCount = 0;
        let duplicateCount = 0;
        let errorCount = 0;

        for (const rawRow of filteredRawRows) {
          const obj: Record<string, any> = {};
          colIndexToKey.forEach((key, colIdx) => {
            obj[key] = rawRow.values[colIdx] !== undefined ? rawRow.values[colIdx].trim() : "";
          });

          const errors: string[] = [];
          const warnings: string[] = [];
          let existingId: number | null = null;
          let fileUniqueKey = "";

          if (config.incidentType) {
            const trxId = String(obj.transaction_id || "").trim();
            const custName = String(obj.customer_name || "").trim();
            if (!trxId) errors.push("رقم الطلب (Transaction_ID) مطلوب");
            if (!custName) errors.push("اسم العميل (Customer_Name) مطلوب");

            const orderDate = parseDateOnly(obj.order_date);
            if (obj.order_date && !orderDate) {
              warnings.push(`تنسيق تاريخ الطلب (${obj.order_date}) غير قياسي — سيتم استخدام تاريخ اليوم`);
            }

            const normalized: Record<string, any> = {
              type: config.incidentType,
              transaction_id: trxId,
              qa_reference_number: String(obj.qa_reference_number || "").trim(),
              order_date: orderDate,
              customer_name: custName,
              customer_phone: String(obj.customer_phone || "").trim(),
              agent_name: String(obj.agent_name || "").trim(),
              department: String(obj.department || "").trim() || "Operations",
              owner: String(obj.owner || "").trim(),
              auditor_name: String(obj.auditor_name || "").trim() || "QA Auditor",
              order_amount: parseNum(obj.order_amount, 0),
              refund_amount: parseNum(obj.refund_amount, 0),
              refund_reason: String(obj.refund_reason || "").trim(),
              refund_sub_reason: String(obj.refund_sub_reason || "").trim(),
              lose_on_employee: parseBool(obj.lose_on_employee, false),
              lose_employee_name: String(obj.lose_employee_name || "").trim(),
              lose_amount: parseNum(obj.lose_amount, 0),
              complaint_reason: String(obj.complaint_reason || "").trim(),
              delay_reason: String(obj.delay_reason || "").trim(),
              cancellation_reason: String(obj.cancellation_reason || "").trim(),
              sla_status: String(obj.sla_status || "").trim() || "Met SLA",
              qa_status: String(obj.qa_status || "").trim() || "Pass",
              root_cause: String(obj.root_cause || "").trim(),
              sub_reason: String(obj.sub_reason || "").trim(),
              error_classification: String(obj.error_classification || "").trim(),
              corrective_action: String(obj.corrective_action || "").trim(),
              manager_approval: String(obj.manager_approval || "").trim() || "Pending",
              assigned_manager: String(obj.assigned_manager || "").trim(),
              workflow_status: String(obj.workflow_status || "").trim() || "Under Review",
              request_type: String(obj.request_type || "").trim(),
              operations_status: String(obj.operations_status || "").trim(),
              action_plan_required: parseBool(obj.action_plan_required, false),
              action_plan_type: String(obj.action_plan_type || "").trim() || "Training Action",
              channel: String(obj.channel || "").trim(),
              priority: String(obj.priority || "").trim() || "Medium",
              comment: String(obj.comment || "").trim(),
            };

            if (trxId) {
              existingId =
                existingLookup.get(`trx:${trxId.toLowerCase()}`) ??
                (normalized.qa_reference_number
                  ? existingLookup.get(`ref:${normalized.qa_reference_number.toLowerCase()}`) ?? null
                  : null);
              fileUniqueKey = trxId.toLowerCase();
            }

            if (fileUniqueKey && seenInFile.has(fileUniqueKey)) {
              warnings.push("رقم الطلب مكرر داخل نفس الملف");
            }
            if (fileUniqueKey) seenInFile.add(fileUniqueKey);

            const rowStatus =
              errors.length > 0 ? "error" : existingId !== null ? "duplicate" : "valid";
            if (rowStatus === "error") errorCount++;
            else if (rowStatus === "duplicate") duplicateCount++;
            else validCount++;

            previewRows.push({
              rowNumber: rawRow.rowNumber,
              ...normalized,
              rowStatus,
              existingId,
              errors,
              warnings,
            });
          } else if (config.caseType === "nps") {
            const trxId = String(obj.transaction_id || "").trim();
            const custName = String(obj.customer_name || "").trim();
            const agentName = String(obj.agent_name || "").trim() || "Unassigned";
            const rawRating = String(obj.rating ?? "").trim();
            const ratingVal = rawRating === "" ? NaN : parseNum(rawRating, NaN);

            if (!trxId) errors.push("رقم الطلب (Transaction_ID) مطلوب");
            if (!custName) errors.push("اسم العميل (Customer_Name) مطلوب");
            if (!Number.isFinite(ratingVal) || ratingVal < 0 || ratingVal > 10) {
              errors.push("التقييم (Rating) يجب أن يكون رقماً من 0 إلى 10");
            }

            const finalRating = Number.isFinite(ratingVal) ? Math.round(ratingVal) : 0;
            const computedCategory =
              String(obj.category || "").trim() ||
              (finalRating >= 9 ? "Promoter" : finalRating >= 7 ? "Passive" : "Detractor");
            const surveyDate = parseDateOnly(obj.survey_date);

            const normalized = {
              transaction_id: trxId,
              qa_reference_number: String(obj.qa_reference_number || "").trim(),
              survey_date: surveyDate,
              customer_name: custName,
              agent_name: agentName,
              rating: finalRating,
              category: computedCategory,
              feedback_text: String(obj.feedback_text || "").trim(),
              delay_linked: parseBool(obj.delay_linked, false),
              root_cause: String(obj.root_cause || "").trim(),
              corrective_action: String(obj.corrective_action || "").trim(),
              owner: String(obj.owner || "").trim(),
              auditor_name: String(obj.auditor_name || "").trim() || "QA Auditor",
              status: String(obj.status || "").trim() || "Reviewed",
            };

            if (trxId) {
              existingId =
                existingLookup.get(`trx:${trxId.toLowerCase()}`) ??
                (normalized.qa_reference_number
                  ? existingLookup.get(`ref:${normalized.qa_reference_number.toLowerCase()}`) ?? null
                  : null);
              fileUniqueKey = trxId.toLowerCase();
            }
            if (fileUniqueKey && seenInFile.has(fileUniqueKey)) {
              warnings.push("رقم الطلب مكرر داخل نفس الملف");
            }
            if (fileUniqueKey) seenInFile.add(fileUniqueKey);

            const rowStatus =
              errors.length > 0 ? "error" : existingId !== null ? "duplicate" : "valid";
            if (rowStatus === "error") errorCount++;
            else if (rowStatus === "duplicate") duplicateCount++;
            else validCount++;

            previewRows.push({
              rowNumber: rawRow.rowNumber,
              ...normalized,
              rowStatus,
              existingId,
              errors,
              warnings,
            });
          } else if (config.caseType === "action_plans") {
            const title = String(obj.title || "").trim();
            const rawIncType = String(obj.incident_type || "").trim();
            const incidentType = normalizeIncidentTypeValue(rawIncType, "complaint");
            if (!title) errors.push("عنوان خطة العمل (Title) مطلوب");
            if (!rawIncType) warnings.push("لم يُحدد نوع الحالة — سيتم تعيينه كـ complaint");

            const planCode = String(obj.plan_code || "").trim();
            const trxId = String(obj.transaction_id || "").trim();
            const targetDate = parseDateOnly(obj.target_completion_date);
            const currentStep = Math.min(5, Math.max(1, parseIntSafe(obj.current_step, 1)));
            const effScore = Math.min(100, Math.max(0, parseIntSafe(obj.effectiveness_score, 100)));

            const normalized = {
              plan_code: planCode,
              title,
              incident_type: incidentType,
              transaction_id: trxId,
              customer_name: String(obj.customer_name || "").trim(),
              agent_name: String(obj.agent_name || "").trim(),
              department: String(obj.department || "").trim() || "Operations",
              severity: String(obj.severity || "").trim() || "Medium",
              status: String(obj.status || "").trim() || "Open",
              current_step: currentStep,
              action_plan_type: String(obj.action_plan_type || "").trim() || "Quality Action",
              root_cause_category: String(obj.root_cause_category || "").trim() || String(obj.department || "").trim() || "Operations",
              root_cause_name: String(obj.root_cause_name || "").trim(),
              root_cause_analysis: String(obj.root_cause_analysis || "").trim(),
              assigned_to: String(obj.assigned_to || "").trim(),
              target_completion_date: targetDate,
              effectiveness_score: effScore,
              verification_notes: String(obj.verification_notes || "").trim(),
              verified_by: String(obj.verified_by || "").trim(),
              created_by: String(obj.created_by || "").trim() || "QA Specialist",
            };

            if (planCode) {
              existingId = existingLookup.get(`code:${planCode.toLowerCase()}`) ?? null;
              fileUniqueKey = `code:${planCode.toLowerCase()}`;
            } else if (trxId && title) {
              existingId = existingLookup.get(`tt:${trxId.toLowerCase()}|${title.toLowerCase()}`) ?? null;
              fileUniqueKey = `tt:${trxId.toLowerCase()}|${title.toLowerCase()}`;
            }
            if (fileUniqueKey && seenInFile.has(fileUniqueKey)) {
              warnings.push("خطة العمل مكررة داخل نفس الملف");
            }
            if (fileUniqueKey) seenInFile.add(fileUniqueKey);

            const rowStatus =
              errors.length > 0 ? "error" : existingId !== null ? "duplicate" : "valid";
            if (rowStatus === "error") errorCount++;
            else if (rowStatus === "duplicate") duplicateCount++;
            else validCount++;

            previewRows.push({
              rowNumber: rawRow.rowNumber,
              ...normalized,
              rowStatus,
              existingId,
              errors,
              warnings,
            });
          } else if (config.caseType === "checklists") {
            const rawType = String(obj.type || "").trim();
            const typeVal = normalizeIncidentTypeValue(rawType, "complaint");
            const dept = String(obj.department || "").trim();
            const rcName = String(obj.root_cause_name || "").trim();

            if (!rawType) errors.push("نوع الحالة (Incident_Type) مطلوب (complaint/delay/refund/cancellation)");
            if (!dept) errors.push("القسم (Department) مطلوب");
            if (!rcName) errors.push("اسم السبب الجذري (Root_Cause_Name) مطلوب");
            if (typeVal === "nps") {
              errors.push("قوائم التدقيق تدعم الأنواع: complaint, delay, refund, cancellation فقط");
            }

            const weightVal = parseNum(obj.weight, 25);
            const subReasonsArr = parseSubReasonsForStorage(obj.sub_reasons);
            const isActive = parseBool(obj.is_active, true);

            const normalized = {
              type: typeVal,
              department: dept,
              root_cause_name: rcName,
              weight: weightVal,
              sub_reasons: subReasonsArr,
              sub_reasons_display: formatSubReasonsForExport(subReasonsArr),
              is_active: isActive,
            };

            const dupKey = `${typeVal.toLowerCase()}|${dept.toLowerCase()}|${rcName.toLowerCase()}`;
            existingId = existingLookup.get(dupKey) ?? null;
            if (seenInFile.has(dupKey)) {
              warnings.push("البند مكرر داخل نفس الملف");
            }
            seenInFile.add(dupKey);

            const rowStatus =
              errors.length > 0 ? "error" : existingId !== null ? "duplicate" : "valid";
            if (rowStatus === "error") errorCount++;
            else if (rowStatus === "duplicate") duplicateCount++;
            else validCount++;

            previewRows.push({
              rowNumber: rawRow.rowNumber,
              ...normalized,
              rowStatus,
              existingId,
              errors,
              warnings,
            });
          }
        }

        const previewColumns = config.columns
          .filter((c) => c.preview)
          .map((c) => ({
            key: c.key === "sub_reasons" ? "sub_reasons_display" : c.key,
            label: c.header.replace(/\s*\*/, ""),
            arLabel: c.arLabel,
          }));

        return res.json({
          fileName: req.file.originalname,
          dialect: getDbType(),
          caseType: config.caseType,
          caseLabelEn: config.labelEn,
          caseLabelAr: config.labelAr,
          matchedColumns,
          previewColumns,
          totalRows: previewRows.length,
          validCount,
          duplicateCount,
          errorCount,
          rows: previewRows,
        });
      } catch (err: any) {
        console.error(`QA Excel preview error (${config.caseType}):`, err);
        return res.status(500).json({ error: err?.message || "حدث خطأ أثناء قراءة وفحص الملف." });
      }
    }
  );

  // 4. Commit Validated Rows into MySQL / MariaDB / PostgreSQL
  router.post("/excel/:caseType/import", async (req: Request, res: Response) => {
    const config = resolveCaseConfig(req.params.caseType);
    if (!config) {
      return res.status(400).json({ error: `Unsupported QA case type: ${req.params.caseType}` });
    }

    const { rows, duplicateMode = "skip" } = req.body || {};
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: "لا توجد صفوف صالحة للاستيراد." });
    }
    if (rows.length > MAX_IMPORT_ROWS) {
      return res.status(400).json({ error: `الحد الأقصى ${MAX_IMPORT_ROWS} صف في العملية الواحدة.` });
    }

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;
    const errors: Array<{ rowNumber: number; label: string; error: string }> = [];

    for (const row of rows) {
      const rowNum = Number(row.rowNumber) || 0;
      const rowLabel =
        row.transaction_id || row.plan_code || row.root_cause_name || row.title || `Row #${rowNum}`;

      if (row.rowStatus === "error") {
        skipped++;
        continue;
      }

      try {
        if (config.incidentType) {
          const incType = config.incidentType;
          const trxId = String(row.transaction_id || "").trim();
          const custName = String(row.customer_name || "").trim();
          if (!trxId || !custName) {
            failed++;
            errors.push({ rowNumber: rowNum, label: rowLabel, error: "Transaction_ID و Customer_Name مطلوبان" });
            continue;
          }

          // Re-check live DB to prevent race duplicates
          let targetId: number | null = row.existingId ? Number(row.existingId) : null;
          if (!targetId) {
            const dupCheck = await pool.query(
              `SELECT id FROM qa_transaction_audits WHERE type = $1 AND LOWER(transaction_id) = LOWER($2) LIMIT 1`,
              [incType, trxId]
            );
            if (dupCheck.rows.length > 0) {
              targetId = Number(dupCheck.rows[0].id);
            }
          }

          if (targetId && duplicateMode !== "update") {
            skipped++;
            continue;
          }

          const orderDateVal = toMysqlDateTime(row.order_date) || new Date().toISOString().slice(0, 19).replace("T", " ");
          const safeQaRef =
            String(row.qa_reference_number || "").trim() ||
            `QA-${incType.toUpperCase().slice(0, 3)}-${Math.floor(100000 + Math.random() * 900000)}`;
          const ownerVal = String(row.owner || "").trim();
          const detailsPayload = JSON.stringify({
            qa_reference_number: safeQaRef,
            owner: ownerVal,
            operations_owner: ownerVal,
            imported_via: "excel_bulk_import",
          });

          if (targetId) {
            await pool.query(
              `UPDATE qa_transaction_audits SET
                qa_reference_number = COALESCE(NULLIF($1, ''), qa_reference_number),
                agent_name = $2,
                customer_name = $3,
                customer_phone = $4,
                order_amount = $5,
                order_date = $6,
                sla_status = $7,
                auditor_name = $8,
                qa_status = $9,
                department = $10,
                root_cause = $11,
                sub_reason = $12,
                error_classification = $13,
                refund_amount = $14,
                refund_reason = $15,
                refund_sub_reason = $16,
                lose_on_employee = $17,
                lose_employee_name = $18,
                lose_amount = $19,
                complaint_reason = $20,
                delay_reason = $21,
                cancellation_reason = $22,
                corrective_action = $23,
                manager_approval = $24,
                assigned_manager = $25,
                workflow_status = $26,
                owner = $27,
                request_type = $28,
                operations_status = $29,
                action_plan_required = $30,
                action_plan_type = $31,
                channel = $32,
                priority = $33,
                comment = $34,
                details = $35,
                updated_at = CURRENT_TIMESTAMP
              WHERE id = $36`,
              [
                safeQaRef,
                String(row.agent_name || "").trim(),
                custName,
                String(row.customer_phone || "").trim(),
                parseNum(row.order_amount, 0),
                orderDateVal,
                String(row.sla_status || "Met SLA").trim(),
                String(row.auditor_name || "QA Auditor").trim(),
                String(row.qa_status || "Pass").trim(),
                String(row.department || "Operations").trim(),
                String(row.root_cause || "").trim(),
                String(row.sub_reason || "").trim(),
                String(row.error_classification || "").trim(),
                parseNum(row.refund_amount, 0),
                String(row.refund_reason || "").trim(),
                String(row.refund_sub_reason || "").trim(),
                parseBool(row.lose_on_employee, false),
                String(row.lose_employee_name || "").trim(),
                parseNum(row.lose_amount, 0),
                String(row.complaint_reason || "").trim(),
                String(row.delay_reason || "").trim(),
                String(row.cancellation_reason || "").trim(),
                String(row.corrective_action || "").trim(),
                String(row.manager_approval || "Pending").trim(),
                String(row.assigned_manager || "").trim(),
                String(row.workflow_status || "Under Review").trim(),
                ownerVal,
                String(row.request_type || "").trim(),
                String(row.operations_status || "").trim(),
                parseBool(row.action_plan_required, false),
                String(row.action_plan_type || "Training Action").trim(),
                String(row.channel || "").trim(),
                String(row.priority || "Medium").trim(),
                String(row.comment || "").trim(),
                detailsPayload,
                targetId,
              ]
            );
            updated++;
          } else {
            await pool.query(
              `INSERT INTO qa_transaction_audits (
                type, transaction_id, qa_reference_number, agent_name, customer_name, customer_phone,
                order_amount, order_date, sla_status, auditor_name, qa_status, department,
                root_cause, sub_reason, error_classification, switches,
                refund_amount, refund_reason, refund_sub_reason, lose_on_employee, lose_employee_name, lose_amount,
                complaint_reason, delay_reason, cancellation_reason,
                corrective_action, manager_approval, assigned_manager, workflow_status,
                owner, request_type, operations_status, action_plan_required, action_plan_type,
                channel, priority, comment, details, current_step, created_at, updated_at
              ) VALUES (
                $1, $2, $3, $4, $5, $6,
                $7, $8, $9, $10, $11, $12,
                $13, $14, $15, $16,
                $17, $18, $19, $20, $21, $22,
                $23, $24, $25,
                $26, $27, $28, $29,
                $30, $31, $32, $33, $34,
                $35, $36, $37, $38, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
              )`,
              [
                incType,
                trxId,
                safeQaRef,
                String(row.agent_name || "").trim(),
                custName,
                String(row.customer_phone || "").trim(),
                parseNum(row.order_amount, 0),
                orderDateVal,
                String(row.sla_status || "Met SLA").trim(),
                String(row.auditor_name || "QA Auditor").trim(),
                String(row.qa_status || "Pass").trim(),
                String(row.department || "Operations").trim(),
                String(row.root_cause || "").trim(),
                String(row.sub_reason || "").trim(),
                String(row.error_classification || "").trim(),
                JSON.stringify({}),
                parseNum(row.refund_amount, 0),
                String(row.refund_reason || "").trim(),
                String(row.refund_sub_reason || "").trim(),
                parseBool(row.lose_on_employee, false),
                String(row.lose_employee_name || "").trim(),
                parseNum(row.lose_amount, 0),
                String(row.complaint_reason || "").trim(),
                String(row.delay_reason || "").trim(),
                String(row.cancellation_reason || "").trim(),
                String(row.corrective_action || "").trim(),
                String(row.manager_approval || "Pending").trim(),
                String(row.assigned_manager || "").trim(),
                String(row.workflow_status || "Under Review").trim(),
                ownerVal,
                String(row.request_type || "").trim(),
                String(row.operations_status || "").trim(),
                parseBool(row.action_plan_required, false),
                String(row.action_plan_type || "Training Action").trim(),
                String(row.channel || "").trim(),
                String(row.priority || "Medium").trim(),
                String(row.comment || "").trim(),
                detailsPayload,
              ]
            );
            imported++;
          }
        } else if (config.caseType === "nps") {
          const trxId = String(row.transaction_id || "").trim();
          const custName = String(row.customer_name || "").trim();
          const agentName = String(row.agent_name || "Unassigned").trim();
          const rating = Math.min(10, Math.max(0, parseIntSafe(row.rating, 0)));
          const category =
            String(row.category || "").trim() ||
            (rating >= 9 ? "Promoter" : rating >= 7 ? "Passive" : "Detractor");

          let targetId: number | null = row.existingId ? Number(row.existingId) : null;
          if (!targetId && trxId) {
            const dupCheck = await pool.query(
              `SELECT id FROM qa_nps_feedbacks WHERE LOWER(transaction_id) = LOWER($1) LIMIT 1`,
              [trxId]
            );
            if (dupCheck.rows.length > 0) targetId = Number(dupCheck.rows[0].id);
          }

          if (targetId && duplicateMode !== "update") {
            skipped++;
            continue;
          }

          const safeQaRef =
            String(row.qa_reference_number || "").trim() ||
            `QA-NPS-${Math.floor(100000 + Math.random() * 900000)}`;
          const surveyDateVal = toMysqlDateTime(row.survey_date);
          const feedback = String(row.feedback_text || "").trim();
          const ownerVal = String(row.owner || "").trim();
          const detailsPayload = JSON.stringify({
            qa_reference_number: safeQaRef,
            owner: ownerVal,
            operations_owner: ownerVal,
            comment: feedback,
            imported_via: "excel_bulk_import",
          });

          if (targetId) {
            await pool.query(
              `UPDATE qa_nps_feedbacks SET
                qa_reference_number = COALESCE(NULLIF($1, ''), qa_reference_number),
                customer_name = $2,
                agent_name = $3,
                rating = $4,
                category = $5,
                feedback_text = $6,
                comment = $7,
                delay_linked = $8,
                root_cause = $9,
                corrective_action = $10,
                owner = $11,
                operations_owner = $12,
                auditor_name = $13,
                status = $14,
                survey_date = COALESCE($15, survey_date),
                date = COALESCE($16, date),
                details = $17,
                updated_at = CURRENT_TIMESTAMP
              WHERE id = $18`,
              [
                safeQaRef,
                custName,
                agentName,
                rating,
                category,
                feedback,
                feedback,
                parseBool(row.delay_linked, false),
                String(row.root_cause || "").trim(),
                String(row.corrective_action || "").trim(),
                ownerVal,
                ownerVal,
                String(row.auditor_name || "QA Auditor").trim(),
                String(row.status || "Reviewed").trim(),
                surveyDateVal,
                surveyDateVal,
                detailsPayload,
                targetId,
              ]
            );
            updated++;
          } else {
            await pool.query(
              `INSERT INTO qa_nps_feedbacks (
                transaction_id, qa_reference_number, customer_name, agent_name,
                rating, category, feedback_text, comment, delay_linked,
                root_cause, corrective_action, owner, operations_owner,
                auditor_name, status, survey_date, date, details,
                created_at, updated_at
              ) VALUES (
                $1, $2, $3, $4,
                $5, $6, $7, $8, $9,
                $10, $11, $12, $13,
                $14, $15, $16, $17, $18,
                COALESCE($19, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP
              )`,
              [
                trxId,
                safeQaRef,
                custName,
                agentName,
                rating,
                category,
                feedback,
                feedback,
                parseBool(row.delay_linked, false),
                String(row.root_cause || "").trim(),
                String(row.corrective_action || "").trim(),
                ownerVal,
                ownerVal,
                String(row.auditor_name || "QA Auditor").trim(),
                String(row.status || "Reviewed").trim(),
                surveyDateVal,
                surveyDateVal,
                detailsPayload,
                surveyDateVal,
              ]
            );
            imported++;
          }
        } else if (config.caseType === "action_plans") {
          const title = String(row.title || "").trim();
          const incType = normalizeIncidentTypeValue(row.incident_type, "complaint");
          const planCode =
            String(row.plan_code || "").trim() ||
            `AP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
          const trxId = String(row.transaction_id || "").trim();

          let targetId: number | null = row.existingId ? Number(row.existingId) : null;
          if (!targetId && row.plan_code) {
            const dupCheck = await pool.query(
              `SELECT id FROM qa_action_plans WHERE LOWER(plan_code) = LOWER($1) LIMIT 1`,
              [planCode]
            );
            if (dupCheck.rows.length > 0) targetId = Number(dupCheck.rows[0].id);
          }

          if (targetId && duplicateMode !== "update") {
            skipped++;
            continue;
          }

          const targetDate = parseDateOnly(row.target_completion_date);
          const currentStep = Math.min(5, Math.max(1, parseIntSafe(row.current_step, 1)));
          const effScore = Math.min(100, Math.max(0, parseIntSafe(row.effectiveness_score, 100)));

          if (targetId) {
            await pool.query(
              `UPDATE qa_action_plans SET
                title = $1,
                incident_type = $2,
                transaction_id = $3,
                customer_name = $4,
                agent_name = $5,
                department = $6,
                severity = $7,
                status = $8,
                current_step = $9,
                action_plan_type = $10,
                root_cause_category = $11,
                root_cause_name = $12,
                root_cause_analysis = $13,
                assigned_to = $14,
                target_completion_date = $15,
                effectiveness_score = $16,
                verification_notes = $17,
                verified_by = $18,
                updated_at = CURRENT_TIMESTAMP
              WHERE id = $19`,
              [
                title,
                incType,
                trxId,
                String(row.customer_name || "").trim(),
                String(row.agent_name || "").trim(),
                String(row.department || "Operations").trim(),
                String(row.severity || "Medium").trim(),
                String(row.status || "Open").trim(),
                currentStep,
                String(row.action_plan_type || "Quality Action").trim(),
                String(row.root_cause_category || row.department || "Operations").trim(),
                String(row.root_cause_name || "").trim(),
                String(row.root_cause_analysis || "").trim(),
                String(row.assigned_to || "").trim(),
                targetDate,
                effScore,
                String(row.verification_notes || "").trim(),
                String(row.verified_by || "").trim() || null,
                targetId,
              ]
            );
            updated++;
          } else {
            await pool.query(
              `INSERT INTO qa_action_plans (
                plan_code, title, incident_type, transaction_id, customer_name, agent_name,
                department, severity, status, current_step, action_plan_type,
                root_cause_category, root_cause_name, root_cause_analysis,
                five_whys, action_rules, action_details,
                assigned_to, target_completion_date, effectiveness_score,
                verification_notes, verified_by, created_by,
                created_at, updated_at
              ) VALUES (
                $1, $2, $3, $4, $5, $6,
                $7, $8, $9, $10, $11,
                $12, $13, $14,
                $15, $16, $17,
                $18, $19, $20,
                $21, $22, $23,
                CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
              )`,
              [
                planCode,
                title,
                incType,
                trxId,
                String(row.customer_name || "").trim(),
                String(row.agent_name || "").trim(),
                String(row.department || "Operations").trim(),
                String(row.severity || "Medium").trim(),
                String(row.status || "Open").trim(),
                currentStep,
                String(row.action_plan_type || "Quality Action").trim(),
                String(row.root_cause_category || row.department || "Operations").trim(),
                String(row.root_cause_name || "").trim(),
                String(row.root_cause_analysis || "").trim(),
                JSON.stringify([]),
                JSON.stringify([]),
                JSON.stringify([]),
                String(row.assigned_to || "").trim(),
                targetDate,
                effScore,
                String(row.verification_notes || "").trim(),
                String(row.verified_by || "").trim() || null,
                String(row.created_by || "QA Specialist").trim(),
              ]
            );
            imported++;
          }
        } else if (config.caseType === "checklists") {
          const typeVal = normalizeIncidentTypeValue(row.type, "complaint");
          const dept = String(row.department || "").trim();
          const rcName = String(row.root_cause_name || "").trim();
          const weightVal = parseNum(row.weight, 25);
          const subReasonsJson = JSON.stringify(parseSubReasonsForStorage(row.sub_reasons));
          const isActive = parseBool(row.is_active, true);

          let targetId: number | null = row.existingId ? Number(row.existingId) : null;
          if (!targetId) {
            const dupCheck = await pool.query(
              `SELECT id FROM qa_root_cause_presets WHERE LOWER(type) = LOWER($1) AND LOWER(department) = LOWER($2) AND LOWER(root_cause_name) = LOWER($3) LIMIT 1`,
              [typeVal, dept, rcName]
            );
            if (dupCheck.rows.length > 0) targetId = Number(dupCheck.rows[0].id);
          }

          if (targetId && duplicateMode !== "update") {
            skipped++;
            continue;
          }

          if (targetId) {
            await pool.query(
              `UPDATE qa_root_cause_presets
               SET weight = $1, sub_reasons = $2, is_active = $3
               WHERE id = $4`,
              [weightVal, subReasonsJson, isActive, targetId]
            );
            updated++;
          } else {
            await pool.query(
              `INSERT INTO qa_root_cause_presets (type, department, root_cause_name, sub_reasons, weight, is_active, created_at)
               VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
              [typeVal, dept, rcName, subReasonsJson, weightVal, isActive]
            );
            imported++;
          }
        }
      } catch (rowErr: any) {
        console.error(`QA Excel import row #${rowNum} failed (${config.caseType}):`, rowErr);
        failed++;
        errors.push({
          rowNumber: rowNum,
          label: String(rowLabel),
          error: rowErr?.message || "Database insert/update error",
        });
      }
    }

    if (config.caseType === "checklists") {
      memoryCache.del("qa:presets");
    }

    return res.json({
      success: true,
      dialect: getDbType(),
      caseType: config.caseType,
      imported,
      updated,
      skipped,
      failed,
      errors,
    });
  });

  return router;
}
