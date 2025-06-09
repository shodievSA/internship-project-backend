import 'dotenv/config';
import express from 'express';
import passport from 'passport';
import cors from 'cors';

import session from './config/session';
import './config/passport';

import testAndInitializeDatabase from './models';
import router from './router/app-router';
import authRouter from './auth/authRoutes/authRoutes';


const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

app.use(session);
app.use(passport.initialize());
app.use(passport.session());

app.use('/auth', authRouter);
app.use('/api/v1', router);

async function startServer() {
  try {
    await testAndInitializeDatabase();

    app.listen(PORT, () => console.log(`Server is running at http://localhost:${PORT}`));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();