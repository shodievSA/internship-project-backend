import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import redisClient from "@/clients/redis";
import { Request, Response, NextFunction } from "express";
import { AppError } from "@/types";
import AuthenticatedRequest from "@/types/authenticatedRequest";

const DAILY_LIMIT = 10; 

const aiRateLimiter = rateLimit(
	{
		windowMs: 24 * 60 * 60 * 1000,
		limit: DAILY_LIMIT,
		keyGenerator: (req: Request, _res: Response): string => { 
			const userId = (req as AuthenticatedRequest).user.id;
			return userId.toString();
		},
		store: new RedisStore({ sendCommand: (...args: string[]) => redisClient.sendCommand(args) }),
		handler: (_req: Request, _res: Response, next: NextFunction) => {
			const error = new AppError(
				"Looks like you have reached your daily AI limit (10 calls per day). Please, try again later.", 429, true
			);
			return next(error);
		}
	}
);

export default aiRateLimiter;