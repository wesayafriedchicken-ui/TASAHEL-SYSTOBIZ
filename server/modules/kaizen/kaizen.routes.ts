import express from "express";
import * as kaizenController from "./kaizen.controller.js";

export default function kaizenRoutes(wss: any) {
  const router = express.Router();

  router.get("/suggestions", kaizenController.getSuggestions);
  router.post("/suggestions", (req, res) => kaizenController.createSuggestion(req, res, wss));
  router.put("/suggestions/:id/status", (req, res) => kaizenController.updateStatus(req, res, wss));
  router.put("/suggestions/:id", (req, res) => kaizenController.updateSuggestion(req, res, wss));
  
  router.get("/suggestions/:suggestionId/pdca", kaizenController.getPDCA);
  router.put("/pdca/:id", kaizenController.updatePDCA);
  router.delete("/suggestions/:id", kaizenController.deleteSuggestion);
  
  router.get("/leaderboard", kaizenController.getLeaderboard);

  return router;
}
