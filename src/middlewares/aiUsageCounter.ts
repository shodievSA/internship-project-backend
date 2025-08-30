import type { Response, NextFunction } from 'express';
import AuthenticatedRequest from '@/types/authenticatedRequest';
import aiRateLimiter from './aiRateLimiter';
import type AiRateLimiter from '@/types/aiRateLimiter';
import { logger } from '@/config/logger';

const typedAiRateLimiter = aiRateLimiter as unknown as AiRateLimiter;

const incrementAiLimitOnSuccess = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {

    res.on('finish', async (): Promise<void> => {

        if (res.statusCode >= 200 && res.statusCode <= 300) {
            
            try {
                
                typedAiRateLimiter.store.increment(typedAiRateLimiter.keyGenerator(req, res));

            } catch (err: unknown) {

                logger.error({

                    message: 'Failed to increment AI limit',
                    error: err instanceof Error ? err : String(err),
                    stack: err instanceof Error ? err.stack : undefined,
                    url: req.originalUrl,
                    method: req.method,
                    status: res.statusCode

                });
                
            }

        }

    });

    next();

};

export default incrementAiLimitOnSuccess;
