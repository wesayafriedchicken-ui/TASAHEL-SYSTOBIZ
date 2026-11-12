import express from "express";
import { eventBus } from "../../lib/eventBus.js";

export default function webhookRoutes() {
  const router = express.Router();

  // Webhook endpoint: /api/webhooks/:source
  router.post("/:source", async (req, res) => {
    const { source } = req.params;
    const payload = req.body;

    console.log(`[Webhook] Received from ${source}:`, payload);

    // 1. Basic Validation (In a real app, verify signatures here)
    if (!payload || Object.keys(payload).length === 0) {
      return res.status(400).json({ error: "Empty payload" });
    }

    // 2. Normalize and Publish
    // We publish a generic event based on the source
    // Subscribers will handle the specific logic
    eventBus.publish(`webhook:${source}`, {
      source,
      payload,
      received_at: new Date().toISOString()
    });

    // Respond immediately to the source to avoid timeout
    res.status(200).json({ status: "received" });
  });

  // Specific endpoint for WhatsApp (example of more complex validation)
  router.post("/whatsapp/message", async (req, res) => {
    const payload = req.body;
    
    // Validate WhatsApp specific fields
    if (payload.object === 'whatsapp_business_account') {
      eventBus.publish('whatsapp:message', payload);
      return res.status(200).send('EVENT_RECEIVED');
    }
    
    res.status(404).send();
  });

  return router;
}
