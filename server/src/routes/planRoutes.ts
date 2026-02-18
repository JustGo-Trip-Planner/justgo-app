import { Router } from "express";
import {
  generatePlans,
  savePlan,
  getSavedPlans,
  getSavedPlanById,
  updatePlanById,
} from "../controllers/planController";

const router = Router();

router.get("/", getSavedPlans);
router.post("/generate", generatePlans);
router.post("/save", savePlan);
router.get("/:id", getSavedPlanById);
router.put("/:id", updatePlanById);

export default router;
