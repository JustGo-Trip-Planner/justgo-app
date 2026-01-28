import { Request, Response } from 'express';
import Province from '../models/provinceModel';

export const getAllProvinces = async (req: Request, res: Response) => {
  try {
    const provinces = await Province.find();
    res.status(200).json(provinces);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch provinces' });
  }
};

export const getProvinceById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const province = await Province.findById(id);

    if (!province) {
      return res.status(404).json({ error: 'Province not found' });
    }
    res.status(200).json(province);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching province' });
  }
};

export const searchProvinces = async (req: Request, res: Response) => {
  try {
    const keyword = String(req.query.keyword || "");
    const regex = new RegExp(keyword, "i");

    const provinces = await Province.find({
      name_th: { $regex: regex }
    }).select("_id name_th cover_image").limit(10);

    res.json(provinces);
  } catch (err: any) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};
