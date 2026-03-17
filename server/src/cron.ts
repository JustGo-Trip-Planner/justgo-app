import cron from "node-cron";
import { archiveCompletedTripsJob } from "./logic/jobs/archiveTrip";

export function startCronJobs() {

  console.log("Cron jobs started");

  cron.schedule("*/10 * * * *", async () => {

    console.log("Running trip archive job...");

    await archiveCompletedTripsJob();

  });

}