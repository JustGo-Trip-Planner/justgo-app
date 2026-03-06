import { Router } from "express";
import { verifyToken } from "../middlewares/auth";
import { finalizeWinnerPlan, getVotingResult, getVotingState, submitMyPlanToGroup, votePlan } from "../controllers/voteController";

const router = Router();

router.post("/:groupId/submit-plan", verifyToken, submitMyPlanToGroup);
router.get("/:groupId/voting-state", verifyToken, getVotingState);
router.post("/:groupId/vote", verifyToken, votePlan);
router.get("/:groupId/voting-result", verifyToken, getVotingResult);
router.post("/:groupId/finalize", verifyToken, finalizeWinnerPlan);

export default router;