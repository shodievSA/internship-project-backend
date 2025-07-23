//packages installed as devDependencies ! 
//npm i express-rate-limit rate-limit-redis redis - to install them to project

import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import {createClient} from "redis";
import { Request, Response, NextFunction } from "express";
import { AppError } from "@/types";

const DAILY_LIMIT = 10; 

// should be changed for prod
const redisClient = createClient({
    socket: { 
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: parseInt( process.env.REDIS_PORT || "6379"),
    }, 

    //password: process.env.REDIS_PASSWORD,  // For prod redis server
})
    
redisClient.connect().catch((err) => console.log(err));

redisClient.on('error', (err) => {
    console.log('Redis error:', err.message);
    redisClient.close();
    throw new AppError("Ai service is not available at the moment. Please, try again later")
});

const aiRateLimiter = rateLimit({

    windowMs: 24 * 60 * 60 * 1000,
    limit: DAILY_LIMIT,
    keyGenerator: (req: Request, res: Response): string => { 

        const user = (req as Request & { user: { id: number } }).user;
        return user.id.toString();

    }, // how uniquely identify
    store: new RedisStore({

        sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    }),
    handler: (_req: Request, res: Response, _next: NextFunction) => {
        
        res.status(429).json({
            message: "Daily AI request limit reached (10 requests/day). Please try again after 24 hours.",
        });
    }, // called when limit reached
})
    
async function checkRedisAndUseLimiter(
    req: Request,
    res: Response,
    next: NextFunction
) {

    if (!redisClient.isReady) {
        return next(
            new AppError("AI service is not available at the moment. Please, try again later", 503)
        );
    }

    aiRateLimiter(req, res, next);

}


export default checkRedisAndUseLimiter