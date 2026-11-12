import express from "express";
import * as chatController from "./chat.controller.js";

export default function chatRoutes() {
  const router = express.Router();

  router.get("/rooms", chatController.getRooms);
  router.post("/rooms", chatController.createRoom);
  router.post("/dm-room", chatController.getOrCreateDmRoom);
  router.get("/rooms/:roomId/messages", chatController.getMessages);
  router.post("/rooms/:roomId/messages", chatController.sendMessage);
  router.get("/messages/:messageId/replies", chatController.getThreadReplies);
  router.post("/messages/:messageId/reactions", chatController.toggleReaction);
  router.delete("/messages/:messageId", chatController.deleteMessage);
  router.put("/rooms/:roomId", chatController.updateRoom);
  router.patch("/rooms/:roomId", chatController.updateRoom);
  router.delete("/rooms/:roomId", chatController.deleteRoom);
  router.get("/rooms/:roomId/members", chatController.getRoomMembers);
  router.post("/rooms/:roomId/members", chatController.addRoomMember);
  router.delete("/rooms/:roomId/members/:userId", chatController.removeRoomMember);
  
  router.get("/notifications/:userId", chatController.getNotifications);
  router.patch("/notifications/:id/read", chatController.markNotificationRead);
  router.get("/activity", chatController.getActivityFeed);
  
  router.get("/notifications/preferences/:userId", chatController.getNotificationPreferences);
  router.put("/notifications/preferences/:userId", chatController.updateNotificationPreferences);
  
  router.get("/presence", chatController.getUserPresence);
  router.put("/presence/:userId", chatController.updatePresence);
  
  router.get("/search", chatController.searchMessages);

  return router;
}

