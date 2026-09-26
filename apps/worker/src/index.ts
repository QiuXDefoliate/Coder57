import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), process.cwd().endsWith("worker") ? "../../.env" : ".env") });

const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", { maxRetriesPerRequest: null });
export const automationQueue = new Queue("bank-automations", { connection });

const worker = new Worker("bank-automations", async job => {
  const now = new Date().toISOString();
  switch (job.name) {
    case "scheduled-transfer":
      return { status: "AWAITING_FINAL_VALIDATION", operationId: job.data.operationId, checkedAt: now };
    case "renewal-reminder":
      return { status: "REMINDER_READY", subscriptionId: job.data.subscriptionId, checkedAt: now };
    case "birthday-plan":
      return { status: "SHOPPING_CONFIRMATION_REQUIRED", planId: job.data.planId, checkedAt: now };
    case "statement-report":
      return { status: "REPORT_REQUESTED", period: job.data.period, checkedAt: now };
    default:
      throw new Error(`Unknown job type: ${job.name}`);
  }
}, { connection, concurrency: 5 });

worker.on("completed", job => console.log(`[worker] ${job.name} completed`, job.returnvalue));
worker.on("failed", (job, error) => console.error(`[worker] ${job?.name} failed`, error.message));

async function shutdown() {
  await worker.close();
  await automationQueue.close();
  await connection.quit();
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
