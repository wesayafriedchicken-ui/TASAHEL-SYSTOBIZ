import express, { Request, Response } from "express";
import multer from "multer";
import ExcelJS from "exceljs";
import Papa from "papaparse";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { pool, getDbType } from "../../db/schema.js";
import { checkPermission } from "../../middleware/auth.js";
import { memoryCache } from "../../utils/cache.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB max
  },
});

const MAX_IMPORT_ROWS = 2000;

interface TemplateColumnDef {
  key: string;
  header: string;
  arLabel: string;
  required?: boolean;
  width: number;
  example1: string | number;
  example2: string | number;
  notes: string;
  aliases: string[];
}

const TEMPLATE_COLUMNS: TemplateColumnDef[] = [
  {
    key: "employee_id",
    header: "Employee_ID",
    arLabel: "كود الموظف / رقم البصمة",
    width: 18,
    example1: "EMP-1001",
    example2: "EMP-1002",
    notes: "اختياري لكنه فريد لكل موظف (مهم للربط مع جهاز البصمة). Optional unique employee/biometric ID.",
    aliases: ["employee_id", "emp_id", "emp id", "id_number", "code", "employee code", "كود الموظف", "رقم الموظف", "رقم البصمة", "الكود"],
  },
  {
    key: "name",
    header: "Full_Name *",
    arLabel: "الاسم الكامل (مطلوب)",
    required: true,
    width: 26,
    example1: "Ahmed Mohamed Hassan",
    example2: "Sara Ali Mahmoud",
    notes: "مطلوب — الاسم الكامل للموظف. Required — Employee full name.",
    aliases: ["full_name", "full name", "name", "employee_name", "employee name", "الاسم", "الاسم الكامل", "اسم الموظف"],
  },
  {
    key: "email",
    header: "Email *",
    arLabel: "البريد الإلكتروني للعمل (مطلوب)",
    required: true,
    width: 28,
    example1: "ahmed.hassan@company.com",
    example2: "sara.mahmoud@company.com",
    notes: "مطلوب وفريد — البريد الإلكتروني للعمل. Required & unique work email.",
    aliases: ["email", "work_email", "work email", "e-mail", "البريد الإلكتروني", "البريد الالكتروني", "الايميل", "بريد العمل"],
  },
  {
    key: "department",
    header: "Department",
    arLabel: "القسم",
    width: 22,
    example1: "Operations",
    example2: "Human Resources",
    notes: "اسم القسم (يفضل مطابقة الأقسام المسجلة في شيت Instructions). Department name.",
    aliases: ["department", "department_name", "dept", "القسم", "الادارة", "الإدارة"],
  },
  {
    key: "team_name",
    header: "Team",
    arLabel: "الفريق",
    width: 20,
    example1: "Core Operations",
    example2: "People Operations",
    notes: "اسم الفريق داخل القسم. Team name inside the department.",
    aliases: ["team", "team_name", "teams", "الفريق", "فريق العمل"],
  },
  {
    key: "job_title",
    header: "Job_Title",
    arLabel: "المسمى الوظيفي",
    width: 24,
    example1: "Operations Specialist",
    example2: "HR Coordinator",
    notes: "المسمى الوظيفي للموظف. Employee job title.",
    aliases: ["job_title", "job title", "position", "title", "role_title", "المسمى الوظيفي", "الوظيفة"],
  },
  {
    key: "manager_ref",
    header: "Manager_Email_Or_Name",
    arLabel: "المدير المباشر (الاسم أو البريد)",
    width: 26,
    example1: "System Administrator",
    example2: "ahmed.hassan@company.com",
    notes: "اسم أو بريد المدير المباشر (يربط الهيكل التنظيمي تلقائياً). Direct manager name or email.",
    aliases: ["manager_email_or_name", "manager", "reporting_to", "reporting to", "manager_name", "direct_manager", "المدير المباشر", "المدير"],
  },
  {
    key: "phone",
    header: "Phone",
    arLabel: "رقم الهاتف / الموبايل",
    width: 18,
    example1: "01012345678",
    example2: "01198765432",
    notes: "رقم الموبايل أو الهاتف. Mobile / phone number.",
    aliases: ["phone", "mobile", "mobile_phone", "phone_number", "رقم الهاتف", "الهاتف", "الموبايل", "الجوال"],
  },
  {
    key: "extension_number",
    header: "Extension",
    arLabel: "التحويلة الداخلية (Ext)",
    width: 14,
    example1: "101",
    example2: "102",
    notes: "رقم التحويلة الداخلية. Internal phone extension.",
    aliases: ["extension", "ext", "extension_number", "التحويلة", "رقم التحويلة"],
  },
  {
    key: "status",
    header: "Status",
    arLabel: "الحالة",
    width: 14,
    example1: "active",
    example2: "active",
    notes: "القيم المقبولة: active أو inactive (الافتراضي active). Values: active / inactive.",
    aliases: ["status", "employment_status", "الحالة", "حالة الموظف"],
  },
  {
    key: "contract_type",
    header: "Contract_Type",
    arLabel: "نوع العقد",
    width: 16,
    example1: "Full-time",
    example2: "Full-time",
    notes: "Full-time, Part-time, Contract, Intern",
    aliases: ["contract_type", "contract type", "نوع العقد", "العقد"],
  },
  {
    key: "hire_date",
    header: "Hire_Date",
    arLabel: "تاريخ التعيين",
    width: 16,
    example1: "2026-01-15",
    example2: "2026-02-01",
    notes: "صيغة التاريخ: YYYY-MM-DD (مثال 2026-01-15). Format: YYYY-MM-DD.",
    aliases: ["hire_date", "hire date", "contract_start_date", "joined_at", "start_date", "تاريخ التعيين", "تاريخ بداية العقد", "تاريخ الانضمام"],
  },
  {
    key: "contract_end_date",
    header: "Contract_End_Date",
    arLabel: "تاريخ انتهاء العقد",
    width: 18,
    example1: "2027-01-15",
    example2: "",
    notes: "اختياري — صيغة التاريخ: YYYY-MM-DD. Optional contract end date.",
    aliases: ["contract_end_date", "contract end date", "end_date", "تاريخ انتهاء العقد", "نهاية العقد"],
  },
  {
    key: "salary_base",
    header: "Salary_Base",
    arLabel: "الراتب الأساسي",
    width: 16,
    example1: 12000,
    example2: 9500,
    notes: "رقم فقط بدون رموز عملة (مثال: 12000). Numeric base salary.",
    aliases: ["salary_base", "salary", "base_salary", "basic_salary", "الراتب", "الراتب الأساسي", "الراتب الاساسي"],
  },
  {
    key: "allowances",
    header: "Allowances",
    arLabel: "البدلات",
    width: 14,
    example1: 1500,
    example2: 1000,
    notes: "رقم فقط (مثال: 1500). Numeric monthly allowances.",
    aliases: ["allowances", "allowance", "البدلات"],
  },
  {
    key: "currency",
    header: "Currency",
    arLabel: "العملة",
    width: 12,
    example1: "EGP",
    example2: "EGP",
    notes: "رمز العملة: EGP, SAR, USD, AED, EUR.",
    aliases: ["currency", "العملة"],
  },
  {
    key: "vacation_balance",
    header: "Vacation_Balance",
    arLabel: "رصيد الإجازات السنوية",
    width: 18,
    example1: 21,
    example2: 21,
    notes: "رصيد الإجازات السنوية بالأيام (الافتراضي 21). Annual leave days.",
    aliases: ["vacation_balance", "annual_leave", "vacation", "رصيد الإجازات", "رصيد الاجازات"],
  },
  {
    key: "sick_leave_balance",
    header: "Sick_Leave_Balance",
    arLabel: "رصيد الإجازات المرضية",
    width: 18,
    example1: 7,
    example2: 7,
    notes: "رصيد الإجازات المرضية بالأيام (الافتراضي 7). Sick leave days.",
    aliases: ["sick_leave_balance", "sick_leave", "الاجازات المرضية", "الإجازات المرضية"],
  },
  {
    key: "attendance_method",
    header: "Attendance_Method",
    arLabel: "طريقة تسجيل الحضور",
    width: 24,
    example1: "Fingerprint / Biometric",
    example2: "Login System",
    notes: "Login System, Fingerprint / Biometric, Mobile App, Remote",
    aliases: ["attendance_method", "attendance", "طريقة الحضور"],
  },
  {
    key: "national_id",
    header: "National_ID",
    arLabel: "الرقم القومي / الهوية",
    width: 20,
    example1: "29505200101234",
    example2: "29708150105678",
    notes: "الرقم القومي أو رقم الهوية الوطنية. National ID number.",
    aliases: ["national_id", "national id", "nid", "الرقم القومي", "رقم الهوية", "الهوية"],
  },
  {
    key: "gender",
    header: "Gender",
    arLabel: "النوع",
    width: 12,
    example1: "Male",
    example2: "Female",
    notes: "Male أو Female.",
    aliases: ["gender", "النوع", "الجنس"],
  },
  {
    key: "date_of_birth",
    header: "Date_Of_Birth",
    arLabel: "تاريخ الميلاد",
    width: 16,
    example1: "1995-05-20",
    example2: "1997-08-15",
    notes: "صيغة التاريخ: YYYY-MM-DD.",
    aliases: ["date_of_birth", "dob", "birth_date", "تاريخ الميلاد"],
  },
  {
    key: "nationality",
    header: "Nationality",
    arLabel: "الجنسية",
    width: 16,
    example1: "Egyptian",
    example2: "Egyptian",
    notes: "الجنسية. Nationality.",
    aliases: ["nationality", "الجنسية"],
  },
  {
    key: "marital_status",
    header: "Marital_Status",
    arLabel: "الحالة الاجتماعية",
    width: 16,
    example1: "Single",
    example2: "Married",
    notes: "Single, Married, Divorced, Widowed.",
    aliases: ["marital_status", "الحالة الاجتماعية"],
  },
  {
    key: "work_location",
    header: "Work_Location",
    arLabel: "موقع العمل",
    width: 24,
    example1: "Main Headquarter (Cairo)",
    example2: "Main Headquarter (Cairo)",
    notes: "فرع أو مقر العمل. Work branch / office location.",
    aliases: ["work_location", "location", "branch", "موقع العمل", "الفرع", "المقر"],
  },
  {
    key: "job_grade",
    header: "Job_Grade",
    arLabel: "الدرجة الوظيفية",
    width: 14,
    example1: "L2",
    example2: "L1",
    notes: "الدرجة الوظيفية (مثال: L1, L2, Senior). Job grade.",
    aliases: ["job_grade", "grade", "الدرجة الوظيفية", "الدرجة"],
  },
  {
    key: "personal_email",
    header: "Personal_Email",
    arLabel: "البريد الشخصي",
    width: 26,
    example1: "ahmed.personal@gmail.com",
    example2: "sara.personal@gmail.com",
    notes: "اختياري — البريد الإلكتروني الشخصي. Optional personal email.",
    aliases: ["personal_email", "البريد الشخصي"],
  },
  {
    key: "city",
    header: "City",
    arLabel: "المدينة",
    width: 15,
    example1: "Cairo",
    example2: "Giza",
    notes: "المدينة. City.",
    aliases: ["city", "المدينة"],
  },
  {
    key: "country",
    header: "Country",
    arLabel: "الدولة",
    width: 15,
    example1: "Egypt",
    example2: "Egypt",
    notes: "الدولة. Country.",
    aliases: ["country", "الدولة", "البلد"],
  },
  {
    key: "address",
    header: "Address",
    arLabel: "العنوان",
    width: 28,
    example1: "Nasr City, Cairo",
    example2: "Dokki, Giza",
    notes: "عنوان السكن التفصيلي. Residential address.",
    aliases: ["address", "street", "العنوان"],
  },
  {
    key: "bank_name",
    header: "Bank_Name",
    arLabel: "اسم البنك",
    width: 18,
    example1: "CIB",
    example2: "NBE",
    notes: "اسم البنك لتحويل الراتب. Bank name.",
    aliases: ["bank_name", "bank", "اسم البنك", "البنك"],
  },
  {
    key: "account_number",
    header: "Account_Number",
    arLabel: "رقم الحساب البنكي",
    width: 22,
    example1: "10004589231",
    example2: "20007812345",
    notes: "رقم الحساب البنكي. Bank account number.",
    aliases: ["account_number", "bank_account", "رقم الحساب", "رقم الحساب البنكي"],
  },
  {
    key: "iban",
    header: "IBAN",
    arLabel: "رقم الـ IBAN",
    width: 30,
    example1: "EG380019000500000000263180002",
    example2: "",
    notes: "رقم الآيبان الدولي. International Bank Account Number.",
    aliases: ["iban", "الايبان", "الآيبان"],
  },
  {
    key: "emergency_contact_name",
    header: "Emergency_Contact_Name",
    arLabel: "اسم شخص الطوارئ",
    width: 24,
    example1: "Mohamed Hassan",
    example2: "Ali Mahmoud",
    notes: "اسم جهة الاتصال في حالة الطوارئ. Emergency contact name.",
    aliases: ["emergency_contact_name", "emergency_name", "اسم الطوارئ", "جهة اتصال الطوارئ"],
  },
  {
    key: "emergency_contact_phone",
    header: "Emergency_Contact_Phone",
    arLabel: "هاتف الطوارئ",
    width: 22,
    example1: "01098765432",
    example2: "01234567890",
    notes: "رقم هاتف الطوارئ. Emergency contact phone.",
    aliases: ["emergency_contact_phone", "emergency_phone", "هاتف الطوارئ", "رقم الطوارئ"],
  },
  {
    key: "emergency_contact_relation",
    header: "Emergency_Contact_Relation",
    arLabel: "صلة القرابة للطوارئ",
    width: 22,
    example1: "Father",
    example2: "Brother",
    notes: "صلة القرابة (Father, Mother, Spouse, Brother...). Emergency contact relationship.",
    aliases: ["emergency_contact_relation", "emergency_relation", "صلة القرابة"],
  },
  {
    key: "portal_password",
    header: "Portal_Password",
    arLabel: "كلمة مرور البوابة (اختياري)",
    width: 22,
    example1: "",
    example2: "",
    notes: "اختياري — إذا تُركت فارغة يتم إنشاء كلمة مرور آمنة مشفرة، ويمكن تعديلها لاحقاً. Optional portal login password (bcrypt hashed).",
    aliases: ["portal_password", "password", "كلمة المرور", "الباسورد"],
  },
];

