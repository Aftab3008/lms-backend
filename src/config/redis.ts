import { Queue } from "bullmq";

const redisURL = process.env.REDIS_URL;
const redisPassword = process.env.REDIS_PASSWORD;
const isProduction = process.env.NODE_ENV === "production";

if (!redisURL) {
  throw new Error("REDIS_URL is not defined");
}

if (!redisPassword && process.env.NODE_ENV === "production") {
  throw new Error("REDIS_PASSWORD is required in production");
}

const queue = new Queue("service", {
  connection: {
    url: redisURL,
    password: isProduction ? redisPassword : undefined,
  },
});

export { queue as redisQueue };
