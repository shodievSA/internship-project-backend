import 'dotenv/config';
import express from 'express';
<<<<<<< HEAD
import sequelize from './clients/sequelize';
import passport from 'passport';
=======
import sessionMiddleware from './middlewares/session-middleware';
import router from './router/app-router';
import testAndInitializeDatabase from './models';
>>>>>>> 313b2626cbf541be14459fc37db6d98aa7a51998

const app = express();

const PORT = process.env.PORT || 3000;
<<<<<<< HEAD

app.use(passport.initialize());

async function startServer() {
    try {
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');

        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
=======
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
>>>>>>> 313b2626cbf541be14459fc37db6d98aa7a51998
}

startServer();