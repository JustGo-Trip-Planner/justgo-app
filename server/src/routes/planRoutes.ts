import { Router } from "express";
import {
  generatePlans,
  savePlan,
  getSavedPlans,
  getSavedPlanById,
  updatePlanById,
} from "../controllers/planController";
import { verifyToken } from "../middlewares/auth";

const router = Router();

// public
router.post("/generate", generatePlans);

// protected routes
router.get("/", verifyToken, getSavedPlans);
router.post("/save", verifyToken, savePlan);
router.get("/:id", verifyToken, getSavedPlanById);
router.put("/:id", verifyToken, updatePlanById);

export default router;
