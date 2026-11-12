import dotenv from 'dotenv';
dotenv.config({ override: true });
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { pool } from '../db/schema.js';

const SUPABASE_URL = (process.env.VITE_SUPABASE_URL && !process.env.VITE_SUPABASE_URL.includes('mtzbvvotrffnylwsujra'))
  ? process.env.VITE_SUPABASE_URL
  : 'https://dpqpwqcmhcczwfvrkpot.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

export const BUCKET_NAME = 'documents';

let supabaseClientInstance: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  const currentKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  const currentUrl = (process.env.VITE_SUPABASE_URL && !process.env.VITE_SUPABASE_URL.includes('mtzbvvotrffnylwsujra'))
    ? process.env.VITE_SUPABASE_URL
    : 'https://dpqpwqcmhcczwfvrkpot.supabase.co';

  if (!supabaseClientInstance) {
    if (!currentKey) {
      console.warn('Warning: No Supabase API key available for Supabase Storage');
    }
    supabaseClientInstance = createClient(currentUrl, currentKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
  }
  return supabaseClientInstance;
}

/**
 * Ensures the public storage bucket exists and is public
 */
export async function ensureStorageBucket(bucket = BUCKET_NAME): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      console.warn('Notice checking Supabase storage buckets:', listError?.message || 'Storage temporarily unavailable');
      return;
    }

    const exists = buckets?.some(b => b.name === bucket);
    if (!exists) {
      const { error: createError } = await supabase.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: 104857600 // 100MB
      });
      if (createError) {
        console.error(`Error creating bucket ${bucket}:`, createError);
      } else {
        console.log(`Supabase Storage bucket "${bucket}" successfully created as public.`);
      }
    }
  } catch (err) {
    console.error('ensureStorageBucket exception:', err);
  }
}

/**
 * Upload a raw Buffer to Supabase Storage and return its public CDN URL
 */
export async function uploadBufferToStorage(
  buffer: Buffer,
  fileName: string,
  contentType: string,
  folder = 'general'
): Promise<{ url: string; path: string; size: number }> {
  await ensureStorageBucket();
  const supabase = getSupabaseAdmin();

  // Sanitize filename to avoid weird character issues in S3/Supabase paths
  const cleanBaseName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const uniquePrefix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const filePath = `${folder}/${uniquePrefix}_${cleanBaseName}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, buffer, {
      contentType: contentType || 'application/octet-stream',
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload file to Supabase Storage: ${error.message}`);
  }

  const { data: publicData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path || filePath);

  return {
    url: publicData.publicUrl,
    path: data.path || filePath,
    size: buffer.length,
  };
}

/**
 * Parse a data: URI or base64 string, upload to Supabase Storage, and return the public URL
 * If already an HTTP/HTTPS URL, returns it directly without re-uploading.
 */
export async function uploadBase64ToStorage(
  dataUriOrBase64: string,
  originalFilename = 'file',
  folder = 'migrated'
): Promise<string> {
  if (!dataUriOrBase64 || typeof dataUriOrBase64 !== 'string') {
    return '';
  }

  // Already a URL
  if (dataUriOrBase64.startsWith('http://') || dataUriOrBase64.startsWith('https://')) {
    return dataUriOrBase64;
  }

  // Check if it's a data URI
  let mimeType = 'application/octet-stream';
  let buffer: Buffer;

  if (dataUriOrBase64.startsWith('data:image/svg+xml')) {
    mimeType = 'image/svg+xml';
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
      // Fallback for other data: URIs (e.g. utf8 or unencoded)
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

  if (buffer.length === 0) {
    return '';
  }

  // Determine file extension if missing from filename
  let ext = '';
  if (originalFilename.includes('.')) {
    ext = originalFilename.split('.').pop() || '';
  } else {
    const mimeMap: Record<string, string> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'image/svg+xml': 'svg',
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'text/plain': 'txt',
    };
    ext = mimeMap[mimeType] || 'bin';
  }

  const finalName = originalFilename.includes('.') ? originalFilename : `${originalFilename}.${ext}`;
  const uploadResult = await uploadBufferToStorage(buffer, finalName, mimeType, folder);
  return uploadResult.url;
}

/**
 * Migration routine:
 * Finds all base64-stored files across tables in the database,
 * converts them to files stored in Supabase Storage, and updates
 * the database records to point to the new public URLs.
 */
