import express from "express";
import * as dashboardController from "./dashboard.controller.js";

export default function dashboardRoutes() {
  const router = express.Router();

  router.get("/summary", dashboardController.getDashboardSummary);
  router.get("/financial", dashboardController.getFinancialDashboard);
  router.get("/human-capital", dashboardController.getHumanCapitalDashboard);
  router.get("/operational-efficiency", dashboardController.getOperationalEfficiencyDashboard);
  router.get("/notifications", dashboardController.getNotifications);

  return router;
}
