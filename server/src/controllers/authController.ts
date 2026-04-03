import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/userModel";

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "defaultsecret",
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        avatar: user.avatar,
        gender: user.gender,
        birth_date: user.birth_date,
        phone: user.phone,
        interests: user.interests,
        activities: user.activities,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "เกิดข้อผิดพลาด", error: err });
  }
};

export const register = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const exists = await User.findOne({ email: normalizedEmail });

    if (exists) {
      return res.status(400).json({ message: "อีเมลนี้ถูกใช้ไปแล้ว" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      email: normalizedEmail,
      password_hash: hashed,
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      gender: req.body.gender,
      birth_date: req.body.birth_date,
      phone: req.body.phone,
      avatar: req.body.avatar,
      interests: req.body.interests,
      activities: req.body.activities,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const token = jwt.sign(
      { id: newUser._id },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    return res.json({
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        avatar: newUser.avatar,
        gender: newUser.gender,
        birth_date: newUser.birth_date,
        phone: newUser.phone,
        interests: newUser.interests,
        activities: newUser.activities,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "สมัครไม่สำเร็จ", error: err });
  }
};

export const checkEmail = async (req: Request, res: Response) => {
  try {
    const normalizedEmail = String(req.body.email || "").trim().toLowerCase();
    const exists = await User.findOne({ email: normalizedEmail });

    return res.json({ exists: !!exists });
  } catch (err) {
    return res.status(500).json({ message: "ตรวจสอบอีเมลไม่สำเร็จ" });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const normalizedEmail = String(req.body.email || "").trim().toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({ message: "กรุณากรอกอีเมล" });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ message: "ไม่พบบัญชีผู้ใช้นี้" });
    }

    return res.json({
      success: true,
      message: "พบอีเมลในระบบ",
      user: {
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        avatar: user.avatar || "",
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "ดำเนินการไม่สำเร็จ", error: err });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const normalizedEmail = String(req.body.email || "").trim().toLowerCase();
    const newPassword = String(req.body.newPassword || "");
    const confirmPassword = String(req.body.confirmPassword || "");

    if (!normalizedEmail || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบ" });
    }


    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "ยืนยันรหัสผ่านไม่ตรงกัน" });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ message: "ไม่พบบัญชีผู้ใช้นี้" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    user.password_hash = hashed;
    user.updated_at = new Date();
    await user.save();

    return res.json({
      success: true,
      message: "เปลี่ยนรหัสผ่านสำเร็จ",
    });
  } catch (err) {
    return res.status(500).json({ message: "รีเซ็ตรหัสผ่านไม่สำเร็จ", error: err });
  }
};