export async function migrateDatabaseBase64Files(): Promise<{
  success: boolean;
  totalMigrated: number;
  details: Record<string, number>;
}> {
  console.log('🔄 [STORAGE MIGRATION] Starting database base64 to Supabase Storage migration...');
  const details: Record<string, number> = {
    hr_employees_documents: 0,
    hr_employee_documents_table: 0,
    hr_leave_requests: 0,
    crm_attachments: 0,
    users_avatar: 0,
  };

  try {
    await ensureStorageBucket();

    // 1. hr_employees -> documents JSONB column
    const empResult = await pool.query(
      `SELECT id, user_id, documents FROM hr_employees WHERE documents::text LIKE '%data:%'`
    );
    for (const row of empResult.rows) {
      try {
        const docs = Array.isArray(row.documents)
          ? row.documents
          : (typeof row.documents === 'string' ? JSON.parse(row.documents) : []);
        
        let modified = false;
        for (const doc of docs) {
          if (doc.url && typeof doc.url === 'string' && doc.url.startsWith('data:')) {
            console.log(`[STORAGE MIGRATION] Uploading base64 doc "${doc.name || 'unnamed'}" for employee user_id=${row.user_id}...`);
            const publicUrl = await uploadBase64ToStorage(
              doc.url,
              doc.name || `emp_${row.user_id}_doc_${doc.id || Date.now()}`,
              `employee-docs/${row.user_id || row.id}`
            );
            doc.url = publicUrl;
            if (doc.file_url) doc.file_url = publicUrl;
            modified = true;
            details.hr_employees_documents++;
          }
        }

        if (modified) {
          await pool.query(
            `UPDATE hr_employees SET documents = $1 WHERE id = $2`,
            [JSON.stringify(docs), row.id]
          );
        }
      } catch (err) {
        console.error(`Error migrating hr_employees id=${row.id}:`, err);
      }
    }

    // 2. hr_employee_documents -> file_url TEXT column
    const docTblResult = await pool.query(
      `SELECT id, user_id, document_name, file_url FROM hr_employee_documents WHERE file_url LIKE 'data:%'`
    );
    for (const row of docTblResult.rows) {
      try {
        console.log(`[STORAGE MIGRATION] Uploading hr_employee_documents id=${row.id} "${row.document_name}"...`);
        const publicUrl = await uploadBase64ToStorage(
          row.file_url,
          row.document_name || `doc_${row.id}`,
          `employee-docs/${row.user_id || 'general'}`
        );
        await pool.query(
          `UPDATE hr_employee_documents SET file_url = $1 WHERE id = $2`,
          [publicUrl, row.id]
        );
        details.hr_employee_documents_table++;
      } catch (err) {
        console.error(`Error migrating hr_employee_documents id=${row.id}:`, err);
      }
    }

    // 3. hr_leave_requests -> attachment_url TEXT column
    const leaveResult = await pool.query(
      `SELECT id, user_id, attachment_name, attachment_url FROM hr_leave_requests WHERE attachment_url LIKE 'data:%'`
    );
    for (const row of leaveResult.rows) {
      try {
        console.log(`[STORAGE MIGRATION] Uploading leave attachment id=${row.id} "${row.attachment_name}"...`);
        const publicUrl = await uploadBase64ToStorage(
          row.attachment_url,
          row.attachment_name || `leave_attachment_${row.id}`,
          `leave-attachments/${row.user_id || row.id}`
        );
        await pool.query(
          `UPDATE hr_leave_requests SET attachment_url = $1 WHERE id = $2`,
          [publicUrl, row.id]
        );
        details.hr_leave_requests++;
      } catch (err) {
        console.error(`Error migrating hr_leave_requests id=${row.id}:`, err);
      }
    }

    // 4. crm_attachments -> file_url TEXT column
    const crmResult = await pool.query(
      `SELECT id, file_name, file_url FROM crm_attachments WHERE file_url LIKE 'data:%'`
    );
    for (const row of crmResult.rows) {
      try {
        console.log(`[STORAGE MIGRATION] Uploading crm_attachment id=${row.id} "${row.file_name}"...`);
        const publicUrl = await uploadBase64ToStorage(
          row.file_url,
          row.file_name || `crm_attachment_${row.id}`,
          `crm-attachments`
        );
        await pool.query(
          `UPDATE crm_attachments SET file_url = $1 WHERE id = $2`,
          [publicUrl, row.id]
        );
        details.crm_attachments++;
      } catch (err) {
        console.error(`Error migrating crm_attachments id=${row.id}:`, err);
      }
    }

    // 5. users -> avatar_url TEXT column
    const usersResult = await pool.query(
      `SELECT id, name, avatar_url FROM users WHERE avatar_url LIKE 'data:%'`
    );
    for (const row of usersResult.rows) {
      try {
        console.log(`[STORAGE MIGRATION] Uploading user avatar id=${row.id} "${row.name}"...`);
        const publicUrl = await uploadBase64ToStorage(
          row.avatar_url,
          `avatar_user_${row.id}`,
          `avatars`
        );
        await pool.query(
          `UPDATE users SET avatar_url = $1 WHERE id = $2`,
          [publicUrl, row.id]
        );
        details.users_avatar++;
      } catch (err) {
        console.error(`Error migrating users avatar id=${row.id}:`, err);
      }
    }

    const totalMigrated = Object.values(details).reduce((acc, curr) => acc + curr, 0);
    console.log(`✅ [STORAGE MIGRATION] Completed! Total migrated files: ${totalMigrated}`, details);

    return {
      success: true,
      totalMigrated,
      details,
    };
  } catch (err) {
    console.error('[STORAGE MIGRATION] Failed during database base64 migration:', err);
    return {
      success: false,
      totalMigrated: 0,
      details,
    };
  }
}
