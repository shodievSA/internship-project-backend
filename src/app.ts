import 'dotenv/config';
import './config/passport';
import express from 'express';
import passport from 'passport';
import cors from 'cors';
import session from './config/session';
import apiRouter from './routes/index';
import errorHandler from './middlewares/errorHandler';

const app = express();

app.use(express.json());
app.enable('trust proxy');
app.use(cors({
	origin: process.env.FRONTEND_URL,
	credentials: true,
}));
app.use(session);
app.use(passport.initialize());
app.use(passport.session());
app.use('/api', apiRouter);
app.use(errorHandler);

export default app;


