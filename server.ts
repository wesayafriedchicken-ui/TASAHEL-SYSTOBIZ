import dotenv from "dotenv";
dotenv.config({ override: true });
import express, { Request, Response, NextFunction } from "express";
import { createServer as createViteServer } from "vite";
import http from "http";
import { WebSocketServer } from "ws";
import path from "path";
import { fileURLToPath } from "url";
import { initDatabase } from "./server/db/schema.js";
import { authenticate } from "./server/middleware/auth.js";
import authRoutes from "./server/modules/auth/auth.routes.js";
import leadRoutes from "./server/modules/leads/lead.routes.js";
import sopRoutes from "./server/modules/sops/sop.routes.js";
import taskRoutes from "./server/modules/tasks/task.routes.js";
import kpiRoutes from "./server/modules/kpis/kpi.routes.js";
import kbRoutes from "./server/modules/kb/kb.routes.js";
import crmRoutes from "./server/modules/crm/crm.routes.js";
import qaRoutes from "./server/modules/qa/qa.routes.js";
import riskRoutes from "./server/modules/risk/risk.routes.js";
import kaizenRoutes from "./server/modules/kaizen/kaizen.routes.js";
import raciRoutes from "./server/modules/raci/raci.routes.js";
import automationRoutes from "./server/modules/automation/automation.routes.js";
import webhookRoutes from "./server/modules/automation/webhook.routes.js";
import trainingRoutes from "./server/modules/training/training.routes.js";
import chatRoutes from "./server/modules/chat/chat.routes.js";
import integrationRoutes from "./server/modules/integrations/integrations.routes.js";
import processMappingRoutes from "./server/modules/process_mapping/process_mapping.routes.js";
import dashboardRoutes from "./server/modules/dashboard/dashboard.routes.js";
import adminRoutes from "./server/modules/admin/admin.routes.js";
import productRoutes from "./server/modules/products/products.routes.js";
import hrRoutes from "./server/modules/hr/hr.routes.js";
import genericModuleRoutes from "./server/modules/generic/generic.routes.js";
import marketingRoutes from "./server/modules/marketing/marketing.routes.js";
import accountingRoutes from "./server/modules/accounting/accounting.routes.js";
import aiBusinessRoutes from "./server/modules/ai_business/ai_business.routes.js";
import operationsHubRoutes from "./server/modules/operations_hub/operations_hub.routes.js";
import meetingsRoutes from "./server/modules/meetings/meetings.routes.js";
import storageRoutes from "./server/modules/storage/storage.routes.js";
import mobileRoutes from "./server/modules/mobile/mobile.routes.js";
import { createZktecoAdmsRouter } from "./server/modules/hr/zkteco.routes.js";
import { pool, isDatabaseAvailable } from "./server/db/schema.js";
import { automationService } from "./server/services/automation.service.js";
import { NotificationService } from "./server/services/notification.service.js";
import { IntegrationService } from "./server/services/integration.service.js";

// Safely define __filename and __dirname for ESM/CJS compatibility
let __filename = "";
let __dirname = "";
try {
  __filename = fileURLToPath(import.meta.url);
  __dirname = path.dirname(__filename);
} catch (e) {
  // In CommonJS or bundled environments, these are already available or handled gracefully
}

