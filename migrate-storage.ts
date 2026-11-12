import { createClient } from '@supabase/supabase-js';
import pg from 'pg';

const { Pool } = pg;

// 1. إعداد الاتصال بقاعدة البيانات و Supabase
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // رابط اتصال بوستجريس المباشر الخاص بمشروعك
});

const SUPABASE_URL = process.env.SUPABASE_URL; // مثال: https://xyz.supabase.co
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // مفتاح Service Role لتخطي أي قيود أمان أثناء الترحيل

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

const BUCKET_NAME = 'documents';

// 2. دالة تحويل Base64 ورفعه على Supabase Storage
async function uploadBase64ToStorage(dataUriOrBase64: string, originalFilename = 'file', folder = 'general'): Promise<string> {
  if (!dataUriOrBase64 || typeof dataUriOrBase64 !== 'string') return '';
  if (dataUriOrBase64.startsWith('http://') || dataUriOrBase64.startsWith('https://')) {
    return dataUriOrBase64; // تم ترحيله مسبقاً
  }

  let mimeType = 'application/octet-stream';
  let buffer: Buffer;
  let ext = '';

  if (dataUriOrBase64.startsWith('data:image/svg+xml')) {
    mimeType = 'image/svg+xml';
    ext = 'svg';
    if (dataUriOrBase64.includes(';base64,')) {
      const base64Part = dataUriOrBase64.split(';base64,')[1];
      buffer = Buffer.from(base64Part, 'base64');
    } else {
      const contentPart = dataUriOrBase64.replace(/^data:image\/svg\+xml(?:;[a-zA-Z0-9=-]+)*,/, '');
      buffer = Buffer.from(decodeURIComponent(contentPart), 'utf-8');
    }
  } else {
    const match = dataUriOrBase64.match(/^data:([^;]+);base64,(.*)$/);
    if (match) {
      mimeType = match[1];
      buffer = Buffer.from(match[2], 'base64');
    } else if (!dataUriOrBase64.startsWith('data:')) {
      // raw base64 string
      buffer = Buffer.from(dataUriOrBase64, 'base64');
    } else {
      try {
        const commaIdx = dataUriOrBase64.indexOf(',');
        if (commaIdx !== -1) {
          const meta = dataUriOrBase64.substring(0, commaIdx);
          const raw = dataUriOrBase64.substring(commaIdx + 1);
          if (meta.includes('base64')) {
            buffer = Buffer.from(raw, 'base64');
          } else {
            buffer = Buffer.from(decodeURIComponent(raw), 'utf-8');
          }
          const mMatch = meta.match(/^data:([^;]+)/);
          if (mMatch) mimeType = mMatch[1];
        } else {
          return dataUriOrBase64;
        }
      } catch {
        return dataUriOrBase64;
      }
    }
  }

  if (!buffer || buffer.length === 0) return '';

  // تحديد الامتداد المناسب
  if (!ext && originalFilename.includes('.')) {
    ext = originalFilename.split('.').pop() || '';
  }
  if (!ext) {
    const mimeMap: Record<string, string> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'text/plain': 'txt'
    };
    ext = mimeMap[mimeType] || 'bin';
  }

  const cleanName = originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${cleanName}${cleanName.includes('.') ? '' : '.' + ext}`;
  const filePath = `${folder}/${uniqueName}`;

  // رفع الملف إلى الـ Bucket
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, buffer, {
      contentType: mimeType,
      upsert: true
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // جلب الرابط المباشر
  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path || filePath);

  return publicUrlData.publicUrl;
}

// 3. دالة فحص وتحديث الجداول
async function runMigration() {
  console.log('🚀 بدء فحص قاعدة البيانات وترحيل الملفات...');

  // أ) جدول hr_employees (مستندات الموظفين المخزنة كـ JSON/Array)
  const empRes = await pool.query(`SELECT id, user_id, documents FROM hr_employees WHERE documents::text LIKE '%data:%'`);
  console.log(`وجدت ${empRes.rows.length} موظف لديهم مستندات Base64.`);
  for (const row of empRes.rows) {
    try {
      const docs = typeof row.documents === 'string' ? JSON.parse(row.documents) : (row.documents || []);
      let changed = false;
      for (const doc of docs) {
        if (doc.url && typeof doc.url === 'string' && doc.url.startsWith('data:')) {
          const publicUrl = await uploadBase64ToStorage(doc.url, doc.name || 'document', `employee-docs/${row.user_id || row.id}`);
          doc.url = publicUrl;
          if (doc.file_url) doc.file_url = publicUrl;
          changed = true;
        }
      }
      if (changed) {
        await pool.query(`UPDATE hr_employees SET documents = $1 WHERE id = $2`, [JSON.stringify(docs), row.id]);
      }
    } catch (e) {
      console.error(`خطأ في موظف id=${row.id}:`, e);
    }
  }

  // ب) جدول hr_employee_documents
  const docRes = await pool.query(`SELECT id, user_id, document_name, file_url FROM hr_employee_documents WHERE file_url LIKE 'data:%'`);
  console.log(`وجدت ${docRes.rows.length} مستند في hr_employee_documents.`);
  for (const row of docRes.rows) {
    try {
      const publicUrl = await uploadBase64ToStorage(row.file_url, row.document_name || 'doc', `employee-docs/${row.user_id}`);
      await pool.query(`UPDATE hr_employee_documents SET file_url = $1 WHERE id = $2`, [publicUrl, row.id]);
    } catch (e) {
      console.error(`خطأ في مستند id=${row.id}:`, e);
    }
  }

  // ج) جدول طلبات الإجازات hr_leave_requests
  const leaveRes = await pool.query(`SELECT id, user_id, attachment_name, attachment_url FROM hr_leave_requests WHERE attachment_url LIKE 'data:%'`);
  console.log(`وجدت ${leaveRes.rows.length} مرفق إجازة.`);
  for (const row of leaveRes.rows) {
    try {
      const publicUrl = await uploadBase64ToStorage(row.attachment_url, row.attachment_name || 'leave_attachment', `leave-attachments/${row.user_id}`);
      await pool.query(`UPDATE hr_leave_requests SET attachment_url = $1 WHERE id = $2`, [publicUrl, row.id]);
    } catch (e) {
      console.error(`خطأ في إجازة id=${row.id}:`, e);
    }
  }

  // د) جدول مرفقات الـ CRM crm_attachments
  const crmRes = await pool.query(`SELECT id, file_name, file_url FROM crm_attachments WHERE file_url LIKE 'data:%'`);
  console.log(`وجدت ${crmRes.rows.length} مرفق في CRM.`);
  for (const row of crmRes.rows) {
    try {
      const publicUrl = await uploadBase64ToStorage(row.file_url, row.file_name || 'crm_file', `crm-attachments`);
      await pool.query(`UPDATE crm_attachments SET file_url = $1 WHERE id = $2`, [publicUrl, row.id]);
    } catch (e) {
      console.error(`خطأ في مرفق CRM id=${row.id}:`, e);
    }
  }

  // هـ) صور المستخدمين users (avatar_url)
  const userRes = await pool.query(`SELECT id, name, avatar_url FROM users WHERE avatar_url LIKE 'data:%'`);
  console.log(`وجدت ${userRes.rows.length} صورة مستخدم Base64 في users.`);
  for (const row of userRes.rows) {
    try {
      const publicUrl = await uploadBase64ToStorage(row.avatar_url, `avatar_${row.id}`, `avatars`);
      if (publicUrl) {
        await pool.query(`UPDATE users SET avatar_url = $1 WHERE id = $2`, [publicUrl, row.id]);
        console.log(`تم ترحيل صورة المستخدم id=${row.id} بنجاح: ${publicUrl}`);
      }
    } catch (e) {
      console.error(`خطأ في صورة مستخدم id=${row.id}:`, e);
    }
  }

  console.log('✅ اكتمل الترحيل بنجاح!');
  await pool.end();
}

runMigration();
