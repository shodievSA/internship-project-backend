import 'dotenv/config';
import express from 'express';
import sessionMiddleware from './middlewares/session-middleware';
import router from './router/app-router';
import testAndInitializeDatabase from './models';

const app = express();

const PORT = process.env.PORT || 3000;
app.use(sessionMiddleware);
app.use('/api/v1', router);

async function startServer() {
  try {
    await testAndInitializeDatabase();
    app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();