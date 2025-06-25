import 'dotenv/config';
import './config/passport';
import express from 'express';
import passport from 'passport';
import cors from 'cors';
import session from './config/session';
import initDB from './models';
import v1Router from './routes/api/v1/index';
import errorHandler from './middlewares/errorHandler';
import { startCronJobs } from './services/cronService';

const app = express();
const PORT = process.env.PORT || 3000;

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

async function main() {

	try {

		await initDB();
		startCronJobs();
		app.listen(PORT, () => console.log(`Server is running at http://localhost:${PORT}`));

	} catch (error) {

		console.error('Failed to start server:', error);

	}

}

main();
