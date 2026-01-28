import { Router } from "express";
import {
  generatePlans,
  savePlan,
  getSavedPlans,
  getSavedPlanById,
} from "../controllers/planController";

const router = Router();

// API generate
router.post("/generate", generatePlans);

// API save selected plan
router.post("/save", savePlan);

// API get all saved
router.get("/saved", getSavedPlans);

// API get one saved by id
router.get("/saved/:planId", getSavedPlanById);

export default router;
