const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const createUser = async (username, password, email, phoneNumber) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
        'INSERT INTO Users (Username, PasswordHash, Email, phone_number) VALUES ($1, $2, $3, $4) RETURNING *',
        [username, hashedPassword, email, phoneNumber]
    );
    return result.rows[0];
};

const findUserById = async (id) => {
    const result = await pool.query('SELECT * FROM Users WHERE userid = $1', [id]);
    return result.rows[0];
};

const findUserByUsername = async (username) => {
    const result = await pool.query('SELECT * FROM Users WHERE Username = $1', [username]);
    return result.rows[0];
};

const findUserByEmail = async (email) => {
    const result = await pool.query('SELECT * FROM Users WHERE Email = $1', [email]);
    return result.rows[0];
};

module.exports = {
    createUser,
    findUserByUsername,
    findUserByEmail,
    findUserById
};
