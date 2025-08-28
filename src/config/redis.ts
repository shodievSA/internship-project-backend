import { createClient } from "redis";
import { logger } from "@/config/logger";

const redisClient = createClient({
    socket: { 
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT || "6379"),
    },
	...(process.env.NODE_ENV === 'production' ? { password: process.env.REDIS_PASSWORD } : {}),
});
		
redisClient.connect().catch((err) => {

	logger.error({
		message: "Error occurred while trying to connect to the redis client",
		error: err
	});

});

redisClient.on("error", (err) => {

	logger.error({
		message: "redis error",
		error: err
	});

	redisClient.close();

});

export default redisClient;
