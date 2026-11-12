import express from "express";
import { pool } from "../../db/schema.js";
import { logAction } from "../../services/auditLogger.js";
import { NotificationService } from "../../services/notification.service.js";
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini client using server-side key
function generateGoogleMeetCode(): string {
  const letters = "abcdefghijklmnopqrstuvwxyz";
  const genSegment = (len: number) => {
    let s = "";
    for (let i = 0; i < len; i++) {
      s += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    return s;
  };
  return `${genSegment(3)}-${genSegment(4)}-${genSegment(3)}`;
}

function getAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined. Please add it to Settings > Secrets.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

export default function meetingsRoutes(wss: any) {
  const router = express.Router();

  // GET all meetings with attendees
  router.get("/", async (req, res) => {
    try {
      const companyId = (req as any).user?.company_id || 1;

      // Fetch meetings
      const meetingsRes = await pool.query(
        `SELECT m.*, 
          COALESCE(
            json_agg(
              json_build_object('id', u.id, 'name', u.name, 'email', u.email, 'job_title', u.job_title)
            ) FILTER (WHERE u.id IS NOT NULL), '[]'
          ) as attendees
         FROM company_meetings m
         LEFT JOIN meeting_attendees ma ON m.id = ma.meeting_id
         LEFT JOIN users u ON ma.user_id = u.id
         WHERE m.company_id = $1
         GROUP BY m.id
         ORDER BY m.meeting_time DESC`,
        [companyId]
      );

      res.json(meetingsRes.rows);
    } catch (err: any) {
      console.error("Error fetching company meetings:", err);
      res.status(500).json({ error: "Failed to fetch company meetings: " + err.message });
    }
  });

  // POST create a meeting
  router.post("/", async (req, res) => {
    const { title, description, meeting_time, type, location, attendee_ids } = req.body;
    const authUserId = parseInt(req.headers['x-user-id'] as string) || 1;
    const companyId = (req as any).user?.company_id || 1;

    if (!title || !meeting_time || !type) {
      return res.status(400).json({ error: "Missing required fields: title, meeting_time, type" });
    }

    try {
      // 1. Generate Link if Online
      let meeting_link = null;
      if (type === 'online') {
        meeting_link = `https://meet.google.com/${generateGoogleMeetCode()}`;
      }

      // 2. Insert Meeting
      const meetingResult = await pool.query(
        `INSERT INTO company_meetings (title, description, meeting_time, type, meeting_link, location, company_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [title, description, meeting_time, type, meeting_link, type === 'offline' ? location : null, companyId]
      );

      const meeting = meetingResult.rows[0];

      // 3. Add Attendees & Create tasks
      const attendeeIdsArray = Array.isArray(attendee_ids) ? attendee_ids : [];
      for (const attendeeId of attendeeIdsArray) {
        // Link attendee
        await pool.query(
          "INSERT INTO meeting_attendees (meeting_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [meeting.id, attendeeId]
        );

        // Create notification
        const notificationTitle = `اجتماع جديد: ${title}`;
        const notificationMsg = `تمت دعوتك لحضور اجتماع "${title}" في ${new Date(meeting_time).toLocaleString('ar-EG')}. ${type === 'online' ? 'الاجتماع أونلاين.' : 'الاجتماع حضوري في ' + location}`;
        const meetLink = type === 'online' ? meeting_link : undefined;

        await NotificationService.notify(attendeeId, notificationTitle, notificationMsg, 'info', meetLink);

        // Create corresponding Task for the target employee with company_id
        await pool.query(
          `INSERT INTO tasks (title, description, status, priority, due_date, assigned_to, module_id, related_id, company_id)
           VALUES ($1, $2, 'pending', 'high', $3, $4, 'meeting-hub', $5, $6)`,
          [
            `حضور اجتماع: ${title}`,
            `الرجاء الالتزام بموعد الاجتماع. ${description || ''}\nالرابط أو الموقع: ${type === 'online' ? meeting_link : location}`,
            meeting_time,
            attendeeId,
            meeting.id,
            companyId
          ]
        );
      }

      // 4. Log Audit Action
      await logAction(authUserId, 'CREATE', 'Meeting', meeting.id, { title, type });

      // 5. Broadcast real-time update
      wss.clients.forEach((client: any) => {
        client.send(JSON.stringify({ type: "MODULE_UPDATED", table: "meetings" }));
        client.send(JSON.stringify({ type: "MODULE_UPDATED", table: "tasks" }));
        client.send(JSON.stringify({ type: "MODULE_UPDATED", table: "notifications" }));
      });

      res.status(201).json(meeting);
    } catch (err: any) {
      console.error("Error creating meeting:", err);
      res.status(500).json({ error: "Failed to create meeting: " + err.message });
    }
  });

  // PUT update a meeting
  router.put("/:id", async (req, res) => {
    const { id } = req.params;
    const { title, description, meeting_time, type, meeting_link, location, ai_summary, attendee_ids } = req.body;
    const authUserId = parseInt(req.headers['x-user-id'] as string) || 1;

    try {
      const currentRes = await pool.query("SELECT * FROM company_meetings WHERE id = $1", [id]);
      if (currentRes.rows.length === 0) {
        return res.status(404).json({ error: "Meeting not found" });
      }
      const current = currentRes.rows[0];

      let finalMeetingLink = meeting_link !== undefined ? meeting_link : current.meeting_link;
      // If type changed to online and currently has no link, generate one
      if (type === 'online' && current.type !== 'online' && !finalMeetingLink) {
        finalMeetingLink = `https://meet.google.com/${generateGoogleMeetCode()}`;
      }

      const updatedRes = await pool.query(
        `UPDATE company_meetings 
         SET title = $1, 
             description = $2, 
             meeting_time = $3, 
             type = $4, 
             meeting_link = $5, 
             location = $6, 
             ai_summary = $7,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $8 RETURNING *`,
        [
          title || current.title,
          description !== undefined ? description : current.description,
          meeting_time || current.meeting_time,
          type || current.type,
          finalMeetingLink,
          type === 'offline' ? (location || current.location) : null,
          ai_summary !== undefined ? ai_summary : current.ai_summary,
          id
        ]
      );

      const updated = updatedRes.rows[0];
      const companyId = (req as any).user?.company_id || 1;

      // Update attendees if attendee_ids provided
      if (Array.isArray(attendee_ids)) {
        // Delete current attendees
        await pool.query("DELETE FROM meeting_attendees WHERE meeting_id = $1", [id]);
        
        // Delete tasks for attendees that are no longer invited
        if (attendee_ids.length > 0) {
          await pool.query(
            "DELETE FROM tasks WHERE module_id = 'meeting-hub' AND related_id = $1 AND assigned_to NOT IN (SELECT unnest($2::integer[]))",
            [id, attendee_ids]
          );
        } else {
          await pool.query(
            "DELETE FROM tasks WHERE module_id = 'meeting-hub' AND related_id = $1",
            [id]
          );
        }

        // Add new ones & create/update tasks & notifications
        for (const attendeeId of attendee_ids) {
          await pool.query(
            "INSERT INTO meeting_attendees (meeting_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            [id, attendeeId]
          );

          // Check if task already exists
          const taskCheck = await pool.query(
            "SELECT id FROM tasks WHERE assigned_to = $1 AND module_id = 'meeting-hub' AND related_id = $2",
            [attendeeId, id]
          );

          if (taskCheck.rows.length === 0) {
            // Create notification
            const notificationTitle = `تعديل اجتماع: ${updated.title}`;
            const notificationMsg = `تمت دعوتك لحضور اجتماع "${updated.title}" في ${new Date(updated.meeting_time).toLocaleString('ar-EG')}.`;
            const meetLink = updated.type === 'online' ? updated.meeting_link : undefined;

            await NotificationService.notify(attendeeId, notificationTitle, notificationMsg, 'info', meetLink);

            // Create Task with company_id
            await pool.query(
              `INSERT INTO tasks (title, description, status, priority, due_date, assigned_to, module_id, related_id, company_id)
               VALUES ($1, $2, 'pending', 'high', $3, $4, 'meeting-hub', $5, $6)`,
              [
                `حضور اجتماع: ${updated.title}`,
                `الرجاء الالتزام بموعد الاجتماع. ${updated.description || ''}\nالرابط أو الموقع: ${updated.type === 'online' ? updated.meeting_link : updated.location}`,
                updated.meeting_time,
                attendeeId,
                id,
                companyId
              ]
            );
          } else {
            // Update existing task details
            await pool.query(
              `UPDATE tasks 
               SET title = $1, 
                   description = $2, 
                   due_date = $3
               WHERE assigned_to = $4 AND module_id = 'meeting-hub' AND related_id = $5`,
              [
                `حضور اجتماع: ${updated.title}`,
                `الرجاء الالتزام بموعد الاجتماع. ${updated.description || ''}\nالرابط أو الموقع: ${updated.type === 'online' ? updated.meeting_link : updated.location}`,
                updated.meeting_time,
                attendeeId,
                id
              ]
            );
          }
        }
      } else {
        // If attendee_ids wasn't provided, always update task details for all current attendees to stay in sync
        const currentAttendeesRes = await pool.query("SELECT user_id FROM meeting_attendees WHERE meeting_id = $1", [id]);
        const currentAttendeeIds = currentAttendeesRes.rows.map((r: any) => r.user_id);
        
        for (const attendeeId of currentAttendeeIds) {
          await pool.query(
            `UPDATE tasks 
             SET title = $1, 
                 description = $2, 
                 due_date = $3
             WHERE assigned_to = $4 AND module_id = 'meeting-hub' AND related_id = $5`,
            [
              `حضور اجتماع: ${updated.title}`,
              `الرجاء الالتزام بموعد الاجتماع. ${updated.description || ''}\nالرابط أو الموقع: ${updated.type === 'online' ? updated.meeting_link : updated.location}`,
              updated.meeting_time,
              attendeeId,
              id
            ]
          );
        }
      }

      // Audit Log
      await logAction(authUserId, 'UPDATE', 'Meeting', parseInt(id), { title: updated.title });

      // Broadcast
      wss.clients.forEach((client: any) => {
        client.send(JSON.stringify({ type: "MODULE_UPDATED", table: "meetings" }));
        client.send(JSON.stringify({ type: "MODULE_UPDATED", table: "tasks" }));
        client.send(JSON.stringify({ type: "MODULE_UPDATED", table: "notifications" }));
      });

      res.json(updated);
    } catch (err: any) {
      console.error("Error updating meeting:", err);
      res.status(500).json({ error: "Failed to update meeting: " + err.message });
    }
  });

  // DELETE a meeting
  router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    const authUserId = parseInt(req.headers['x-user-id'] as string) || 1;

    try {
      const meetingRes = await pool.query("SELECT title FROM company_meetings WHERE id = $1", [id]);
      if (meetingRes.rows.length === 0) {
        return res.status(404).json({ error: "Meeting not found" });
      }

      await pool.query("DELETE FROM company_meetings WHERE id = $1", [id]);

      // Explicitly delete tasks and attendees when meeting is deleted
      await pool.query("DELETE FROM tasks WHERE module_id = 'meeting-hub' AND related_id = $1", [id]);

      // Audit Log
      await logAction(authUserId, 'DELETE', 'Meeting', parseInt(id), { title: meetingRes.rows[0].title });

      // Broadcast
      wss.clients.forEach((client: any) => {
        client.send(JSON.stringify({ type: "MODULE_UPDATED", table: "meetings" }));
        client.send(JSON.stringify({ type: "MODULE_UPDATED", table: "tasks" }));
        client.send(JSON.stringify({ type: "MODULE_UPDATED", table: "notifications" }));
      });

      res.json({ success: true, message: "Meeting deleted successfully" });
    } catch (err: any) {
      console.error("Error deleting meeting:", err);
      res.status(500).json({ error: "Failed to delete meeting: " + err.message });
    }
  });

  // POST generate AI Summary, decisions, and tasks
  router.post("/:id/ai-summary", async (req, res) => {
    const { id } = req.params;
    const { notes } = req.body;
    const authUserId = parseInt(req.headers['x-user-id'] as string) || 1;

    if (!notes) {
      return res.status(400).json({ error: "Missing transcript/notes for AI generation" });
    }

    try {
      // 1. Fetch meeting & attendees list
      const meetingRes = await pool.query("SELECT * FROM company_meetings WHERE id = $1", [id]);
      if (meetingRes.rows.length === 0) {
        return res.status(404).json({ error: "Meeting not found" });
      }
      const meeting = meetingRes.rows[0];

      const attendeesRes = await pool.query(
        `SELECT u.id, u.name, u.email 
         FROM meeting_attendees ma
         JOIN users u ON ma.user_id = u.id
         WHERE ma.meeting_id = $1`,
        [id]
      );
      const attendees = attendeesRes.rows;

      // 2. Query Gemini API
      const ai = getAIClient();
      const prompt = `
You are the Executive AI Meeting Assistant and Secretary for an enterprise. Analyze the following meeting notes and generate:
1. A highly professional, executive summary of what was discussed.
2. A bulleted list of actual decisions made (القرارات المتخذة).
3. A structured list of concrete action items/tasks for specific attendees.

Here is the list of official meeting attendees (ID and Name):
${JSON.stringify(attendees)}

Meeting Title: "${meeting.title}"

Raw Meeting Discussion/Transcript/Notes:
"${notes}"

You MUST respond with a valid, clean JSON object inside a JSON markdown block. Do NOT include any introductory or concluding text outside the JSON. Follow this exact JSON structure:
{
  "summary": "Full summary text here in Arabic...",
  "decisions": [
    "Decision 1 in Arabic...",
    "Decision 2 in Arabic..."
  ],
  "actionItems": [
    {
      "user_id": 123, // MUST match exactly one of the attendee IDs provided
      "task_title": "Descriptive task title in Arabic...",
      "task_description": "Descriptive actionable steps for this user in Arabic..."
    }
  ]
}

Please ensure that all texts (summary, decisions, task titles, and descriptions) are written in professional and elegant Arabic.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt
      });

      const responseText = response.text || "";
      // Clean potential json markdown tags
      let jsonStr = responseText.trim();
      if (jsonStr.startsWith("```json")) {
        jsonStr = jsonStr.substring(7);
      }
      if (jsonStr.endsWith("```")) {
        jsonStr = jsonStr.substring(0, jsonStr.length - 3);
      }
      jsonStr = jsonStr.trim();

      const aiData = JSON.parse(jsonStr);

      // 3. Format the AI Summary markdown to save in DB
      let formattedSummary = `### 📝 ملخص الاجتماع التنفيذي\n${aiData.summary}\n\n`;
      if (aiData.decisions && aiData.decisions.length > 0) {
        formattedSummary += `### ⚖️ القرارات التي تم اتخاذها\n`;
        aiData.decisions.forEach((dec: string) => {
          formattedSummary += `- ${dec}\n`;
        });
        formattedSummary += `\n`;
      }

      if (aiData.actionItems && aiData.actionItems.length > 0) {
        formattedSummary += `### 📋 التكليفات والمهام المستخرجة\n`;
        aiData.actionItems.forEach((item: any) => {
          const user = attendees.find(u => u.id === item.user_id);
          formattedSummary += `- **${user ? user.name : 'موظف'}**: ${item.task_title} (${item.task_description})\n`;
        });
      }

      // 4. Update the meeting record with the summary
      await pool.query(
        "UPDATE company_meetings SET ai_summary = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        [formattedSummary, id]
      );

      // 5. Automatically insert executive Tasks in the Tasks module
      const actionItems = Array.isArray(aiData.actionItems) ? aiData.actionItems : [];
      const companyId = meeting.company_id || (req as any).user?.company_id || 1;
      for (const item of actionItems) {
        // Verify user is in attendees list
        const attendeeExists = attendees.some(u => u.id === item.user_id);
        if (attendeeExists && item.user_id) {
          // Calculate realistic task due date (e.g., 3 days from now)
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 3);

          await pool.query(
            `INSERT INTO tasks (title, description, status, priority, due_date, assigned_to, module_id, related_id, company_id)
             VALUES ($1, $2, 'pending', 'medium', $3, $4, 'meeting-hub', $5, $6)`,
            [
              `قرار اجتماع: ${item.task_title}`,
              `تكليف مستخرج من اجتماع "${meeting.title}":\n\n${item.task_description}`,
              dueDate,
              item.user_id,
              id,
              companyId
            ]
          );

          // Create notification for the user
          await NotificationService.notify(
            item.user_id,
            `تكليف جديد من اجتماع: ${meeting.title}`,
            `تم إسناد مهمة جديدة لك بناءً على قرارات الاجتماع: ${item.task_title}`,
            'success'
          );
        }
      }

      // 6. Log audit log
      await logAction(authUserId, 'AI_SUMMARY_GEN', 'Meeting', parseInt(id), { title: meeting.title });

      // 7. Broadcast real-time changes
      wss.clients.forEach((client: any) => {
        client.send(JSON.stringify({ type: "MODULE_UPDATED", table: "meetings" }));
        client.send(JSON.stringify({ type: "MODULE_UPDATED", table: "tasks" }));
        client.send(JSON.stringify({ type: "MODULE_UPDATED", table: "notifications" }));
      });

      res.json({
        success: true,
        ai_summary: formattedSummary,
        data: aiData
      });
    } catch (err: any) {
      console.error("Error generating AI Summary:", err);
      res.status(500).json({ error: "Failed to generate AI Summary: " + err.message });
    }
  });

  return router;
}
