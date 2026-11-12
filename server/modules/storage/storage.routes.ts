import express, { Request, Response } from 'express';
import multer from 'multer';
import {
  uploadBufferToStorage,
  uploadBase64ToStorage,
  migrateDatabaseBase64Files,
  ensureStorageBucket,
  BUCKET_NAME,
  getSupabaseAdmin,
} from '../../lib/supabaseStorage.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB
  },
});

export default function storageRoutes() {
  const router = express.Router();

  // Ensure storage bucket is initialized
  ensureStorageBucket().catch((e) => console.warn('Supabase storage check notice:', e?.message || 'Storage warming up'));

  /**
   * POST /api/storage/upload
   * Accepts single file upload via multipart/form-data
   * Field name: "file"
   * Optional body field: "folder" (e.g. "employee-documents", "crm-attachments", "chat")
   */
  router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
    try {
      const file = req.file;
      const folder = (req.body.folder as string) || 'uploads';

      // 1. Check if multipart file is present
      if (file) {
        let bufferToUpload = file.buffer;
        // Sanitize EBML header if duplicate leading byte exists
        if (
          bufferToUpload &&
          bufferToUpload.length > 4 &&
          bufferToUpload[0] === 0x1a &&
          bufferToUpload[1] === 0x1a &&
          bufferToUpload[2] === 0x45 &&
          bufferToUpload[3] === 0xdf &&
          bufferToUpload[4] === 0xa3
        ) {
          bufferToUpload = bufferToUpload.subarray(1);
        }

        try {
          const result = await uploadBufferToStorage(
            bufferToUpload,
            file.originalname,
            file.mimetype,
            folder
          );

          return res.json({
            success: true,
            url: result.url,
            path: result.path,
            name: file.originalname,
            size: result.size,
            type: file.mimetype,
          });
        } catch (storageErr: any) {
          console.warn('Supabase storage upload failed, serving data URI fallback:', storageErr?.message);
          const base64Str = bufferToUpload.toString('base64');
          const dataUri = `data:${file.mimetype || 'application/octet-stream'};base64,${base64Str}`;
          return res.json({
            success: true,
            url: dataUri,
            path: `${folder}/${file.originalname}`,
            name: file.originalname,
            size: file.size,
            type: file.mimetype,
            fallback: true,
          });
        }
      }

      // 2. Check if base64 payload was sent in JSON body
      const { base64, filename } = req.body;
      if (base64) {
        const publicUrl = await uploadBase64ToStorage(
          base64,
          filename || 'uploaded_file',
          folder
        );

        return res.json({
          success: true,
          url: publicUrl,
          name: filename || 'uploaded_file',
        });
      }

      return res.status(400).json({
        success: false,
        error: 'No file or base64 data provided in request',
      });
    } catch (err: any) {
      console.error('Upload route error:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'File upload failed',
      });
    }
  });

  /**
   * POST /api/storage/upload-multiple
   * Accepts multiple files via multipart/form-data
   * Field name: "files"
   */
  router.post('/upload-multiple', upload.array('files', 20), async (req: Request, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      const folder = (req.body.folder as string) || 'uploads';

      if (!files || files.length === 0) {
        return res.status(400).json({ success: false, error: 'No files provided' });
      }

      const results = [];
      for (const file of files) {
        const uploadRes = await uploadBufferToStorage(
          file.buffer,
          file.originalname,
          file.mimetype,
          folder
        );
        results.push({
          url: uploadRes.url,
          path: uploadRes.path,
          name: file.originalname,
          size: uploadRes.size,
          type: file.mimetype,
        });
      }

      return res.json({
        success: true,
        files: results,
      });
    } catch (err: any) {
      console.error('Upload multiple error:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Multi-file upload failed',
      });
    }
  });

  /**
   * POST /api/storage/migrate
   * Triggers the full database scan and migration of any remaining base64 files to Supabase Storage
   */
  router.post('/migrate', async (req: Request, res: Response) => {
    try {
      const result = await migrateDatabaseBase64Files();
      return res.json(result);
    } catch (err: any) {
      console.error('Migration endpoint error:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Migration failed',
      });
    }
  });

  /**
   * GET /api/storage/stats
   * Returns storage bucket status and stats
   */
  router.get('/stats', async (req: Request, res: Response) => {
    try {
      const supabase = getSupabaseAdmin();
      const { data: buckets, error } = await supabase.storage.listBuckets();
      if (error) throw error;

      return res.json({
        success: true,
        bucket: BUCKET_NAME,
        allBuckets: buckets,
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}
