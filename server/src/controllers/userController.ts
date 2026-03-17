import { Request, Response } from "express";
import mongoose from "mongoose";
import UserModel from "../models/userModel";
import { getPublicId } from "../utils/cloudinary";
import cloudinary from "../utils/cloudinary";

export const searchUsers = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== "string") {
      return res.json([]);
    }

    const users = await UserModel.find({
      first_name: { $regex: q, $options: "i" },
    })
      .select("_id first_name avatar")
      .limit(10);

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Search failed" });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  try {
    const existingUser = await UserModel.findById(id);

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const newAvatar = req.body.avatar;

    if (
      newAvatar &&
      existingUser.avatar &&
      existingUser.avatar !== newAvatar
    ) {
      const publicId = getPublicId(existingUser.avatar);

      if (publicId) {
        await cloudinary.v2.uploader.destroy(publicId, {
          invalidate: true,
        });
      }
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      {
        ...req.body,
        updated_at: new Date(),
      },
      { new: true }
    );

    res.json({ user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Update failed" });
  }
};