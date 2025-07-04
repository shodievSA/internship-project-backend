import 'dotenv/config';
import express from 'express';
import passport from 'passport';
import cors from 'cors';

import session from './config/session';
import './config/passport';

import testAndInitializeDatabase from './models';
import router from './router/app-router';
import authRouter from './router/authRoutes';
import './config/passport';
import errorHandler from './middlewares/errorHandler';
import bodyParser from 'body-parser';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.enable('trust proxy');

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(session);
app.use(passport.initialize());
app.use(passport.session());

app.use('/api/v1', router);
app.use('api/v1/auth', authRouter);

app.use(errorHandler);

async function startServer() {
  try {
    await testAndInitializeDatabase();

    app.listen(PORT, () =>
      console.log(`Server is running at http://localhost:${PORT}`)
    );
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
