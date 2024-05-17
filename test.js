const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const userId = 6;
pool.query('SELECT * FROM twitter_accounts WHERE user_id = $1', [userId])
    .then(result => {
        if (result.rows.length > 0) {
            console.log(result.rows[0].token); // Adjust the column name as needed
        } else {
            console.log('No results found');
        }
    })
    .catch(error => {
        console.error('Error executing query', error);
    });
