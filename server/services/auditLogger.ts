import { pool } from '../db/schema.js';

export async function logAction(
  userId: number | null,
  action: string,
  entityType?: string,
  entityId?: number,
  details?: any
) {
  try {
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)',
      [userId, action, entityType, entityId, details ? JSON.stringify(details) : null]
    );
  } catch (error) {
    console.error('Failed to log audit action:', error);
    // Don't throw, we don't want audit logging to break the main app flow
  }
}
