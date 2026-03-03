import { Router } from "express";
import { verifyToken } from "../middlewares/auth";
import { getMyNotifications, markNotificationRead } from "../controllers/notificationController";

const router = Router();

router.get("/", verifyToken, getMyNotifications);
router.put("/:id/read", verifyToken, markNotificationRead);

export default router;