import { Request, Response } from "express";
import { searchHotelsViaSerpApi } from "../services/hotel";

export async function searchHotels(req: Request, res: Response) {
  try {
    const {
      q = "",
      province = "",
      checkIn,
      checkOut,
      adults = "2",
      currency = "THB",
    } = req.query as Record<string, string>;

    const hotels = await searchHotelsViaSerpApi({
      q,
      province,
      checkIn,
      checkOut,
      adults: Number(adults || 2),
      currency,
    });

    return res.json({
      ok: true,
      total: hotels.length,
      items: hotels,
    });
  } catch (error: any) {
    console.error(
      "searchHotels error:",
      error?.response?.data || error?.message || error
    );

    return res.status(500).json({
      ok: false,
      message: "ค้นหาโรงแรมไม่สำเร็จ",
      error: error?.message || "unknown_error",
      detail: error?.response?.data || null,
    });
  }
}
