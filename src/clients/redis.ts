import {createClient} from "redis";

// should be changed for prod
export const redisClient = createClient({
    socket: { 
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: parseInt( process.env.REDIS_PORT || "6379"),
    }, 

    //password: process.env.REDIS_PASSWORD,  // For prod redis server
});