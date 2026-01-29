import { Router } from "express";
import {
  generatePlans,
  savePlan,
  getSavedPlans,
  getSavedPlanById,
} from "../controllers/planController";

const router = Router();

router.get("/", getSavedPlans);
router.get("/:id", getSavedPlanById);
router.post("/generate", generatePlans);
router.post("/save", savePlan);

export default router;
