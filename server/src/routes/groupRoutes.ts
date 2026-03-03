import { Router } from "express";
import { createGroup, deleteGroup, getGroupById, getMyGroups, leaveGroup, respondInvite } from "../controllers/groupController";
import { verifyToken } from "../middlewares/auth";

const router = Router();

router.post("/", verifyToken, createGroup);
router.get("/me", verifyToken, getMyGroups);
router.post("/:groupId/respond", verifyToken, respondInvite);
router.post("/:id/leave", verifyToken, leaveGroup);
router.get("/:id", verifyToken, getGroupById);
router.delete("/:id", verifyToken, deleteGroup);

export default router;
