import 'dotenv/config';
import './config/passport';
import express from 'express';
import passport from 'passport';
import cors from 'cors';
import session from './config/session';
import v1Router from './routes/api/v1/index';
import errorHandler from './middlewares/errorHandler';
import winston from "winston";

const app = express();

export const logger = winston.createLogger({
	level: "info",
	format: winston.format.combine(
		winston.format.timestamp(),
		winston.format.json()
	),
	transports: [
		new winston.transports.Console(),
		new winston.transports.File({ filename: "errors.log", level: "error" })
	]
});

app.use(express.json());
app.enable('trust proxy');
app.use(cors({
	origin: process.env.FRONTEND_URL,
	credentials: true,
}));
app.use(session);
app.use(passport.initialize());
app.use(passport.session());
app.use('/api/v1', v1Router);
app.use(errorHandler);

export default app;


