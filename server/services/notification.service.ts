import { pool } from "../db/schema.js";

export interface DataSignal {
  companyId?: number;
  module: string; // e.g., 'HR', 'CRM', 'TASKS', 'LEADS', 'ACCOUNTING'
  event: 'INSERT' | 'UPDATE' | 'DELETE' | 'SYNC' | 'REFRESH';
  id?: number | string;
  metadata?: Record<string, any>;
}

export class NotificationService {
  private static wss: any;
  private static clientsMap: Map<any, { userId?: number; companyId?: number; roomId?: number }> = new Map();

  static setWss(wss: any, clientsMap?: Map<any, { userId?: number; companyId?: number; roomId?: number }>) {
    this.wss = wss;
    if (clientsMap) {
      this.clientsMap = clientsMap;
    }
  }

  static setClientsMap(clientsMap: Map<any, { userId?: number; companyId?: number; roomId?: number }>) {
    this.clientsMap = clientsMap;
  }

  /**
   * Broadcast a lightweight data mutation signal scoped strictly by company_id.
   * Prevents sending giant payloads or whole table dumps over WebSocket.
   */
  static broadcastSignal(signal: DataSignal) {
    if (!this.wss) return;

    const payload = JSON.stringify({
      type: "DATA_SIGNAL",
      module: signal.module,
      event: signal.event,
      id: signal.id,
      company_id: signal.companyId,
      metadata: signal.metadata,
      timestamp: Date.now()
    });

    this.wss.clients.forEach((client: any) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        const info = this.clientsMap.get(client);
        // If companyId is specified, only send to clients belonging to the same company
        if (signal.companyId && info?.companyId && info.companyId !== signal.companyId) {
          return;
        }
        client.send(payload);
      }
    });
  }

  static async notify(
    userId: number | null,
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info',
    link?: string,
    companyId?: number
  ) {
    try {
      // Save to DB
      const result = await pool.query(
        "INSERT INTO notifications (user_id, title, message, type, link, company_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
        [userId, title, message, type, link, companyId || 1]
      );
      const notification = result.rows[0];

      // Broadcast via WebSocket (targeted strictly to specific user or company)
      if (this.wss) {
        const payload = JSON.stringify({
          type: "NOTIFICATION",
          notification
        });

        this.wss.clients.forEach((client: any) => {
          if (client.readyState === 1) {
            const info = this.clientsMap.get(client);
            if (userId) {
              if (info?.userId === userId) {
                client.send(payload);
              }
            } else if (companyId) {
              if (!info?.companyId || info.companyId === companyId) {
                client.send(payload);
              }
            } else {
              client.send(payload);
            }
          }
        });
      }

      return notification;
    } catch (err) {
      console.error("Failed to send notification:", err);
    }
  }

  static async logActivity(userId: number | null, action: string, entityType?: string, entityId?: number, details?: string) {
    try {
      await pool.query(
        "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES ($1, $2, $3, $4, $5)",
        [userId, action, entityType, entityId, details]
      );
    } catch (err) {
      console.error("Failed to log activity:", err);
    }
  }
}