// Build lookup map from normalized header text -> canonical field key
const HEADER_ALIAS_MAP = new Map<string, string>();
for (const col of TEMPLATE_COLUMNS) {
  const register = (raw: string) => {
    const clean = raw
      .toLowerCase()
      .replace(/\*+/g, "")
      .replace(/[()[\]]/g, "")
      .replace(/[\s_-]+/g, "_")
      .trim()
      .replace(/^_+|_+$/g, "");
    if (clean) HEADER_ALIAS_MAP.set(clean, col.key);
  };
  register(col.key);
  register(col.header);
  register(col.arLabel);
  for (const a of col.aliases) register(a);
}

function normalizeHeaderToKey(rawHeader: string): string | null {
  if (!rawHeader) return null;
  const clean = String(rawHeader)
    .replace(/^\uFEFF/, "")
    .toLowerCase()
    .replace(/\*+/g, "")
    .replace(/[()[\]]/g, "")
    .replace(/[\s_-]+/g, "_")
    .trim()
    .replace(/^_+|_+$/g, "");
  return HEADER_ALIAS_MAP.get(clean) || null;
}

function extractExcelCellValue(val: any): any {
  if (val === null || val === undefined) return "";
  if (val instanceof Date) return val;
  if (typeof val === "object") {
    if ("text" in val && typeof val.text === "string") return val.text;
    if ("hyperlink" in val && typeof val.text === "string") return val.text;
    if ("richText" in val && Array.isArray(val.richText)) {
      return val.richText.map((rt: any) => rt?.text || "").join("");
    }
    if ("result" in val) return extractExcelCellValue(val.result);
    return String(val);
  }
  return val;
}

function cleanString(val: any, maxLen = 255): string {
  if (val === null || val === undefined) return "";
  return String(val).trim().slice(0, maxLen);
}

