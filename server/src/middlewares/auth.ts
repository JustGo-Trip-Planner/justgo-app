import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// ตรวจสอบ JWT token ใน header และเพิ่ม userId ลงใน request object ถ้า token valid
export type AuthRequest = Request & { userId?: string };

export function verifyToken(req: AuthRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing Authorization token" });
  }

  const token = auth.slice(7);
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: "JWT_SECRET is not defined" });
    }

    const decoded = jwt.verify(token, secret) as { id: string };
    if (!decoded?.id) {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}