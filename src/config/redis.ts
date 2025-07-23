import { Redis } from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redisURL = process.env.REDIS_URL;

if (!redisURL) {
  throw new Error("REDIS_URL is not defined");
}

const redis = new Redis(redisURL);

export { redis };
