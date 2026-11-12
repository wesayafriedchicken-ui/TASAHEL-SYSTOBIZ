import express from "express";
import * as riskController from "./risk.controller.js";

export default function riskRoutes(wss: any) {
  const router = express.Router();

  router.get("/", riskController.getRisks);
  router.post("/", (req, res) => riskController.createRisk(req, res, wss));
  router.put("/:id", riskController.updateRisk);
  router.delete("/:id", riskController.deleteRisk);

  return router;
}
