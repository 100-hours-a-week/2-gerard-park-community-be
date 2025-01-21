import mariadb from 'mariadb';
import dotenv from 'dotenv';

dotenv.config();

export const conn = mariadb.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_SCHEMA,
    bigIntAsNumber: true,
    connectionLimit: 10
});
