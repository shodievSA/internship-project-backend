import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { type Store } from "express-rate-limit"

interface AiRateLimiter extends RequestHandler {

    windowMs: number;
	limit: number;
	skip: () => boolean;
	skipFailedRequests: boolean;
    keyGenerator: (req: Request, res: Response) => string;
	store: Store;
	handler: (req: Request, res: Response, next: NextFunction) => void;

    (req: Request, res: Response, next: NextFunction): void;

}

export default AiRateLimiter;
