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

const findUserByLinkedinId = async (linkedin_id) => {
    const result = await pool.query('SELECT * FROM linkedin_accounts WHERE linkedin_id = $1', [linkedin_id]);
    return result.rows[0];
  };
  const findLinkedinAccountByUserId = async (userId) => {
    const result = await pool.query('SELECT * FROM linkedin_accounts WHERE user_id = $1', [userId]);
    console.log(result.rows[0]);
    return result.rows[0];
  };
  
  const upsertUserWithLinkedin = async (userId, linkedin_id, username, email, token) => {
    const existingUser = await findUserByLinkedinId(linkedin_id);
    if (existingUser) {
      // Update user if any details have changed, including token and tokenSecret
      const result = await pool.query(
        'UPDATE linkedin_accounts SET username = $1, email = $2, token = $3, user_id = $4 WHERE linkedin_id = $5 RETURNING *',
        [username, email, token, userId, linkedin_id]
      );
      return result.rows[0];
    } else {
      // Insert new Linkedin user linked to the main user account
      const result = await pool.query(
        'INSERT INTO linkedin_accounts (linkedin_id, user_id, username, email, token) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [linkedin_id, userId, username, email, token]
      );
      return result.rows[0];
    }
  };
  
  module.exports = {
    findUserByLinkedinId,
    upsertUserWithLinkedin,
    findLinkedinAccountByUserId
  };