import {createClient} from "redis";

export const redisClient = createClient({
    socket: { 
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || "6379"),
    }, 

    ...(process.env.NODE_ENV === 'production' ? { password: process.env.REDIS_PASSWORD } : {})
});