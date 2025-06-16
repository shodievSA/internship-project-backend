import { Sequelize } from "sequelize";

const { DB_NAME, DB_USERNAME, DB_PASSWORD, DB_HOST } = process.env;

const sequelize = new Sequelize(DB_NAME!, DB_USERNAME!, DB_PASSWORD!, {
    host: DB_HOST!,
    // this is for docker - port: 5432,
    dialect: 'postgres',
		logging: false, // Disable logging; default: console.log
});

export default sequelize;