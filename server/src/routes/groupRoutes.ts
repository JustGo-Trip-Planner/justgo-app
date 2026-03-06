import { Router } from "express";
import { createGroup, deleteGroup, getGroupById, getMyGroups, inviteMember, leaveGroup, removeInviteMember, respondInvite } from "../controllers/groupController";
import { verifyToken } from "../middlewares/auth";
import { getSubmittedPlans, removeMyPlan, submitMyPlan } from "../controllers/groupPlanController";

const router = Router();

router.post("/", verifyToken, createGroup);
router.get("/me", verifyToken, getMyGroups);

router.post("/:groupId/invite", verifyToken, inviteMember);
router.delete("/:groupId/invite/:userId", verifyToken, removeInviteMember);
router.post("/:groupId/respond", verifyToken, respondInvite);

router.post("/:id/leave", verifyToken, leaveGroup);
router.get("/:id", verifyToken, getGroupById);
router.delete("/:id", verifyToken, deleteGroup);

// Submitted plans
router.get("/:groupId/submit", verifyToken, getSubmittedPlans);
router.post("/:groupId/submit", verifyToken, submitMyPlan);
router.delete("/:groupId/submit", verifyToken, removeMyPlan);

export default router;
