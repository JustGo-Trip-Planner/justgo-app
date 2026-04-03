import { Router } from "express";
import {
  generatePlans,
  savePlan,
  getSavedPlans,
  getSavedPlanById,
  updatePlanById,
  getMyPlans,
  deletePlanById,
  getCurrentPlans,
  getHistoryPlans,
  reusePlan,
  startGeneratePlans,
  getGeneratePlansStatus
} from "../controllers/planController";
import { verifyToken } from "../middlewares/auth";

const router = Router();

// public
router.post("/generate", generatePlans);
router.post("/generate/start", startGeneratePlans);
router.get("/generate/status/:jobId", getGeneratePlansStatus);

// protected routes
router.get("/", verifyToken, getSavedPlans);
router.get("/me", verifyToken, getMyPlans);
router.post("/save", verifyToken, savePlan);
router.get("/current", verifyToken, getCurrentPlans);
router.get("/history", verifyToken, getHistoryPlans);
router.post("/:id/reuse", verifyToken, reusePlan);
router.get("/:id", verifyToken, getSavedPlanById);
router.put("/:id", verifyToken, updatePlanById);
router.delete("/:id", verifyToken, deletePlanById);

export default router;
