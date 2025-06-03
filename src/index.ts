import 'dotenv/config';
import express from 'express';
import sequelize from './clients/sequelize';

const app = express();

async function testConnection() {

    try {
    
        await sequelize.authenticate();
        console.log('Connection has been established successfully.');
    
    } catch (error) {
    
        console.error('Unable to connect to the database:', error);
    
    }

}

testConnection();

app.listen(3000, () => {

    console.log('Server is running on port 3000');

});