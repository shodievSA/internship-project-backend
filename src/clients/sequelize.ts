import { Sequelize } from "sequelize";

const { DB_NAME, DB_USERNAME, DB_PASSWORD, DB_HOST } = process.env;

const sequelize = new Sequelize(DB_NAME!, DB_USERNAME!, DB_PASSWORD!, {
    host: DB_HOST!,
    dialect: 'postgres',
		logging: false, // Disable logging; default: console.log
});

<<<<<<< HEAD
export default sequelize;
=======
export default sequelize; 
>>>>>>> 313b2626cbf541be14459fc37db6d98aa7a51998
