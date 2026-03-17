import express from "express";
import cloudinary from "../utils/cloudinary";
import config from "../config";

const router = express.Router();

router.get("/signature", (req, res) => {
  try {
    const userId = req.query.userId;

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const timestamp = Math.round(Date.now() / 1000);

    const public_id = `avatar_${userId}`;

    const params = {
      timestamp,
      folder: "justgo/avatar",
      public_id,
      overwrite: "true",
    };

    const signature = cloudinary.v2.utils.api_sign_request(
      params,
      config.CLOUDINARY_API_SECRET
    );

    res.json({
      timestamp,
      signature,
      apiKey: config.CLOUDINARY_API_KEY,
      cloudName: config.CLOUDINARY_CLOUD_NAME,
      public_id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Signature failed" });
  }
});

export default router;