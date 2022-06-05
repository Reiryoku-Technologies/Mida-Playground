import Redis, { ChainableCommander, } from "ioredis";
import { MidaTick, } from "@reiryoku/mida";

export const redis: Redis = new Redis({
    host: process.env.REDIS_HOST ?? "127.0.0.1",
    port: Number(process.env.REDIS_PORT ?? 6379),
});

export const loadTicks = async (ticks: MidaTick[]): Promise<void> => {
    const chain: ChainableCommander = redis.multi();

    for (const tick of ticks) {
        chain.zadd("ticks", tick.date.timestamp, JSON.stringify(tick));
    }

    await chain.exec();
};

export const getTicks = async (fromTimestamp: number, toTimestamp: number): Promise<MidaTick[]> => [];
