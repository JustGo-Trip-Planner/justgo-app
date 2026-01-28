import mongoose from "mongoose";

const provinceSchema = new mongoose.Schema({
  name_th: { type: String, required: true },
  name_en: String,
  region: String,
  description: String,
  cover_image: String,
  gallery: [String],
  highlights: [
    {
      title: String,
      description: String,
    },
  ],
});

export default mongoose.model("Province", provinceSchema);
