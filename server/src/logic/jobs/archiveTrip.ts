import GroupModel from "../../models/groupModel";
import { archiveTrip } from "../groupTrip";

export async function archiveCompletedTripsJob() {

  const groups = await GroupModel.find({
    finalizedPlanId: { $ne: null }
  }).select("_id");

  for (const g of groups) {
    try {
      await archiveTrip(String(g._id));
    } catch (e) {
      console.error("archiveTrip error:", g._id, e);
    }
  }
}