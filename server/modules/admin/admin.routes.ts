import express from "express";
import * as adminController from "./admin.controller.js";
import { checkPermission } from "../../middleware/auth.js";

export default function adminRoutes() {
  const router = express.Router();

  // Only Admin can access these
  router.get("/users", checkPermission('Admin', 'view'), adminController.getUsers);
  router.get("/users/:id", checkPermission('Admin', 'view'), adminController.getUserById);
  router.post("/users", checkPermission('Admin', 'create'), adminController.createUser);
  router.patch("/users/:id", checkPermission('Admin', 'edit'), adminController.updateUser);
  router.put("/users/:id", checkPermission('Admin', 'edit'), adminController.updateUser);
  router.delete("/users/:id", checkPermission('Admin', 'delete'), adminController.deleteUser);

  router.get("/roles", checkPermission('Admin', 'view'), adminController.getRoles);
  router.post("/roles", checkPermission('Admin', 'create'), adminController.createRole);
  router.patch("/roles/:id/permissions", checkPermission('Admin', 'edit'), adminController.updateRolePermissions);
  router.delete("/roles/:id", checkPermission('Admin', 'delete'), adminController.deleteRole);

  // Granular Module RBAC endpoints
  router.get("/roles/:roleId/modules/:moduleId", checkPermission('Admin', 'view'), adminController.getRoleModulePermissions);
  router.patch("/roles/:roleId/modules/:moduleId", checkPermission('Admin', 'edit'), adminController.updateRoleModulePermissions);
  router.get("/rbac/roles/:roleId/modules/:moduleId", checkPermission('Admin', 'view'), adminController.getRoleModulePermissions);
  router.patch("/rbac/roles/:roleId/modules/:moduleId", checkPermission('Admin', 'edit'), adminController.updateRoleModulePermissions);

  // Mobile App Permissions endpoints
  router.get("/roles/:id/mobile-permissions", checkPermission('Admin', 'view'), adminController.getRoleMobilePermissions);
  router.patch("/roles/:id/mobile-permissions", checkPermission('Admin', 'edit'), adminController.updateRoleMobilePermissions);
  router.put("/roles/:id/mobile-permissions", checkPermission('Admin', 'edit'), adminController.updateRoleMobilePermissions);

  router.get("/org-chart", checkPermission('Admin', 'view'), adminController.getOrgChart);
  
  // Department Management
  router.get("/departments", checkPermission('Admin', 'view'), adminController.getDepartments);
  router.post("/departments", checkPermission('Admin', 'create'), adminController.createDepartment);
  router.put("/departments/:id", checkPermission('Admin', 'edit'), adminController.updateDepartment);
  router.patch("/departments/:id", checkPermission('Admin', 'edit'), adminController.updateDepartment);
  router.delete("/departments/:id", checkPermission('Admin', 'delete'), adminController.deleteDepartment);

  // Global Status Management
  router.get("/statuses", checkPermission('Admin', 'view'), adminController.getGlobalStatuses);
  router.post("/statuses", checkPermission('Admin', 'create'), adminController.createGlobalStatus);
  router.patch("/statuses/:id", checkPermission('Admin', 'edit'), adminController.updateGlobalStatus);
  router.delete("/statuses/:id", checkPermission('Admin', 'delete'), adminController.deleteGlobalStatus);

  // Admin Data (Bulk)
  router.get("/all", adminController.getAdminData);

  // Module Management
  router.get("/modules", checkPermission('Admin', 'view'), adminController.getSystemModules);
  router.post("/modules", checkPermission('Admin', 'edit'), adminController.createSystemModule);
  router.patch("/modules/:id", checkPermission('Admin', 'edit'), adminController.updateSystemModule);
  router.delete("/modules/:id", checkPermission('Admin', 'edit'), adminController.deleteSystemModule);

  // Activity Feed (Audit Logs)
  router.get("/audit-logs", checkPermission('Admin', 'view'), adminController.getAuditLogs);
  router.post("/audit-logs", adminController.createAuditLog);

  // System Health
  router.get("/system/health", adminController.getSystemHealth);

  // Company Branding & Corporate Domain Settings
  router.get("/company", adminController.getCompanyDetails);
  router.put("/company", checkPermission('Admin', 'edit'), adminController.updateCompanyDetails);
  router.patch("/company", checkPermission('Admin', 'edit'), adminController.updateCompanyDetails);

  // Geofence & Mobile Biometric Attendance Perimeter
  router.get("/geofences", adminController.getGeofences);
  router.post("/geofences", checkPermission('Admin', 'edit'), adminController.createGeofence);
  router.put("/geofences/:id", checkPermission('Admin', 'edit'), adminController.updateGeofence);
  router.delete("/geofences/:id", checkPermission('Admin', 'edit'), adminController.deleteGeofence);
  router.post("/geofences/verify-attendance-perimeter", adminController.verifyAttendancePerimeter);

  return router;
}
