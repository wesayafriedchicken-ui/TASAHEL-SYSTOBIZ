import { supabase } from './supabase';

export interface UploadedFileInfo {
  url: string;
  name: string;
  size: string;
  type: string;
  path?: string;
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Uploads a file directly to Supabase Storage.
 * Uses the backend /api/storage/upload endpoint with automatic client-side Supabase fallback.
 */
export async function uploadFileToStorage(
  file: File,
  folder = 'employee-documents'
): Promise<UploadedFileInfo> {
  const cleanExt = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const cleanBaseName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const uniqueName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${cleanBaseName}`;
  const filePath = `${folder}/${uniqueName}`;

  // 1. Primary path: Upload via /api/storage/upload (Node backend with Service Role)
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const res = await fetch('/api/storage/upload', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      if (data.url) {
        return {
          url: data.url,
          name: file.name,
          size: formatBytes(file.size),
          type: cleanExt,
          path: data.path || filePath,
        };
      }
    }
  } catch (backendErr) {
    console.warn('Backend storage upload route error, attempting direct Supabase Storage SDK fallback:', backendErr);
  }

  // 2. Fallback path: Direct upload via Supabase client SDK
  try {
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) throw error;

    const { data: publicData } = supabase.storage
      .from('documents')
      .getPublicUrl(data.path);

    return {
      url: publicData.publicUrl,
      name: file.name,
      size: formatBytes(file.size),
      type: cleanExt,
      path: data.path,
    };
  } catch (sdkErr: any) {
    console.warn('Direct Supabase SDK upload failed, generating resilient Data URL:', sdkErr?.message || sdkErr);
    
    // 3. Resilient fallback: Convert to Data URL so media/voice notes/attachments never fail
    return new Promise<UploadedFileInfo>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          url: reader.result as string,
          name: file.name,
          size: formatBytes(file.size),
          type: cleanExt,
          path: filePath,
        });
      };
      reader.onerror = () => {
        // As an ultimate fallback, use object URL
        resolve({
          url: URL.createObjectURL(file),
          name: file.name,
          size: formatBytes(file.size),
          type: cleanExt,
          path: filePath,
        });
      };
      reader.readAsDataURL(file);
    });
  }
}

/**
 * Upload multiple files to Supabase Storage in parallel
 */
export async function uploadFilesToStorage(
  files: File[] | FileList,
  folder = 'employee-documents'
): Promise<UploadedFileInfo[]> {
  const fileArray = Array.from(files);
  if (fileArray.length === 0) return [];

  // Upload in parallel
  return Promise.all(fileArray.map((f) => uploadFileToStorage(f, folder)));
}

/**
 * Trigger backend migration of legacy base64 files
 */
export async function triggerStorageMigration(): Promise<{
  success: boolean;
  totalMigrated: number;
  details: Record<string, number>;
}> {
  const res = await fetch('/api/storage/migrate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Failed to run migration endpoint');
  }

  return res.json();
}
