import { Request, Response } from "express";
import { pool } from "../../db/schema.js";

export const getRooms = async (req: Request, res: Response) => {
  const { user_id } = req.query;
  const companyId = (req as any).user?.company_id || 1;
  const currentUserId = user_id && user_id !== 'undefined' ? Number(user_id) : ((req as any).user?.id || 1);

  try {
    // Get channels and DMs with recipient metadata
    const result = await pool.query(`
      SELECT cr.*, 
             (SELECT content FROM chat_messages WHERE room_id = cr.id ORDER BY created_at DESC LIMIT 1) as last_message,
             (SELECT created_at FROM chat_messages WHERE room_id = cr.id ORDER BY created_at DESC LIMIT 1) as last_message_at,
             (SELECT COUNT(*) FROM chat_messages WHERE room_id = cr.id) as total_messages,
             (SELECT COUNT(*) FROM chat_room_members WHERE room_id = cr.id) as member_count,
             CASE WHEN cr.type = 'dm' THEN (
               SELECT u.id FROM chat_room_members crm2 
               JOIN users u ON crm2.user_id = u.id 
               WHERE crm2.room_id = cr.id AND crm2.user_id != $1 LIMIT 1
             ) END as recipient_id,
             CASE WHEN cr.type = 'dm' THEN (
               SELECT u.name FROM chat_room_members crm2 
               JOIN users u ON crm2.user_id = u.id 
               WHERE crm2.room_id = cr.id AND crm2.user_id != $1 LIMIT 1
             ) END as recipient_name,
             CASE WHEN cr.type = 'dm' THEN (
               SELECT u.email FROM chat_room_members crm2 
               JOIN users u ON crm2.user_id = u.id 
               WHERE crm2.room_id = cr.id AND crm2.user_id != $1 LIMIT 1
             ) END as recipient_email,
             CASE WHEN cr.type = 'dm' THEN (
               SELECT up.status FROM chat_room_members crm2 
               JOIN user_presence up ON crm2.user_id = up.user_id 
               WHERE crm2.room_id = cr.id AND crm2.user_id != $1 LIMIT 1
             ) END as recipient_presence
      FROM chat_rooms cr
      LEFT JOIN chat_room_members crm ON cr.id = crm.room_id
      WHERE (cr.company_id = $2 OR cr.company_id IS NULL) AND (
         (cr.type = 'channel' AND (cr.is_private IS NOT TRUE OR crm.user_id = $1))
         OR (cr.type = 'dm' AND crm.user_id = $1)
         OR (cr.type = 'contextual' AND crm.user_id = $1)
      )
      GROUP BY cr.id
      ORDER BY last_message_at DESC NULLS LAST, cr.created_at ASC
    `, [currentUserId, companyId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const getOrCreateDmRoom = async (req: Request, res: Response) => {
  const currentUserId = (req as any).user?.id || req.body.userId || req.body.currentUserId || 1;
  const { recipientId } = req.body;
  const companyId = (req as any).user?.company_id || 1;

  if (!recipientId) {
    return res.status(400).json({ error: "recipientId required" });
  }

  const recId = Number(recipientId);
  const curId = Number(currentUserId);

  try {
    // Check if DM room already exists between these 2 users
    const existing = await pool.query(`
      SELECT cr.* 
      FROM chat_rooms cr
      JOIN chat_room_members crm1 ON cr.id = crm1.room_id AND crm1.user_id = $1
      JOIN chat_room_members crm2 ON cr.id = crm2.room_id AND crm2.user_id = $2
      WHERE cr.type = 'dm' AND (cr.company_id = $3 OR cr.company_id IS NULL)
      LIMIT 1
    `, [curId, recId, companyId]);

    if (existing.rows.length > 0) {
      return res.json(existing.rows[0]);
    }

    // Otherwise create new DM room
    const recipientRes = await pool.query("SELECT name FROM users WHERE id = $1", [recId]);
    const recipientName = recipientRes.rows[0]?.name || `User #${recId}`;

    const newRoomRes = await pool.query(
      "INSERT INTO chat_rooms (name, type, company_id) VALUES ($1, 'dm', $2) RETURNING *",
      [`dm-${curId}-${recId}`, companyId]
    );
    const newRoom = newRoomRes.rows[0];

    await pool.query(
      "INSERT INTO chat_room_members (room_id, user_id) VALUES ($1, $2), ($1, $3) ON CONFLICT DO NOTHING",
      [newRoom.id, curId, recId]
    );

    res.status(201).json({
      ...newRoom,
      recipient_id: recId,
      recipient_name: recipientName
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  const { roomId } = req.params;
  const { limit = 30, offset = 0, before_id, parent_id, include_threads } = req.query;
  const companyId = (req as any).user?.company_id || 1;

  try {
    let whereClause = "cm.room_id = $1 AND (cr.company_id = $2 OR cr.company_id IS NULL)";
    const params: any[] = [roomId, companyId];

    if (before_id) {
      params.push(Number(before_id));
      whereClause += ` AND cm.id < $${params.length}`;
    }

    if (parent_id) {
      params.push(Number(parent_id));
      whereClause += ` AND cm.parent_id = $${params.length}`;
    } else if (include_threads !== 'true') {
      whereClause += ` AND cm.parent_id IS NULL`;
    }

    params.push(Number(limit) || 30);
    params.push(Number(offset) || 0);

    const query = `
      SELECT cm.*, 
             u.name as sender_name, 
             u.email as sender_email,
             (SELECT COUNT(*) FROM chat_messages WHERE parent_id = cm.id) as reply_count,
             (SELECT MAX(created_at) FROM chat_messages WHERE parent_id = cm.id) as last_reply_at,
             (SELECT json_agg(reac) FROM (
                SELECT emoji, COUNT(*) as count, ARRAY_AGG(user_id) as user_ids
                FROM chat_message_reactions
                WHERE message_id = cm.id
                GROUP BY emoji
             ) reac) as reactions
      FROM chat_messages cm
      JOIN chat_rooms cr ON cm.room_id = cr.id
      LEFT JOIN users u ON cm.sender_id = u.id
      WHERE ${whereClause}
      ORDER BY cm.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const result = await pool.query(query, params);
    
    // Reverse to get chronological order for UI display
    res.json(result.rows.reverse());
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  const { roomId } = req.params;
  const senderId = (req as any).user?.id || req.body.sender_id || 1;
  const {
    content,
    mentions,
    is_announcement,
    attachment_url,
    attachment_name,
    attachment_type,
    parent_id,
    audio_duration
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO chat_messages 
       (room_id, sender_id, content, mentions, is_announcement, attachment_url, attachment_name, attachment_type, parent_id, audio_duration) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING *`,
      [
        roomId,
        senderId,
        content || '',
        JSON.stringify(mentions || []),
        is_announcement || false,
        attachment_url || null,
        attachment_name || null,
        attachment_type || null,
        parent_id || null,
        audio_duration || null
      ]
    );

    const savedMsg = result.rows[0];

    // Get sender info
    const sender = await pool.query("SELECT name, email, avatar_url FROM users WHERE id = $1", [senderId]);
    const senderInfo = sender.rows[0] || { name: 'Current User', email: '' };

    const responseMsg = {
      ...savedMsg,
      sender_name: senderInfo.name,
      sender_email: senderInfo.email,
      sender_avatar: senderInfo.avatar_url,
      reply_count: 0,
      reactions: []
    };

    // If mentions exist, trigger notifications
    if (mentions && Array.isArray(mentions)) {
      for (const mId of mentions) {
        if (Number(mId) !== Number(senderId)) {
          try {
            await pool.query(
              "INSERT INTO notifications (user_id, title, message, company_id) VALUES ($1, $2, $3, $4)",
              [mId, "You were mentioned in a chat", `${senderInfo.name} mentioned you: "${(content || '').slice(0, 80)}"`, (req as any).user?.company_id || 1]
            );
          } catch (e) {}
        }
      }
    }

    res.status(201).json(responseMsg);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const getThreadReplies = async (req: Request, res: Response) => {
  const { messageId } = req.params;
  try {
    // Get parent message
    const parentRes = await pool.query(`
      SELECT cm.*, u.name as sender_name, u.email as sender_email,
             (SELECT COUNT(*) FROM chat_messages WHERE parent_id = cm.id) as reply_count,
             (SELECT json_agg(reac) FROM (
                SELECT emoji, COUNT(*) as count, ARRAY_AGG(user_id) as user_ids
                FROM chat_message_reactions
                WHERE message_id = cm.id
                GROUP BY emoji
             ) reac) as reactions
      FROM chat_messages cm
      LEFT JOIN users u ON cm.sender_id = u.id
      WHERE cm.id = $1
    `, [messageId]);

    if (parentRes.rows.length === 0) {
      return res.status(404).json({ error: "Message not found" });
    }

    // Get replies
    const repliesRes = await pool.query(`
      SELECT cm.*, u.name as sender_name, u.email as sender_email,
             (SELECT json_agg(reac) FROM (
                SELECT emoji, COUNT(*) as count, ARRAY_AGG(user_id) as user_ids
                FROM chat_message_reactions
                WHERE message_id = cm.id
                GROUP BY emoji
             ) reac) as reactions
      FROM chat_messages cm
      LEFT JOIN users u ON cm.sender_id = u.id
      WHERE cm.parent_id = $1
      ORDER BY cm.created_at ASC
    `, [messageId]);

    res.json({
      parent: parentRes.rows[0],
      replies: repliesRes.rows
    });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const toggleReaction = async (req: Request, res: Response) => {
  const { messageId } = req.params;
  const { emoji } = req.body;
  const userId = (req as any).user?.id || req.body.userId || 1;

  if (!emoji || !messageId) {
    return res.status(400).json({ error: "emoji and messageId required" });
  }

  try {
    // Check if reaction already exists
    const existing = await pool.query(
      "SELECT id FROM chat_message_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3",
      [messageId, userId, emoji]
    );

    if (existing.rows.length > 0) {
      // Remove reaction
      await pool.query(
        "DELETE FROM chat_message_reactions WHERE id = $1",
        [existing.rows[0].id]
      );
    } else {
      // Insert reaction
      await pool.query(
        "INSERT INTO chat_message_reactions (message_id, user_id, emoji) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
        [messageId, userId, emoji]
      );
    }

    // Fetch updated reactions
    const updated = await pool.query(`
      SELECT emoji, COUNT(*) as count, ARRAY_AGG(user_id) as user_ids
      FROM chat_message_reactions
      WHERE message_id = $1
      GROUP BY emoji
    `, [messageId]);

    res.json({ messageId: Number(messageId), reactions: updated.rows });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};


export const createRoom = async (req: Request, res: Response) => {
  const { name, type = 'channel', department_id, context_type, context_id, member_ids, is_private, description } = req.body;
  const companyId = (req as any).user?.company_id || 1;
  const currentUserId = (req as any).user?.id || req.body.userId || 1;
  try {
    const result = await pool.query(
      `INSERT INTO chat_rooms (name, type, department_id, context_type, context_id, company_id, is_private, description) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, type, department_id || null, context_type || null, context_id || null, companyId, !!is_private, description || null]
    );
    const room = result.rows[0];

    const allMembers = new Set<number>(member_ids && Array.isArray(member_ids) ? member_ids : []);
    allMembers.add(currentUserId);

    for (const userId of allMembers) {
      await pool.query(
        "INSERT INTO chat_room_members (room_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [room.id, userId]
      );
    }

    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const updateRoom = async (req: Request, res: Response) => {
  const { roomId } = req.params;
  const { name, description, is_private, department_id } = req.body;
  try {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(name.trim());
    }
    if (description !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push(description);
    }
    if (is_private !== undefined) {
      fields.push(`is_private = $${idx++}`);
      values.push(!!is_private);
    }
    if (department_id !== undefined) {
      fields.push(`department_id = $${idx++}`);
      values.push(department_id ? Number(department_id) : null);
    }

    if (fields.length === 0) {
      const cur = await pool.query("SELECT * FROM chat_rooms WHERE id = $1", [roomId]);
      if (cur.rows.length === 0) return res.status(404).json({ error: "Room not found" });
      return res.json(cur.rows[0]);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(Number(roomId));

    const result = await pool.query(
      `UPDATE chat_rooms SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Room not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const getRoomMembers = async (req: Request, res: Response) => {
  const { roomId } = req.params;
  try {
    const result = await pool.query(`
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        COALESCE(r.name, 'Member') as role, 
        u.avatar_url,
        u.job_title,
        COALESCE(up.status, 'offline') as presence_status,
        up.custom_status,
        d.name as department_name,
        crm.room_id
      FROM chat_room_members crm
      JOIN users u ON crm.user_id = u.id
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN user_presence up ON u.id = up.user_id
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE crm.room_id = $1
      ORDER BY u.name ASC
    `, [roomId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const addRoomMember = async (req: Request, res: Response) => {
  const { roomId } = req.params;
  const { userId, userIds } = req.body;
  try {
    const idsToAdd: number[] = userIds && Array.isArray(userIds) 
      ? userIds.map(Number).filter((n: number) => !isNaN(n) && n > 0) 
      : (userId && !isNaN(Number(userId)) ? [Number(userId)] : []);

    if (idsToAdd.length === 0) {
      return res.status(400).json({ error: "userId or userIds required" });
    }

    const roomRes = await pool.query("SELECT id, name FROM chat_rooms WHERE id = $1", [roomId]);
    if (roomRes.rows.length === 0) {
      return res.status(404).json({ error: "Room not found" });
    }

    let addedCount = 0;
    for (const uid of idsToAdd) {
      const userRes = await pool.query("SELECT id, name FROM users WHERE id = $1", [uid]);
      if (userRes.rows.length === 0) continue;
      const addedName = userRes.rows[0]?.name || 'Member';

      await pool.query(
        "INSERT INTO chat_room_members (room_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [roomId, uid]
      );
      addedCount++;

      try {
        await pool.query(
          "INSERT INTO chat_messages (room_id, content, is_system_message) VALUES ($1, $2, TRUE)",
          [roomId, `${addedName} was added to the channel.`]
        );
      } catch (e) {}
    }

    res.json({ success: true, addedCount });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const removeRoomMember = async (req: Request, res: Response) => {
  const { roomId, userId } = req.params;
  try {
    const roomRes = await pool.query("SELECT id FROM chat_rooms WHERE id = $1", [roomId]);
    if (roomRes.rows.length === 0) {
      return res.status(404).json({ error: "Room not found" });
    }

    const userRes = await pool.query("SELECT name FROM users WHERE id = $1", [userId]);
    const removedName = userRes.rows[0]?.name || 'Member';

    await pool.query(
      "DELETE FROM chat_room_members WHERE room_id = $1 AND user_id = $2",
      [roomId, userId]
    );

    try {
      await pool.query(
        "INSERT INTO chat_messages (room_id, content, is_system_message) VALUES ($1, $2, TRUE)",
        [roomId, `${removedName} was removed from the channel.`]
      );
    } catch (e) {}

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const deleteMessage = async (req: Request, res: Response) => {
  const { messageId } = req.params;
  try {
    await pool.query("DELETE FROM chat_messages WHERE id = $1", [messageId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const deleteRoom = async (req: Request, res: Response) => {
  const { roomId } = req.params;
  try {
    await pool.query("DELETE FROM chat_messages WHERE room_id = $1", [roomId]);
    await pool.query("DELETE FROM chat_room_members WHERE room_id = $1", [roomId]);
    const result = await pool.query("DELETE FROM chat_rooms WHERE id = $1 RETURNING id", [roomId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Room not found" });
    }
    res.json({ success: true, deletedId: Number(roomId) });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const getNotifications = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const companyId = (req as any).user?.company_id || 1;
  try {
    const result = await pool.query(
      "SELECT id, user_id, title, message, type, link, is_read, created_at FROM notifications WHERE (user_id = $1 OR user_id IS NULL) AND (company_id = $2 OR company_id IS NULL) ORDER BY created_at DESC LIMIT 50",
      [userId, companyId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const markNotificationRead = async (req: Request, res: Response) => {
  const { id } = req.params;
  const companyId = (req as any).user?.company_id || 1;
  try {
    await pool.query("UPDATE notifications SET is_read = TRUE WHERE id = $1 AND (company_id = $2 OR company_id IS NULL)", [id, companyId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const getActivityFeed = async (req: Request, res: Response) => {
  const companyId = (req as any).user?.company_id || 1;
  try {
    const result = await pool.query(`
      SELECT al.id, al.user_id, al.action, al.entity_type, al.entity_id, al.created_at, u.name as user_name, u.email as user_email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE (al.company_id = $1 OR al.company_id IS NULL)
      ORDER BY al.created_at DESC
      LIMIT 30
    `, [companyId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const getNotificationPreferences = async (req: Request, res: Response) => {
  const { userId } = req.params;
  
  const defaultPrefs = {
    user_id: userId,
    email_enabled: true,
    push_enabled: true,
    whatsapp_enabled: false,
    sop_updates: true,
    crm_updates: true,
    qa_alerts: true,
    chat_messages: true
  };

  if (!userId || userId === 'undefined' || userId === '0') {
    return res.json(defaultPrefs);
  }

  try {
    const result = await pool.query("SELECT * FROM user_notification_preferences WHERE user_id = $1", [userId]);
    if (result.rows.length === 0) {
      try {
        // Create default preferences
        const insert = await pool.query(
          "INSERT INTO user_notification_preferences (user_id) VALUES ($1) RETURNING *",
          [userId]
        );
        return res.json(insert.rows[0]);
      } catch (insertErr) {
        // If insert fails (e.g. foreign key constraint for hardcoded admin), return defaults
        console.warn(`Could not create notification preferences for user ${userId}, returning defaults.`);
        return res.json(defaultPrefs);
      }
    }
    res.json(result.rows[0]);
  } catch (err) {
    // If database query fails entirely, fallback to defaults
    console.error("Database error in getNotificationPreferences:", err);
    res.json(defaultPrefs);
  }
};

export const updateNotificationPreferences = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const fields = Object.keys(req.body);
  const values = Object.values(req.body);
  const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(", ");
  
  try {
    const result = await pool.query(
      `UPDATE user_notification_preferences SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 RETURNING *`,
      [userId, ...values]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const getUserPresence = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT up.*, u.name, u.email 
      FROM user_presence up
      JOIN users u ON up.user_id = u.id
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const updatePresence = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { status, custom_status } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO user_presence (user_id, status, custom_status, last_seen) 
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP) 
       ON CONFLICT (user_id) DO UPDATE 
       SET status = $2, custom_status = $3, last_seen = CURRENT_TIMESTAMP 
       RETURNING *`,
      [userId, status, custom_status]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};

export const searchMessages = async (req: Request, res: Response) => {
  const { q } = req.query;
  const companyId = (req as any).user?.company_id || 1;
  try {
    const result = await pool.query(`
      SELECT cm.*, u.name as sender_name, cr.name as room_name, cr.type as room_type,
             cr.context_type, cr.context_id
      FROM chat_messages cm
      JOIN users u ON cm.sender_id = u.id
      JOIN chat_rooms cr ON cm.room_id = cr.id
      WHERE cm.content ILIKE $1 AND cr.company_id = $2
      ORDER BY cm.created_at DESC
      LIMIT 100
    `, [`%${q}%`, companyId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
};
