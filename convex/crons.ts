import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();
crons.daily("elimina le sessioni scadute", { hourUTC: 3, minuteUTC: 15 }, internal.sessions.purgeExpired);
export default crons;
