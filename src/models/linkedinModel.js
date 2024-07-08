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

const findLinkedinAccountByLinkedinId = async (linkedin_id) => {
    const result = await pool.query('SELECT * FROM linkedin_accounts WHERE linkedin_id = $1', [linkedin_id]);
    return result.rows[0];
  };
  const findLinkedinAccountsByUserId = async (userId) => {
    const result = await pool.query('SELECT * FROM linkedin_accounts WHERE user_id = $1', [userId]);
    return result.rows;
  };
  
  const upsertUserWithLinkedin = async (userId, linkedin_id, username, email, token) => {
      // Insert new Linkedin user linked to the main user account
      const result = await pool.query(
        'INSERT INTO linkedin_accounts (linkedin_id, user_id, username, email, token) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [linkedin_id, userId, username, email, token]
      );
      return result.rows[0];
  };
  
  const createScheduledPost = async (linkedin_id, content, scheduledTime, status) => {
    const result = await pool.query(
        'INSERT INTO linkedin_posts (user_id, content, scheduled_time, status) VALUES ($1, $2, $3) RETURNING *',
        [linkedin_id, content, scheduledTime, status]
    );
    return result.rows[0];
};

const getPendingScheduledPosts = async () => {
    const result = await pool.query(
        'SELECT * FROM linkedin_posts WHERE scheduled_time > NOW() ORDER BY scheduled_time ASC'
    );
    return result.rows;
};

  module.exports = {
    findLinkedinAccountByLinkedinId,
    upsertUserWithLinkedin,
    findLinkedinAccountsByUserId,
    createScheduledPost,
    getPendingScheduledPosts
  };