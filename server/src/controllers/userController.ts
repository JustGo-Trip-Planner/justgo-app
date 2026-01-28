import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/userModel';

export const updateUser = async (req: Request, res: Response) => {
  const rawId = req.params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid user id' });
  }

  try {
    const user = await User.findByIdAndUpdate(
      id,
      {
        ...req.body,
        updated_at: new Date(),
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Profile updated', user });
  } catch (error) {
    console.error('Update user failed:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