// Prevent unhandled promise rejections or exceptions from terminating the server process
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception thrown:', err);
});

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Global Middleware
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  app.use(express.text({ type: ['text/*', 'application/octet-stream'], limit: '10mb' }));

  // Initialize Database in background so server binds to port 3000 immediately for health checks
  initDatabase()
    .then(() => {
      console.log("Database initialized and ready.");
    })
    .catch((err) => {
      console.error("Database initialization notice:", err);
    });

  // Initialize WebSockets with custom upgrade handling to avoid conflicting with Vite
  const wss = new WebSocketServer({ noServer: true });
  const clients = new Map<any, { userId?: number; companyId?: number; roomId?: number }>();
  NotificationService.setWss(wss, clients);

  server.on("upgrade", (request, socket, head) => {
    const secProtocol = (request.headers["sec-websocket-protocol"] || "").toString();
    const url = request.url || "";
    // Safely ignore any Vite HMR upgrade requests
    if (secProtocol.includes("vite-hmr") || url.includes("vite-hmr") || url.startsWith("/@vite")) {
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  });

  wss.on("connection", (ws) => {
    console.log("New WebSocket connection");
    clients.set(ws, {});
    ws.send(JSON.stringify({ type: "WELCOME", message: "Connected to Systo Biz Real-time Engine" }));

    ws.on("close", () => {
      clients.delete(ws);
    });

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        const clientInfo = clients.get(ws);

        switch (message.type) {
          case "AUTH":
            if (clientInfo) {
              clientInfo.userId = message.userId;
              clientInfo.companyId = message.companyId || 1;
            }
            // Update presence to online
            if (message.userId) {
              await pool.query("INSERT INTO user_presence (user_id, status) VALUES ($1, 'online') ON CONFLICT (user_id) DO UPDATE SET status = 'online', last_seen = CURRENT_TIMESTAMP", [message.userId]).catch(() => {});
            }
            break;

          case "SUBSCRIBE_COMPANY":
            if (clientInfo && message.companyId) {
              clientInfo.companyId = message.companyId;
            }
            break;

          case "CHAT_JOIN_ROOM":
            if (clientInfo) clientInfo.roomId = message.roomId;
            break;

          case "CHAT_SEND_MESSAGE":
            if (clientInfo?.userId && clientInfo?.roomId) {
              const { content, mentions, is_announcement, attachment_url, attachment_name, attachment_type, parent_id, audio_duration } = message;
              const result = await pool.query(
                "INSERT INTO chat_messages (room_id, sender_id, content, mentions, is_announcement, attachment_url, attachment_name, attachment_type, parent_id, audio_duration) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *",
                [clientInfo.roomId, clientInfo.userId, content, JSON.stringify(mentions || []), is_announcement || false, attachment_url, attachment_name, attachment_type, parent_id || null, audio_duration || null]
              );
              const savedMsg = result.rows[0];
              
              // Fetch sender info
              const sender = await pool.query("SELECT name, email, avatar_url FROM users WHERE id = $1", [clientInfo.userId]);
              const senderInfo = sender.rows[0] || {};
              const senderName = senderInfo.name || 'Unknown';
              
              const broadcastMsg = {
                type: "CHAT_NEW_MESSAGE",
                message: {
                  ...savedMsg,
                  sender_name: senderName,
                  sender_email: senderInfo.email,
                  sender_avatar: senderInfo.avatar_url,
                  reply_count: 0,
                  reactions: []
                }
              };

              // Broadcast to all clients in the same room
              wss.clients.forEach((client: any) => {
                const info = clients.get(client);
                if (info?.roomId === clientInfo.roomId) {
                  client.send(JSON.stringify(broadcastMsg));
                }
              });

              // Check for mentions and trigger notifications
              if (mentions && Array.isArray(mentions)) {
                for (const mentionedId of mentions) {
                  // Trigger in-app notification for mentioned user
                  wss.clients.forEach((client: any) => {
                    const info = clients.get(client);
                    if (info?.userId === mentionedId) {
                      client.send(JSON.stringify({
                        type: "NOTIFICATION",
                        notification: {
                          title: "New Mention",
                          message: `You were mentioned in a chat by ${senderName}`,
                          user_id: mentionedId,
                          created_at: new Date().toISOString(),
                          is_read: false
                        }
                      }));
                    }
                  });
                }
              }
            }
            break;

          case "CHAT_ADD_REACTION":
            if (clientInfo?.userId && message.messageId && message.emoji) {
              try {
                await pool.query(
                  "INSERT INTO chat_message_reactions (message_id, user_id, emoji) VALUES ($1, $2, $3) ON CONFLICT (message_id, user_id, emoji) DO NOTHING",
                  [message.messageId, clientInfo.userId, message.emoji]
                );
                
                // Fetch updated reactions for this message
                const reactionsResult = await pool.query(`
                  SELECT emoji, COUNT(*) as count, ARRAY_AGG(user_id) as user_ids 
                  FROM chat_message_reactions 
                  WHERE message_id = $1 
                  GROUP BY emoji
                `, [message.messageId]);

                // Broadcast updated reactions
                wss.clients.forEach((client: any) => {
                  const info = clients.get(client);
                  if (info?.roomId === clientInfo.roomId) {
                    client.send(JSON.stringify({
                      type: "CHAT_MESSAGE_REACTIONS_UPDATE",
                      messageId: message.messageId,
                      reactions: reactionsResult.rows
                    }));
                  }
                });
              } catch (err) {
                console.error("Reaction Error:", err);
              }
            }
            break;

          case "CHAT_TYPING":
            if (clientInfo?.userId && clientInfo?.roomId) {
              wss.clients.forEach((client: any) => {
                const info = clients.get(client);
                if (info?.roomId === clientInfo.roomId && client !== ws) {
                  client.send(JSON.stringify({
                    type: "CHAT_USER_TYPING",
                    userId: clientInfo.userId,
                    roomId: clientInfo.roomId,
                    isTyping: message.isTyping
                  }));
                }
              });
            }
            break;
        }
      } catch (err) {
        console.error("WS Message Error:", err);
      }
    });

    ws.on("close", async () => {
      const info = clients.get(ws);
      if (info?.userId) {
        try {
          await pool.query("UPDATE user_presence SET status = 'offline', last_seen = CURRENT_TIMESTAMP WHERE user_id = $1", [info.userId]);
        } catch (e) {
          // Non-critical: offline presence update can fail safely without breaking
        }
      }
      clients.delete(ws);
    });
  });

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "connected", 
      database: isDatabaseAvailable ? "PostgreSQL/Supabase" : "sandbox", 
      message: isDatabaseAvailable ? "Database connected" : "Database in offline sandbox mode. Local-first storage active.", 
      time: new Date().toISOString() 
    });
  });

  app.use("/api/auth", authRoutes());
  app.use("/api/mobile", mobileRoutes());

  // ZKTeco ADMS (Automatic Data Master Server) Cloud Push Protocol
  // Physical devices connect directly to /iclock/cdata, /iclock/getrequest, etc.
  app.use("/iclock", createZktecoAdmsRouter());

  // Apply authentication to all other /api routes
  app.use("/api", authenticate);

  app.use("/api/leads", leadRoutes(wss));
  app.use("/api/crm", crmRoutes(wss));
  app.use("/api/qa", qaRoutes(wss));
  app.use("/api/automation", automationRoutes());
  app.use("/api/webhooks", webhookRoutes());
  app.use("/api/sops", sopRoutes());
  app.use("/api/tasks", taskRoutes());
  app.use("/api/kpis", kpiRoutes());
  app.use("/api/kb", kbRoutes(wss));
  app.use("/api/raci", raciRoutes());
  app.use("/api/training", trainingRoutes(wss));
  app.use("/api/chat", chatRoutes());
  app.use("/api/integrations", integrationRoutes);
  app.use("/api/process-mapping", processMappingRoutes);
  app.use("/api/process-maps", processMappingRoutes); // Compatibility alias
  app.use("/api/dashboard", dashboardRoutes());
  app.use("/api/admin", adminRoutes());
  app.use("/api/products", productRoutes(wss));
  app.use("/api/catalog", productRoutes(wss));
  app.use("/api/risks", riskRoutes(wss));
  app.use("/api/hr", hrRoutes(wss));
  app.use("/api/kaizen", kaizenRoutes(wss));
  app.use("/api/marketing", marketingRoutes());
  app.use("/api/accounting", accountingRoutes(wss));
  app.use("/api/ai-business", aiBusinessRoutes(wss));
  app.use("/api/meetings", meetingsRoutes(wss));
  app.use("/api/operations", operationsHubRoutes(wss));
  app.use("/api/storage", storageRoutes());
  app.use("/api/upload", storageRoutes());
  
  // Public-ish routes (require auth via x-user-id for now)
  app.use("/api/departments", genericModuleRoutes("departments", wss));
  app.use("/api/roles", genericModuleRoutes("roles", wss));
  app.use("/api/users", genericModuleRoutes("users", wss));
  app.use("/api/job_descriptions", genericModuleRoutes("job_descriptions", wss));
  app.use("/api/work_teams", genericModuleRoutes("work_teams", wss));
  app.use("/api/job_titles", genericModuleRoutes("job_titles", wss));
  
  app.use("/api/comm", genericModuleRoutes("internal_messages", wss));
  app.use("/api/improvement", genericModuleRoutes("kaizen_suggestions", wss));

  // 404 handler for all /api routes to return JSON instead of falling back to SPA HTML
  app.use("/api", (req, res) => {
    res.status(404).json({ error: "API Route not found", path: req.originalUrl });
  });

  // Global Error Handler for API
  app.use((err: any, req: any, res: any, next: NextFunction) => {
    const originalUrl = req.originalUrl || req.path || req.url || "";
    if (originalUrl.startsWith("/api")) {
      console.error("API Error:", err);
      return res.status(err.status || 500).json({
        error: "Internal Server Error",
        message: err?.message || "An unexpected error occurred",
        details: process.env.NODE_ENV === "development" ? err.stack : undefined
      });
    }
    next(err);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.on("error", (err: any) => {
    console.error("Server error encountered:", err);
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Systo Biz Backend running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("FATAL ERROR starting server:", err);
});
