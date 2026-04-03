import express from "express";
import {
  login,
  register,
  checkEmail,
  forgotPassword,
  resetPassword,
} from "../controllers/authController";

const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.post("/check-email", checkEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

export default router;