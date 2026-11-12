import express from "express";
import jwt from "jsonwebtoken";
import { pool } from "../../db/schema.js";

export const MOBILE_DOCK_SCREENS = [
  {
    id: "attendance",
    name: "Attendance",
    arabicName: "الحضور والانصراف",
    route: "/Attendance",
    description: "تسجيل الحضور والانصراف، الورديات، والطلبات الشخصية",
    icon: "Clock",
    order: 1
  },
  {
    id: "tasks",
    name: "Tasks",
    arabicName: "المهام",
    route: "/Tasks",
    description: "قوائم المهام، المتابعة اليومية، وحالات الإنجاز",
    icon: "ClipboardList",
    order: 2
  },
  {
    id: "chat",
    name: "Chat",
    arabicName: "المحادثات",
    route: "/Chat",
    description: "المحادثات المباشرة بين فرق العمل والقنوات الخاصة",
    icon: "MessageSquare",
    order: 3
  },
  {
    id: "notifications",
    name: "Notifications",
    arabicName: "الإشعارات",
    route: "/Alerts",
    description: "تنبيهات النظام اللحظية، الإعلانات، وتحديثات العمليات",
    icon: "Bell",
    order: 4
  },
  {
    id: "delivery",
    name: "Delivery Tracking",
    arabicName: "تتبع التوصيل",
    route: "/Delivery",
    description: "متابعة مسارات المناديب، الطلبيات، والشحنات الحية",
    icon: "Truck",
    order: 5
  }
];

export default function mobileRoutes() {
  const router = express.Router();

  // GET /api/mobile/permissions
  router.get("/permissions", async (req, res) => {
    try {
      const user = (req as any).user;
      let roleId = user?.role_id;

      if (!roleId && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
        try {
          const rawTok = req.headers.authorization.replace("Bearer ", "").trim();
          const dec = jwt.decode(rawTok) as any;
          if (dec?.role_id) roleId = dec.role_id;
          if (!roleId && dec?.role) {
            const rRes = await pool.query("SELECT id FROM roles WHERE LOWER(name) = LOWER($1) LIMIT 1", [dec.role]);
            if (rRes.rows.length > 0) roleId = rRes.rows[0].id;
          }
        } catch (e) {
          // ignore
        }
      }

      if (!roleId && user?.role) {
        const rRes = await pool.query("SELECT id FROM roles WHERE LOWER(name) = LOWER($1) LIMIT 1", [user.role]);
        if (rRes.rows.length > 0) roleId = rRes.rows[0].id;
      }

      if (!roleId && req.query.role_id) {
        roleId = parseInt(req.query.role_id as string, 10);
      }

      if (!roleId && req.query.role) {
        const rRes = await pool.query("SELECT id FROM roles WHERE LOWER(name) = LOWER($1) LIMIT 1", [req.query.role as string]);
        if (rRes.rows.length > 0) roleId = rRes.rows[0].id;
      }

      // Default fallback: Role 1 (Admin) or Role 3 (Employee)
      if (!roleId) roleId = 1;

      const roleRes = await pool.query(
        "SELECT id, name, permissions, mobile_permissions FROM roles WHERE id = $1",
        [roleId]
      );

      const defaults: Record<string, boolean> = {
        "/Attendance": true,
        "/Tasks": true,
        "/Chat": true,
        "/Alerts": true,
        "/Delivery": true
      };

      let mobPerms = defaults;
      let roleName = "Admin";

      if (roleRes.rows.length > 0) {
        const r = roleRes.rows[0];
        roleName = r.name;
        mobPerms = { ...defaults, ...(r.mobile_permissions || {}) };
      }

      const activeScreens = MOBILE_DOCK_SCREENS.filter(s => mobPerms[s.route] !== false);
      const allScreens = MOBILE_DOCK_SCREENS.map(s => ({
        ...s,
        enabled: mobPerms[s.route] !== false
      }));

      const allowedRoutes = Object.keys(mobPerms).filter(k => mobPerms[k] === true);

      res.json({
        success: true,
        role_id: roleId,
        role_name: roleName,
        allowed_routes: allowedRoutes,
        active_dock_screens: activeScreens,
        dock_screens: allScreens,
        mobile_permissions: mobPerms
      });
    } catch (err: any) {
      console.error("Error fetching mobile permissions:", err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  return router;
}
