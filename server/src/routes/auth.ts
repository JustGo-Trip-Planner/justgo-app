import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/userModel';

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    
    if (!user) return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'defaultsecret', {
      expiresIn: '7d',
    });

    res.json({
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
    res.status(500).json({ message: 'เกิดข้อผิดพลาด', error: err });
  }
});


router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'อีเมลนี้ถูกใช้ไปแล้ว' });

    const hashed = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      email,
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

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET || 'secret', {
      expiresIn: '7d',
    });

    res.json({
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
    res.status(500).json({ message: 'สมัครไม่สำเร็จ', error: err });
  }
});

// POST /api/auth/check-email
router.post('/check-email', async (req, res) => {
  const { email } = req.body;
  const exists = await User.findOne({ email });

  res.json({
    exists: !!exists,
  });
});

export default router;
