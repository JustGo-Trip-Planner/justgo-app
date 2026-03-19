import cloudinary from "cloudinary";
import config from "../config";

cloudinary.v2.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
});

export default cloudinary;

export const getPublicId = (url?: string) => {
  if (!url) return null;

  try {
    const parts = url.split("/upload/")[1];
    if (!parts) return null;

    return parts.split(".")[0]; // justgo/avatar/avatar_123
  } catch {
    return null;
  }
};

export const deleteImage = async (url?: string) => {
  const publicId = getPublicId(url);

  if (!publicId) return;

  try {
    await cloudinary.v2.uploader.destroy(publicId, {
      invalidate: true,
    });

    console.log("✅ Deleted:", publicId);
  } catch (err) {
    console.error("❌ Delete failed:", err);
  }
};