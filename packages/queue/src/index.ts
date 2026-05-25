import { Queue, Worker, type Processor } from "bullmq";
import IORedis from "ioredis";

export const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

// Queue names – single source of truth
export const QUEUES = {
  COLLECT: "collect",
  ENRICH:  "enrich",
  NOTIFY:  "notify",
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];

export function createQueue(name: QueueName) {
  return new Queue(name, { connection });
}

export function createWorker<T>(name: QueueName, processor: Processor<T>) {
  return new Worker<T>(name, processor, { connection });
}

export { Queue, Worker };
