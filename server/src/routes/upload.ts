import express, { Request, Response } from 'express';
import multer from 'multer';
import cloudinary from '../utils/cloudinary';
import streamifier from 'streamifier';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/avatar', upload.single('avatar'), async (req: Request, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'ไม่มีไฟล์ภาพที่ส่งมา' });

    const streamUpload = (buffer: Buffer): Promise<any> => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'justgo/avatars',
            resource_type: 'image',
          },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          },
        );
        streamifier.createReadStream(buffer).pipe(stream);
      });
    };

    const result = await streamUpload(req.file.buffer);
    return res.json({ url: result.secure_url });
  } catch (err) {
    console.error('❌ Upload failed:', err);
    return res.status(500).json({ message: 'อัปโหลดไม่สำเร็จ' });
  }
});

export default router;