function parseNumber(val: any, fallback = 0): number {
  if (val === null || val === undefined || val === "") return fallback;
  if (typeof val === "number") return Number.isFinite(val) ? val : fallback;
  const cleaned = String(val).replace(/,/g, "").replace(/[^\d.-]/g, "").trim();
  if (!cleaned) return fallback;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : fallback;
}

function parseDateYmd(val: any): string | null {
  if (val === null || val === undefined || val === "") return null;

  if (val instanceof Date && !isNaN(val.getTime())) {
    const y = val.getUTCFullYear();
    if (y < 1900 || y > 2150) return null;
    const m = String(val.getUTCMonth() + 1).padStart(2, "0");
    const d = String(val.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  // Excel numeric serial date (days since 1899-12-30)
  if (typeof val === "number" && Number.isFinite(val) && val > 1000 && val < 100000) {
    const utcMs = Math.round((val - 25569) * 86400 * 1000);
    const dt = new Date(utcMs);
    if (!isNaN(dt.getTime())) {
      const y = dt.getUTCFullYear();
      const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
      const d = String(dt.getUTCDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
  }

  const str = String(val).trim();
  if (!str || str.toLowerCase() === "invalid date") return null;

  // YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const y = Number(isoMatch[1]);
    const m = Number(isoMatch[2]);
    const d = Number(isoMatch[3]);
    if (y >= 1900 && y <= 2150 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmyMatch) {
    let p1 = Number(dmyMatch[1]);
    let p2 = Number(dmyMatch[2]);
    const y = Number(dmyMatch[3]);
    // If second part > 12, swap (it's MM/DD/YYYY)
    let d = p1;
    let m = p2;
    if (p2 > 12 && p1 <= 12) {
      m = p1;
      d = p2;
    }
    if (y >= 1900 && y <= 2150 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getUTCFullYear();
    if (y >= 1900 && y <= 2150) {
      return parsed.toISOString().split("T")[0];
    }
  }
  return null;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

function normalizeStatus(raw: string): string {
  const s = raw.toLowerCase().trim();
  if (!s || s === "نشط" || s === "فعال" || s === "active") return "active";
  if (s === "inactive" || s === "غير نشط" || s === "موقوف" || s === "suspended") return "inactive";
  if (s === "terminated" || s === "منتهي" || s === "مستقيل" || s === "resigned") return "terminated";
  if (s === "archived" || s === "مؤرشف") return "archived";
  return "active";
}

function splitFullName(fullName: string): { first_name: string; middle_name: string; last_name: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first_name: "", middle_name: "", last_name: "" };
  if (parts.length === 1) return { first_name: parts[0], middle_name: "", last_name: "" };
  if (parts.length === 2) return { first_name: parts[0], middle_name: "", last_name: parts[1] };
  return {
    first_name: parts[0],
    middle_name: parts.slice(1, -1).join(" "),
    last_name: parts[parts.length - 1],
  };
}

interface NormalizedImportRow {
  rowNumber: number;
  employee_id: string;
  name: string;
  email: string;
  department: string;
  team_name: string;
  job_title: string;
  manager_ref: string;
  phone: string;
  extension_number: string;
  status: string;
  contract_type: string;
  hire_date: string | null;
  contract_end_date: string | null;
  salary_base: number;
  allowances: number;
  currency: string;
  vacation_balance: number;
  sick_leave_balance: number;
  attendance_method: string;
  national_id: string;
  gender: string;
  date_of_birth: string | null;
  nationality: string;
  marital_status: string;
  work_location: string;
  job_grade: string;
  personal_email: string;
  city: string;
  country: string;
  address: string;
  bank_name: string;
  account_number: string;
  iban: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relation: string;
  portal_password: string;
}

function buildNormalizedRow(rawObj: Record<string, any>, rowNumber: number): NormalizedImportRow {
  const get = (k: string) => rawObj[k];
  const rawEmail = cleanString(get("email"), 190).toLowerCase();
  const rawName = cleanString(get("name"), 200);
  const rawEmpId = cleanString(get("employee_id"), 100);
  const rawStatus = normalizeStatus(cleanString(get("status"), 64));
  const rawContractType = cleanString(get("contract_type"), 100) || "Full-time";
  const rawCurrency = (cleanString(get("currency"), 16) || "EGP").toUpperCase();
  const rawAttendance = cleanString(get("attendance_method"), 100) || "Login System";

  return {
    rowNumber,
    employee_id: rawEmpId,
    name: rawName,
    email: rawEmail,
    department: cleanString(get("department"), 180),
    team_name: cleanString(get("team_name"), 180),
    job_title: cleanString(get("job_title"), 180) || "Staff",
    manager_ref: cleanString(get("manager_ref"), 190),
    phone: cleanString(get("phone"), 64),
    extension_number: cleanString(get("extension_number"), 32),
    status: rawStatus,
    contract_type: rawContractType,
    hire_date: parseDateYmd(get("hire_date")),
    contract_end_date: parseDateYmd(get("contract_end_date")),
    salary_base: Math.max(0, parseNumber(get("salary_base"), 0)),
    allowances: Math.max(0, parseNumber(get("allowances"), 0)),
    currency: rawCurrency,
    vacation_balance: Math.max(0, parseNumber(get("vacation_balance"), 21)),
    sick_leave_balance: Math.max(0, parseNumber(get("sick_leave_balance"), 7)),
    attendance_method: rawAttendance,
    national_id: cleanString(get("national_id"), 64),
    gender: cleanString(get("gender"), 32),
    date_of_birth: parseDateYmd(get("date_of_birth")),
    nationality: cleanString(get("nationality"), 80),
    marital_status: cleanString(get("marital_status"), 40),
    work_location: cleanString(get("work_location"), 180),
    job_grade: cleanString(get("job_grade"), 40),
    personal_email: cleanString(get("personal_email"), 190).toLowerCase(),
    city: cleanString(get("city"), 100),
    country: cleanString(get("country"), 100),
    address: cleanString(get("address"), 255),
    bank_name: cleanString(get("bank_name"), 120),
    account_number: cleanString(get("account_number"), 100),
    iban: cleanString(get("iban"), 100),
    emergency_contact_name: cleanString(get("emergency_contact_name"), 150),
    emergency_contact_phone: cleanString(get("emergency_contact_phone"), 64),
    emergency_contact_relation: cleanString(get("emergency_contact_relation"), 80),
    portal_password: cleanString(get("portal_password"), 128),
  };
}

async function parseUploadedSpreadsheet(file: Express.Multer.File): Promise<{ rows: NormalizedImportRow[]; matchedColumns: string[] }> {
  const filename = (file.originalname || "").toLowerCase();
  const isCsv = filename.endsWith(".csv") || file.mimetype === "text/csv";
  const isXlsx = filename.endsWith(".xlsx") || file.mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  if (!isCsv && !isXlsx) {
    throw new Error("صيغة الملف غير مدعومة. يرجى رفع ملف Excel (.xlsx) أو CSV (.csv) فقط.");
  }

  const parsedRows: NormalizedImportRow[] = [];
  const matchedColumnsSet = new Set<string>();

  if (isCsv) {
    const csvText = file.buffer.toString("utf-8");
    const parsed = Papa.parse<Record<string, any>>(csvText, {
      header: true,
      skipEmptyLines: "greedy",
    });
    const rawFields = parsed.meta?.fields || [];
    const headerMap: Record<string, string> = {};
    for (const f of rawFields) {
      const canonical = normalizeHeaderToKey(f);
      if (canonical) {
        headerMap[f] = canonical;
        matchedColumnsSet.add(canonical);
      }
    }

    const dataRows = (parsed.data || []).slice(0, MAX_IMPORT_ROWS);
    dataRows.forEach((rowObj, idx) => {
      const mapped: Record<string, any> = {};
      let hasAnyValue = false;
      for (const [rawKey, canonical] of Object.entries(headerMap)) {
        const val = rowObj[rawKey];
        if (val !== null && val !== undefined && String(val).trim() !== "") {
          hasAnyValue = true;
        }
        mapped[canonical] = val;
      }
      if (hasAnyValue) {
        parsedRows.push(buildNormalizedRow(mapped, idx + 2));
      }
    });
  } else {
    // Verify ZIP/XLSX magic signature (PK\x03\x04)
    if (file.buffer.length < 4 || file.buffer[0] !== 0x50 || file.buffer[1] !== 0x4b) {
      throw new Error("الملف المرفوع ليس ملف Excel (.xlsx) صالحاً. يرجى تنزيل القالب من النظام وإعادة المحاولة.");
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(file.buffer as any);

    // Prefer "Employees" sheet if present, otherwise first non-instructions sheet
    const sheet =
      workbook.worksheets.find((ws) => ws.name.toLowerCase().includes("employee")) ||
      workbook.worksheets.find((ws) => !ws.name.toLowerCase().includes("instruction")) ||
      workbook.worksheets[0];

    if (!sheet) {
      throw new Error("ملف Excel فارغ ولا يحتوي على أي أوراق عمل (Worksheets).");
    }

    const headerRow = sheet.getRow(1);
    const colIdxToKey = new Map<number, string>();
    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const headerStr = cleanString(extractExcelCellValue(cell.value), 120);
      const canonical = normalizeHeaderToKey(headerStr);
      if (canonical) {
        colIdxToKey.set(colNumber, canonical);
        matchedColumnsSet.add(canonical);
      }
    });

    if (colIdxToKey.size === 0) {
      throw new Error("لم يتم التعرف على أعمدة القالب في الصف الأول. يرجى استخدام قالب Excel الرسمي من زر (تحميل قالب Excel).");
    }

    const rowLimit = Math.min(sheet.rowCount, MAX_IMPORT_ROWS + 1);
    for (let r = 2; r <= rowLimit; r++) {
      const row = sheet.getRow(r);
      const mapped: Record<string, any> = {};
      let hasAnyValue = false;

      colIdxToKey.forEach((canonical, colNum) => {
        const cellVal = extractExcelCellValue(row.getCell(colNum).value);
        if (cellVal !== null && cellVal !== undefined && String(cellVal).trim() !== "") {
          hasAnyValue = true;
        }
        mapped[canonical] = cellVal;
      });

      if (hasAnyValue) {
        parsedRows.push(buildNormalizedRow(mapped, r));
      }
    }
  }

  return { rows: parsedRows, matchedColumns: Array.from(matchedColumnsSet) };
}

let hrColsEnsured = false;

async function ensureHrEmployeeColumns(): Promise<void> {
  if (hrColsEnsured) return;
  try {
    if (getDbType() === "mysql") {
      const existingColsRes = await pool.query(
        `SELECT COLUMN_NAME as column_name FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'hr_employees'`
      );
      const colSet = new Set(
        (existingColsRes.rows || []).map((r: any) => String(r.column_name || r.COLUMN_NAME || "").toLowerCase())
      );
      const requiredCols = [
        { name: "joined_at", def: "DATETIME DEFAULT CURRENT_TIMESTAMP" },
        { name: "currency", def: "VARCHAR(32) DEFAULT 'EGP'" },
        { name: "employment_status", def: "VARCHAR(64) DEFAULT 'active'" },
        { name: "extension_number", def: "VARCHAR(64)" },
      ];
      for (const col of requiredCols) {
        if (colSet.size > 0 && !colSet.has(col.name)) {
          await pool.query(`ALTER TABLE hr_employees ADD COLUMN ${col.name} ${col.def}`).catch(() => {});
        }
      }
    } else {
      await pool.query(`ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`).catch(() => {});
      await pool.query(`ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EGP'`).catch(() => {});
      await pool.query(`ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS employment_status TEXT DEFAULT 'active'`).catch(() => {});
      await pool.query(`ALTER TABLE hr_employees ADD COLUMN IF NOT EXISTS extension_number TEXT`).catch(() => {});
    }
    hrColsEnsured = true;
  } catch (_e) {
    // Non-fatal
  }
}

export function createEmployeeImportRouter(wss: any) {
  const router = express.Router();

  // ============================================================================
  // 1. DOWNLOAD EXCEL TEMPLATE (.xlsx) WITH LIVE COMPANY DEPARTMENTS & EXAMPLES
  // ============================================================================
  router.get("/import-template", checkPermission("HR", "view"), async (req: Request, res: Response) => {
    try {
      const safeExcelText = (val: any): string => {
        const s = String(val ?? "").trim();
        return /^[=+\-@]/.test(s) ? `'${s}` : s;
      };
      const companyId = (req as any).user?.company_id || 1;
      const deptsRes = await pool.query(
        `SELECT id, name, teams, job_titles FROM departments WHERE company_id = $1 OR company_id IS NULL ORDER BY id ASC`,
        [companyId]
      );
      const departments = (deptsRes.rows || []).map((d: any) => ({
        ...d,
        name: safeExcelText(d.name),
      }));
      const deptNames = departments.map((d: any) => String(d.name || "").trim()).filter(Boolean);
      const firstDept = deptNames[0] || "Operations";
      const secondDept = deptNames[1] || firstDept;

      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Systo Biz HR";
      workbook.created = new Date();

      // Sheet 1: Employees (Main Data Sheet)
      const sheet = workbook.addWorksheet("Employees", {
        views: [{ state: "frozen", ySplit: 1 }],
      });

      sheet.columns = TEMPLATE_COLUMNS.map((col) => ({
        header: col.header,
        key: col.key,
        width: col.width,
      }));

      // Style Header Row
      const headerRow = sheet.getRow(1);
      headerRow.height = 30;
      headerRow.eachCell((cell, colNumber) => {
        const def = TEMPLATE_COLUMNS[colNumber - 1];
        cell.font = {
          name: "Calibri",
          size: 11,
          bold: true,
          color: { argb: "FFFFFFFF" },
        };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: def?.required ? "FF3730A3" : "FF4F46E5" },
        };
        cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
        cell.border = {
          top: { style: "thin", color: { argb: "FFE2E8F0" } },
          bottom: { style: "medium", color: { argb: "FF1E1B4B" } },
          left: { style: "thin", color: { argb: "FF6366F1" } },
          right: { style: "thin", color: { argb: "FF6366F1" } },
        };
        if (def) {
          cell.note = `${def.arLabel}\n${def.notes}`;
        }
      });

      // Add 2 Example Rows using actual company departments
      const exRow1Data: Record<string, any> = {};
      const exRow2Data: Record<string, any> = {};
      for (const col of TEMPLATE_COLUMNS) {
        exRow1Data[col.key] = col.key === "department" ? firstDept : col.example1;
        exRow2Data[col.key] = col.key === "department" ? secondDept : col.example2;
      }

      const r2 = sheet.addRow(exRow1Data);
      const r3 = sheet.addRow(exRow2Data);
      [r2, r3].forEach((row) => {
        row.height = 22;
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.font = { name: "Calibri", size: 10, color: { argb: "FF1E293B" } };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF8FAFC" },
          };
          cell.border = {
            bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
            left: { style: "thin", color: { argb: "FFE2E8F0" } },
            right: { style: "thin", color: { argb: "FFE2E8F0" } },
          };
        });
      });

      // Format Phone, National ID, Employee ID, Extension, Account Number as Text so Excel keeps leading zeros!
      const textColKeys = ["employee_id", "phone", "extension_number", "national_id", "account_number", "iban", "emergency_contact_phone"];
      for (const k of textColKeys) {
        const colIdx = TEMPLATE_COLUMNS.findIndex((c) => c.key === k) + 1;
        if (colIdx > 0) {
          sheet.getColumn(colIdx).numFmt = "@";
        }
      }

      // Sheet 2: Instructions & Live Departments Reference
      const guideSheet = workbook.addWorksheet("Instructions");
      guideSheet.columns = [
        { header: "Column Name (اسم العمود في الشيت)", key: "header", width: 28 },
        { header: "الاسم بالعربية", key: "arLabel", width: 28 },
        { header: "مطلوب / اختياري", key: "req", width: 18 },
        { header: "مثال (Example)", key: "example", width: 28 },
        { header: "التعليمات والملاحظات (Notes)", key: "notes", width: 55 },
      ];

      const gHeader = guideSheet.getRow(1);
      gHeader.height = 28;
      gHeader.eachCell((cell) => {
        cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF0F172A" } };
        cell.alignment = { vertical: "middle", horizontal: "center" };
      });

      for (const col of TEMPLATE_COLUMNS) {
        guideSheet.addRow({
          header: col.header,
          arLabel: col.arLabel,
          req: col.required ? "مطلوب (Required)" : "اختياري (Optional)",
          example: col.key === "department" ? firstDept : col.example1,
          notes: col.notes,
        });
      }

      guideSheet.addRow({});
      const deptSectionTitle = guideSheet.addRow({
        header: "الأقسام المسجلة حالياً في النظام",
        arLabel: "Available Departments in DB",
        req: "انسخ الاسم كما هو",
        example: "",
        notes: "يمكنك أيضاً كتابة اسم قسم جديد وسيتم إنشاؤه تلقائياً عند تفعيل خيار إنشاء الأقسام.",
      });
      deptSectionTitle.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF059669" } };
      });

      const deptListStartRow = guideSheet.rowCount + 1;
      for (const dept of departments) {
        let teamsStr = "";
        try {
          const parsedTeams = typeof dept.teams === "string" ? JSON.parse(dept.teams) : dept.teams;
          if (Array.isArray(parsedTeams)) {
            teamsStr = parsedTeams.map((t: any) => (typeof t === "string" ? t : t?.name || "")).filter(Boolean).join(", ");
          }
        } catch (_e) {}
        guideSheet.addRow({
          header: dept.name,
          arLabel: `ID: ${dept.id}`,
          req: "قسم نشط",
          example: teamsStr || "—",
          notes: "استخدم اسم القسم في عمود Department داخل شيت Employees",
        });
      }
      const deptListEndRow = guideSheet.rowCount;

      // Add Excel Data Validations on Sheet 1 rows 2..500
      const addListValidation = (colKey: string, formula: string, allowBlank = true) => {
        const colIdx = TEMPLATE_COLUMNS.findIndex((c) => c.key === colKey) + 1;
        if (colIdx <= 0) return;
        const colLetter = sheet.getColumn(colIdx).letter;
        for (let rowIdx = 2; rowIdx <= 500; rowIdx++) {
          sheet.getCell(`${colLetter}${rowIdx}`).dataValidation = {
            type: "list",
            allowBlank,
            formulae: [formula],
            showErrorMessage: false,
          };
        }
      };

      if (deptNames.length > 0 && deptListEndRow >= deptListStartRow) {
        addListValidation("department", `Instructions!$A$${deptListStartRow}:$A$${deptListEndRow}`);
      }
      addListValidation("status", '"active,inactive"');
      addListValidation("contract_type", '"Full-time,Part-time,Contract,Intern"');
      addListValidation("gender", '"Male,Female"');
      addListValidation("currency", '"EGP,SAR,USD,AED,EUR"');
      addListValidation("attendance_method", '"Login System,Fingerprint / Biometric,Mobile App,Remote"');

      const buffer = await workbook.xlsx.writeBuffer();
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="SystoBiz_Employees_Import_Template.xlsx"'
      );
      res.setHeader("Cache-Control", "no-store");
      res.send(Buffer.from(buffer));
    } catch (err: any) {
      console.error("Failed to generate Excel template:", err);
      res.status(500).json({ error: err?.message || "Failed to generate Excel template" });
    }
  });

  // ============================================================================
  // 2. PREVIEW & VALIDATE UPLOADED EXCEL / CSV FILE BEFORE SAVING TO DB
  // ============================================================================
  router.post(
    "/import/preview",
    checkPermission("HR", "create"),
    upload.single("file"),
    async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "يرجى اختيار ملف Excel (.xlsx) أو CSV للرفع." });
        }

        const companyId = (req as any).user?.company_id || 1;
        const { rows, matchedColumns } = await parseUploadedSpreadsheet(req.file);

        if (rows.length === 0) {
          return res.status(400).json({
            error: "الملف لا يحتوي على أي صفوف بيانات تحت صف العناوين. يرجى إضافة بيانات الموظفين والمحاولة مرة أخرى.",
          });
        }

        // Fetch existing company users & departments for live validation
        const [existingUsersRes, existingDeptsRes] = await Promise.all([
          pool.query(
            `SELECT u.id, u.name, u.email, u.employee_id as user_emp_id, h.employee_id as hr_emp_id, h.id_number
             FROM users u
             LEFT JOIN hr_employees h ON u.id = h.user_id
             WHERE u.company_id = $1 OR u.company_id IS NULL`,
            [companyId]
          ),
          pool.query(
            `SELECT id, name FROM departments WHERE company_id = $1 OR company_id IS NULL`,
            [companyId]
          ),
        ]);

        const existingEmailMap = new Map<string, { id: number; name: string }>();
        const existingEmpIdMap = new Map<string, { id: number; name: string }>();
        for (const u of existingUsersRes.rows || []) {
          if (u.email) existingEmailMap.set(String(u.email).trim().toLowerCase(), { id: u.id, name: u.name });
          for (const cid of [u.user_emp_id, u.hr_emp_id, u.id_number]) {
            if (cid && String(cid).trim()) {
              existingEmpIdMap.set(String(cid).trim().toLowerCase(), { id: u.id, name: u.name });
            }
          }
        }

        const existingDeptMap = new Map<string, { id: number; name: string }>();
        for (const d of existingDeptsRes.rows || []) {
          if (d.name) existingDeptMap.set(String(d.name).trim().toLowerCase(), { id: d.id, name: d.name });
        }

        const seenEmailsInFile = new Set<string>();
        const seenEmpIdsInFile = new Set<string>();
        const newDepartmentsSet = new Set<string>();

        let validCount = 0;
        let duplicateCount = 0;
        let errorCount = 0;

        const previewRows = rows.map((row) => {
          const errors: string[] = [];
          const warnings: string[] = [];
          let existingMatch: { id: number; name: string; matchedBy: string } | null = null;

          if (!row.name) {
            errors.push("الاسم الكامل (Full_Name) مطلوب");
          }

          if (!row.email) {
            errors.push("البريد الإلكتروني (Email) مطلوب");
          } else if (!isValidEmail(row.email)) {
            errors.push(`صيغة البريد الإلكتروني غير صحيحة: ${row.email}`);
          } else {
            if (seenEmailsInFile.has(row.email)) {
              errors.push(`البريد الإلكتروني مكرر داخل نفس الملف: ${row.email}`);
            } else {
              seenEmailsInFile.add(row.email);
            }
            const dbUserByEmail = existingEmailMap.get(row.email);
            if (dbUserByEmail) {
              existingMatch = { ...dbUserByEmail, matchedBy: "Email" };
            }
          }

          if (row.employee_id) {
            const empKey = row.employee_id.toLowerCase();
            if (seenEmpIdsInFile.has(empKey)) {
              errors.push(`كود الموظف مكرر داخل نفس الملف: ${row.employee_id}`);
            } else {
              seenEmpIdsInFile.add(empKey);
            }
            const dbUserByCode = existingEmpIdMap.get(empKey);
            if (dbUserByCode && (!existingMatch || existingMatch.id !== dbUserByCode.id)) {
              if (existingMatch) {
                errors.push(`كود الموظف (${row.employee_id}) مسجل بالفعل لموظف آخر (${dbUserByCode.name})`);
              } else {
                existingMatch = { ...dbUserByCode, matchedBy: "Employee_ID" };
              }
            }
          }

          let departmentStatus: "matched" | "new" | "default" = "default";
          if (row.department) {
            if (existingDeptMap.has(row.department.toLowerCase())) {
              departmentStatus = "matched";
            } else {
              departmentStatus = "new";
              newDepartmentsSet.add(row.department);
              warnings.push(`القسم "${row.department}" غير موجود حالياً (سيُنشأ تلقائياً إذا فعّلت الخيار)`);
            }
          }

          let rowStatus: "valid" | "duplicate" | "error" = "valid";
          if (errors.length > 0) {
            rowStatus = "error";
            errorCount++;
          } else if (existingMatch) {
            rowStatus = "duplicate";
            duplicateCount++;
            warnings.push(`موظف موجود مسبقاً (${existingMatch.name}) عبر ${existingMatch.matchedBy}`);
          } else {
            validCount++;
          }

          return {
            ...row,
            portal_password_set: Boolean(row.portal_password),
            rowStatus,
            departmentStatus,
            existingUserId: existingMatch?.id || null,
            errors,
            warnings,
          };
        });

        res.json({
          fileName: req.file.originalname,
          dialect: getDbType(),
          matchedColumns,
          totalRows: rows.length,
          validCount,
          duplicateCount,
          errorCount,
          newDepartments: Array.from(newDepartmentsSet),
          rows: previewRows,
        });
      } catch (err: any) {
        console.error("Excel preview error:", err);
        res.status(400).json({ error: err?.message || "فشل قراءة ملف Excel" });
      }
    }
  );

  // ============================================================================
  // 3. COMMIT VALIDATED ROWS ATOMICALLY INTO MYSQL / POSTGRESQL DATABASE
  // ============================================================================
  router.post(
    "/import",
    checkPermission("HR", "create"),
    async (req: Request, res: Response) => {
      try {
        const companyId = (req as any).user?.company_id || 1;
        const actorUserId = (req as any).user?.id || 1;
        const actorName = (req as any).user?.name || (req as any).user?.email || "HR Admin";
        const {
          rows: incomingRows,
          duplicateMode = "skip",
          autoCreateDepartments = true,
        } = req.body || {};

        if (!Array.isArray(incomingRows) || incomingRows.length === 0) {
          return res.status(400).json({ error: "لا توجد صفوف صالحة للاستيراد." });
        }

        if (incomingRows.length > MAX_IMPORT_ROWS) {
          return res.status(400).json({ error: `الحد الأقصى للاستيراد في المرة الواحدة هو ${MAX_IMPORT_ROWS} موظف.` });
        }

        await ensureHrEmployeeColumns();

        // Load existing departments
        const deptsRes = await pool.query(
          `SELECT id, name FROM departments WHERE company_id = $1 OR company_id IS NULL ORDER BY id ASC`,
          [companyId]
        );
        const deptMap = new Map<string, { id: number; name: string }>();
        let defaultDept: { id: number; name: string } | null = null;
        for (const d of deptsRes.rows || []) {
          const item = { id: Number(d.id), name: String(d.name) };
          if (!defaultDept) defaultDept = item;
          deptMap.set(item.name.trim().toLowerCase(), item);
        }

        // Auto-create missing departments if enabled
        const createdDepartments: string[] = [];
        if (autoCreateDepartments) {
          const missingDepts = new Set<string>();
          for (const raw of incomingRows) {
            const deptName = cleanString(raw?.department, 180);
            if (deptName && !deptMap.has(deptName.toLowerCase())) {
              missingDepts.add(deptName);
            }
          }
          for (const newDeptName of missingDepts) {
            try {
              const ins = await pool.query(
                `INSERT INTO departments (company_id, name, description, is_executive, teams, job_titles)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING id`,
                [companyId, newDeptName, `Auto-created via HR Directory Excel Import`, false, JSON.stringify([]), JSON.stringify([])]
              );
              const newId = ins.rows[0]?.id;
              if (newId) {
                const entry = { id: Number(newId), name: newDeptName };
                deptMap.set(newDeptName.toLowerCase(), entry);
                if (!defaultDept) defaultDept = entry;
                createdDepartments.push(newDeptName);
              }
            } catch (_dupErr) {
              const refetch = await pool.query(
                `SELECT id, name FROM departments WHERE LOWER(name) = LOWER($1) AND (company_id = $2 OR company_id IS NULL) LIMIT 1`,
                [newDeptName, companyId]
              );
              if (refetch.rows[0]?.id) {
                deptMap.set(newDeptName.toLowerCase(), {
                  id: Number(refetch.rows[0].id),
                  name: refetch.rows[0].name,
                });
              }
            }
          }
        }

        // Pre-hash a fallback random password per batch? Even better: unique random token per passwordless user!
        let imported = 0;
        let updated = 0;
        let skipped = 0;
        let failed = 0;
        const rowErrors: Array<{ rowNumber: number; name: string; email: string; error: string }> = [];
        const pendingManagerLinks: Array<{ userId: number; managerRef: string }> = [];

        const todayYmd = new Date().toISOString().split("T")[0];

        for (let i = 0; i < incomingRows.length; i++) {
          const raw = incomingRows[i];
          const row = buildNormalizedRow(raw, Number(raw?.rowNumber) || i + 2);

          // Server-side validation
          if (!row.name || !row.email || !isValidEmail(row.email)) {
            failed++;
            rowErrors.push({
              rowNumber: row.rowNumber,
              name: row.name || "—",
              email: row.email || "—",
              error: !row.name ? "الاسم الكامل مطلوب" : "البريد الإلكتروني مطلوب وبصيغة صحيحة",
            });
            continue;
          }

          const client = await pool.connect();
          try {
            await client.query("BEGIN");

            // Check if employee already exists by email or employee_id
            const existingByEmail = await client.query(
              `SELECT id, name FROM users WHERE LOWER(email) = LOWER($1) AND (company_id = $2 OR company_id IS NULL) LIMIT 1`,
              [row.email, companyId]
            );

            let existingUserId: number | null = existingByEmail.rows[0]?.id ? Number(existingByEmail.rows[0].id) : null;

            if (!existingUserId && row.employee_id) {
              const existingByCode = await client.query(
                `SELECT u.id, u.name
                 FROM users u
                 LEFT JOIN hr_employees h ON u.id = h.user_id
                 WHERE (LOWER(COALESCE(u.employee_id, '')) = LOWER($1)
                     OR LOWER(COALESCE(h.employee_id, '')) = LOWER($1)
                     OR LOWER(COALESCE(h.id_number, '')) = LOWER($1))
                   AND (u.company_id = $2 OR u.company_id IS NULL)
                 LIMIT 1`,
                [row.employee_id, companyId]
              );
              if (existingByCode.rows[0]?.id) {
                existingUserId = Number(existingByCode.rows[0].id);
              }
            }

            if (existingUserId && duplicateMode !== "update") {
              await client.query("ROLLBACK");
              skipped++;
              continue;
            }

            // Resolve Department
            const matchedDept = row.department ? deptMap.get(row.department.toLowerCase()) : null;
            const resolvedDeptId = matchedDept?.id ?? defaultDept?.id ?? null;
            const resolvedDeptName = matchedDept?.name || row.department || defaultDept?.name || "";

            // Resolve immediate manager (Pass 2 handles managers appearing later in the sheet)
            let resolvedManagerId: number | null = null;
            let resolvedManagerName = "";
            if (row.manager_ref) {
              const mgrRes = await client.query(
                `SELECT id, name FROM users
                 WHERE (company_id = $1 OR company_id IS NULL)
                   AND (LOWER(email) = LOWER($2) OR LOWER(name) = LOWER($2))
                 LIMIT 1`,
                [companyId, row.manager_ref]
              );
              if (mgrRes.rows[0]?.id && Number(mgrRes.rows[0].id) !== existingUserId) {
                resolvedManagerId = Number(mgrRes.rows[0].id);
                resolvedManagerName = mgrRes.rows[0].name || "";
              }
            }

            const isInactive = row.status === "inactive" || row.status === "terminated" || row.status === "archived";
            const hasPortalAccess = !isInactive;
            const hireDate = row.hire_date || todayYmd;
            const joinedAtTimestamp = `${hireDate} 00:00:00`;
            const { first_name, middle_name, last_name } = splitFullName(row.name);
            const empCode = row.employee_id || null;

            const personalInfoPayload = {
              full_name: row.name,
              first_name,
              middle_name,
              last_name,
              employee_number: empCode || "",
              email: row.email,
              work_email: row.email,
              personal_email: row.personal_email,
              phone: row.phone,
              work_phone: row.phone,
              work_mobile: row.phone,
              extension: row.extension_number,
              ext: row.extension_number,
              department_name: resolvedDeptName,
              team_name: row.team_name,
              job_title: row.job_title,
              job_grade: row.job_grade,
              location: row.work_location,
              national_id: row.national_id,
              gender: row.gender,
              dob: row.date_of_birth || "",
              nationality: row.nationality,
              marital_status: row.marital_status,
              city: row.city,
              country: row.country,
              address: row.address,
              bank_name: row.bank_name,
              account_number: row.account_number,
              iban: row.iban,
              emergency_contact_name: row.emergency_contact_name,
              emergency_contact_phone: row.emergency_contact_phone,
              emergency_contact_relation: row.emergency_contact_relation,
              attendance_method: row.attendance_method,
              currency: row.currency,
              status: row.status,
              portal_access: hasPortalAccess,
              self_service_access: hasPortalAccess ? "allow" : "deny",
              status_history: [
                {
                  id: `status-imp-${Date.now()}-${i}`,
                  date: hireDate,
                  status: row.status,
                  reason: "Imported via Excel",
                  changed_by: actorName,
                  created_at: new Date().toISOString(),
                },
              ],
            };

            const initialJobInfo = [
              {
                id: `ji-imp-${Date.now()}-${i}`,
                date: hireDate,
                location: row.work_location || "",
                jobGrade: row.job_grade || "",
                department: resolvedDeptName,
                teams: row.team_name || "",
                jobTitle: row.job_title,
                reportingTo: resolvedManagerName || row.manager_ref || "",
                changeReason: "Excel Import",
              },
            ];

            const initialComp = [
              {
                id: `comp-imp-${Date.now()}-${i}`,
                date: hireDate,
                paySchedule: "Monthly",
                payType: "Salary",
                payRate: row.salary_base,
                currency: row.currency,
                paidPer: "Month",
                changeReason: "Excel Import",
                comments: row.allowances > 0 ? `Allowances: ${row.allowances}` : "",
              },
            ];

            const initialEmpStatus = [
              {
                id: `es-imp-${Date.now()}-${i}`,
                date: hireDate,
                status: row.contract_type,
                comments: "Excel Import",
              },
            ];

            let userId: number;

            if (existingUserId) {
              userId = existingUserId;
              // Update users table (preserve existing password unless explicitly supplied)
              if (row.portal_password) {
                const hashedPwd = await bcrypt.hash(row.portal_password, 10);
                await client.query(
                  `UPDATE users
                   SET name = $1, email = $2, password = $3, department_id = COALESCE($4, department_id),
                       job_title = $5, team_name = $6, status = $7, reporting_to = COALESCE($8, reporting_to),
                       has_portal_access = $9, employee_id = COALESCE($10, employee_id), extension_number = COALESCE(NULLIF($11, ''), extension_number),
                       updated_at = CURRENT_TIMESTAMP
                   WHERE id = $12`,
                  [
                    row.name,
                    row.email,
                    hashedPwd,
                    resolvedDeptId,
                    row.job_title,
                    row.team_name || null,
                    row.status,
                    resolvedManagerId,
                    hasPortalAccess,
                    empCode,
                    row.extension_number,
                    userId,
                  ]
                );
              } else {
                await client.query(
                  `UPDATE users
                   SET name = $1, email = $2, department_id = COALESCE($3, department_id),
                       job_title = $4, team_name = $5, status = $6, reporting_to = COALESCE($7, reporting_to),
                       has_portal_access = $8, employee_id = COALESCE($9, employee_id), extension_number = COALESCE(NULLIF($10, ''), extension_number),
                       updated_at = CURRENT_TIMESTAMP
                   WHERE id = $11`,
                  [
                    row.name,
                    row.email,
                    resolvedDeptId,
                    row.job_title,
                    row.team_name || null,
                    row.status,
                    resolvedManagerId,
                    hasPortalAccess,
                    empCode,
                    row.extension_number,
                    userId,
                  ]
                );
              }

              // Check if hr_employees row exists
              const hrCheck = await client.query(`SELECT id FROM hr_employees WHERE user_id = $1 LIMIT 1`, [userId]);
              if (hrCheck.rows.length > 0) {
                await client.query(
                  `UPDATE hr_employees
                   SET company_id = $1, employee_id = COALESCE($2, employee_id), id_number = COALESCE($3, id_number),
                       first_name = $4, middle_name = $5, last_name = $6,
                       email = $7, work_email = $8, personal_email = COALESCE(NULLIF($9, ''), personal_email),
                       phone = COALESCE(NULLIF($10, ''), phone), mobile_phone = COALESCE(NULLIF($11, ''), mobile_phone),
                       extension_number = COALESCE(NULLIF($12, ''), extension_number),
                       department_id = COALESCE($13, department_id), department = COALESCE(NULLIF($14, ''), department),
                       team_name = COALESCE(NULLIF($15, ''), team_name), job_title = $16, position = $17,
                       job_grade = COALESCE(NULLIF($18, ''), job_grade), work_location = COALESCE(NULLIF($19, ''), work_location),
                       reporting_to = COALESCE($20, reporting_to), manager_name = COALESCE(NULLIF($21, ''), manager_name),
                       salary_base = $22, allowances = $23, currency = $24,
                       contract_type = $25, contract_start_date = COALESCE($26, contract_start_date), contract_end_date = COALESCE($27, contract_end_date),
                       joined_at = COALESCE($28, joined_at),
                       vacation_balance = $29, sick_leave_balance = $30, attendance_method = $31,
                       national_id = COALESCE(NULLIF($32, ''), national_id), gender = COALESCE(NULLIF($33, ''), gender),
                       date_of_birth = COALESCE($34, date_of_birth), nationality = COALESCE(NULLIF($35, ''), nationality),
                       marital_status = COALESCE(NULLIF($36, ''), marital_status),
                       city = COALESCE(NULLIF($37, ''), city), country = COALESCE(NULLIF($38, ''), country),
                       address = COALESCE(NULLIF($39, ''), address),
                       bank_name = COALESCE(NULLIF($40, ''), bank_name), account_number = COALESCE(NULLIF($41, ''), account_number),
                       iban = COALESCE(NULLIF($42, ''), iban),
                       emergency_contact_name = COALESCE(NULLIF($43, ''), emergency_contact_name),
                       emergency_contact_phone = COALESCE(NULLIF($44, ''), emergency_contact_phone),
                       emergency_contact_relation = COALESCE(NULLIF($45, ''), emergency_contact_relation),
                       status = $46, employment_status = $47, personal_info = $48,
                       updated_at = CURRENT_TIMESTAMP
                   WHERE user_id = $49`,
                  [
                    companyId, empCode, empCode,
                    first_name, middle_name, last_name,
                    row.email, row.email, row.personal_email,
                    row.phone, row.phone,
                    row.extension_number,
                    resolvedDeptId, resolvedDeptName,
                    row.team_name, row.job_title, row.job_title,
                    row.job_grade, row.work_location,
                    resolvedManagerId, resolvedManagerName,
                    row.salary_base, row.allowances, row.currency,
                    row.contract_type, row.hire_date, row.contract_end_date,
                    row.hire_date ? joinedAtTimestamp : null,
                    row.vacation_balance, row.sick_leave_balance, row.attendance_method,
                    row.national_id, row.gender,
                    row.date_of_birth, row.nationality,
                    row.marital_status,
                    row.city, row.country,
                    row.address,
                    row.bank_name, row.account_number,
                    row.iban,
                    row.emergency_contact_name,
                    row.emergency_contact_phone,
                    row.emergency_contact_relation,
                    row.status, row.status, JSON.stringify(personalInfoPayload),
                    userId,
                  ]
                );
              } else {
                await client.query(
                  `INSERT INTO hr_employees (
                    user_id, company_id, employee_id, id_number,
                    first_name, middle_name, last_name,
                    email, work_email, personal_email, phone, mobile_phone, extension_number,
                    department_id, department, team_name, job_title, position, job_grade, work_location,
                    reporting_to, manager_name, salary_base, allowances, currency,
                    contract_type, contract_start_date, contract_end_date, joined_at,
                    vacation_balance, sick_leave_balance, bereavement_used, attendance_method,
                    national_id, gender, date_of_birth, nationality, marital_status,
                    city, country, address, bank_name, account_number, iban,
                    emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
                    status, employment_status,
                    documents, penalty_history, personal_info,
                    job_informations, compensations, bonuses_list, commissions_list,
                    equities_list, shift_allowances_list, potential_bonus, employment_statuses
                  ) VALUES (
                    $1, $2, $3, $4,
                    $5, $6, $7,
                    $8, $9, $10, $11, $12, $13,
                    $14, $15, $16, $17, $18, $19, $20,
                    $21, $22, $23, $24, $25,
                    $26, $27, $28, $29,
                    $30, $31, $32, $33,
                    $34, $35, $36, $37, $38,
                    $39, $40, $41, $42, $43, $44,
                    $45, $46, $47,
                    $48, $49,
                    $50, $51, $52,
                    $53, $54, $55, $56,
                    $57, $58, $59, $60
                  )`,
                  [
                    userId, companyId, empCode, empCode,
                    first_name, middle_name, last_name,
                    row.email, row.email, row.personal_email || null, row.phone || null, row.phone || null, row.extension_number || null,
                    resolvedDeptId, resolvedDeptName || null, row.team_name || null, row.job_title, row.job_title, row.job_grade || null, row.work_location || null,
                    resolvedManagerId, resolvedManagerName || null, row.salary_base, row.allowances, row.currency,
                    row.contract_type, hireDate, row.contract_end_date, joinedAtTimestamp,
                    row.vacation_balance, row.sick_leave_balance, 0, row.attendance_method,
                    row.national_id || null, row.gender || null, row.date_of_birth, row.nationality || null, row.marital_status || null,
                    row.city || null, row.country || null, row.address || null, row.bank_name || null, row.account_number || null, row.iban || null,
                    row.emergency_contact_name || null, row.emergency_contact_phone || null, row.emergency_contact_relation || null,
                    row.status, row.status,
                    JSON.stringify([]), JSON.stringify([]), JSON.stringify(personalInfoPayload),
                    JSON.stringify(initialJobInfo), JSON.stringify(initialComp), JSON.stringify([]), JSON.stringify([]),
                    JSON.stringify([]), JSON.stringify([]), JSON.stringify({}), JSON.stringify(initialEmpStatus),
                  ]
                );
              }

              await client.query("COMMIT");
              updated++;
            } else {
              // Create new user with bcrypt-hashed password
              const rawPasswordToHash = row.portal_password || crypto.randomBytes(16).toString("hex");
              const hashedPassword = await bcrypt.hash(rawPasswordToHash, 10);

              const userIns = await client.query(
                `INSERT INTO users (
                  company_id, name, email, username, password, department_id, job_title, team_name,
                  status, reporting_to, role_id, has_portal_access, employee_id, extension_number
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                RETURNING id`,
                [
                  companyId,
                  row.name,
                  row.email,
                  row.email,
                  hashedPassword,
                  resolvedDeptId,
                  row.job_title,
                  row.team_name || null,
                  row.status,
                  resolvedManagerId,
                  null,
                  hasPortalAccess,
                  empCode,
                  row.extension_number || null,
                ]
              );

              userId = Number(userIns.rows[0]?.id);
              if (!userId) {
                throw new Error("Failed to obtain newly inserted user ID");
              }

              await client.query(
                `INSERT INTO hr_employees (
                  user_id, company_id, employee_id, id_number,
                  first_name, middle_name, last_name,
                  email, work_email, personal_email, phone, mobile_phone, extension_number,
                  department_id, department, team_name, job_title, position, job_grade, work_location,
                  reporting_to, manager_name, salary_base, allowances, currency,
                  contract_type, contract_start_date, contract_end_date, joined_at,
                  vacation_balance, sick_leave_balance, bereavement_used, attendance_method,
                  national_id, gender, date_of_birth, nationality, marital_status,
                  city, country, address, bank_name, account_number, iban,
                  emergency_contact_name, emergency_contact_phone, emergency_contact_relation,
                  status, employment_status,
                  documents, penalty_history, personal_info,
                  job_informations, compensations, bonuses_list, commissions_list,
                  equities_list, shift_allowances_list, potential_bonus, employment_statuses
                ) VALUES (
                  $1, $2, $3, $4,
                  $5, $6, $7,
                  $8, $9, $10, $11, $12, $13,
                  $14, $15, $16, $17, $18, $19, $20,
                  $21, $22, $23, $24, $25,
                  $26, $27, $28, $29,
                  $30, $31, $32, $33,
                  $34, $35, $36, $37, $38,
                  $39, $40, $41, $42, $43, $44,
                  $45, $46, $47,
                  $48, $49,
                  $50, $51, $52,
                  $53, $54, $55, $56,
                  $57, $58, $59, $60
                )`,
                [
                  userId, companyId, empCode, empCode,
                  first_name, middle_name, last_name,
                  row.email, row.email, row.personal_email || null, row.phone || null, row.phone || null, row.extension_number || null,
                  resolvedDeptId, resolvedDeptName || null, row.team_name || null, row.job_title, row.job_title, row.job_grade || null, row.work_location || null,
                  resolvedManagerId, resolvedManagerName || null, row.salary_base, row.allowances, row.currency,
                  row.contract_type, hireDate, row.contract_end_date, joinedAtTimestamp,
                  row.vacation_balance, row.sick_leave_balance, 0, row.attendance_method,
                  row.national_id || null, row.gender || null, row.date_of_birth, row.nationality || null, row.marital_status || null,
                  row.city || null, row.country || null, row.address || null, row.bank_name || null, row.account_number || null, row.iban || null,
                  row.emergency_contact_name || null, row.emergency_contact_phone || null, row.emergency_contact_relation || null,
                  row.status, row.status,
                  JSON.stringify([]), JSON.stringify([]), JSON.stringify(personalInfoPayload),
                  JSON.stringify(initialJobInfo), JSON.stringify(initialComp), JSON.stringify([]), JSON.stringify([]),
                  JSON.stringify([]), JSON.stringify([]), JSON.stringify({}), JSON.stringify(initialEmpStatus),
                ]
              );

              await client.query("COMMIT");
              imported++;
            }

            if (row.manager_ref && !resolvedManagerId) {
              pendingManagerLinks.push({ userId, managerRef: row.manager_ref });
            }
          } catch (rowErr: any) {
            await client.query("ROLLBACK").catch(() => {});
            failed++;
            let friendlyMsg = rowErr?.message || "Database error";
            if (rowErr?.code === "23505" || rowErr?.code === "ER_DUP_ENTRY") {
              friendlyMsg = `قيمة مكررة في قاعدة البيانات (${row.email})`;
            }
            rowErrors.push({
              rowNumber: row.rowNumber,
              name: row.name,
              email: row.email,
              error: friendlyMsg,
            });
          } finally {
            client.release();
          }
        }

        // Pass 2: Link managers that were imported in the same batch
        for (const link of pendingManagerLinks) {
          try {
            const mgrRes = await pool.query(
              `SELECT id, name FROM users
               WHERE (company_id = $1 OR company_id IS NULL)
                 AND (LOWER(email) = LOWER($2) OR LOWER(name) = LOWER($2))
                 AND id <> $3
               LIMIT 1`,
              [companyId, link.managerRef, link.userId]
            );
            if (mgrRes.rows[0]?.id) {
              const mgrId = Number(mgrRes.rows[0].id);
              const mgrName = mgrRes.rows[0].name || "";
              await pool.query(`UPDATE users SET reporting_to = $1 WHERE id = $2`, [mgrId, link.userId]);
              await pool.query(`UPDATE hr_employees SET reporting_to = $1, manager_name = $2 WHERE user_id = $3`, [mgrId, mgrName, link.userId]);
            }
          } catch (_e) {}
        }

        // Clear caches so Directory, Departments, Org Chart & Admin Panel refresh immediately
        memoryCache.invalidatePrefix("hr:departments");
        memoryCache.invalidatePrefix("generic:departments");
        memoryCache.invalidatePrefix("generic:users");
        memoryCache.invalidatePrefix("admin:departments");
        memoryCache.invalidatePrefix("admin:all");

        // Record audit log
        await pool
          .query(
            `INSERT INTO audit_logs (user_id, action, entity_type, details, company_id) VALUES ($1, $2, $3, $4, $5)`,
            [
              actorUserId,
              "BULK_IMPORT",
              "hr_employees",
              `Excel import completed (${getDbType()}): ${imported} created, ${updated} updated, ${skipped} skipped, ${failed} failed.`,
              companyId,
            ]
          )
          .catch(() => {});

        // Notify live connected clients via WebSocket
        if (wss && wss.clients) {
          const payload = JSON.stringify({ type: "HR_EMPLOYEES_UPDATED", imported, updated });
          wss.clients.forEach((c: any) => {
            try {
              c.send(payload);
            } catch (_e) {}
          });
        }

        res.json({
          success: true,
          dialect: getDbType(),
          imported,
          updated,
          skipped,
          failed,
          createdDepartments,
          errors: rowErrors,
        });
      } catch (err: any) {
        console.error("Bulk Excel import error:", err);
        res.status(500).json({ error: err?.message || "فشل استيراد البيانات إلى قاعدة البيانات." });
      }
    }
  );

  return router;
}
