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

const findTwitterAccountByTwitterId = async (twitterId) => {
    const result = await pool.query('SELECT * FROM twitter_accounts WHERE twitter_id = $1', [twitterId]);
    return result.rows[0];
  };
  const findTwitterAccountsByUserId = async (userId) => {
    const result = await pool.query('SELECT * FROM twitter_accounts WHERE user_id = $1', [userId]);
    return result.rows;
  };
  
  const upsertUserWithTwitter = async (userId, twitterId, username, displayName, email, token, tokenSecret) => {
      // Insert new Twitter user linked to the main user account
      const result = await pool.query(
        'INSERT INTO twitter_accounts (user_id, twitter_id, username, display_name, email, token, token_secret) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [userId, twitterId, username, displayName, email, token, tokenSecret]
      );
      return result.rows[0];
  };
  
  const createTwitterPost = async(twitterId, tweetText, scheduleTime, postLink, status) =>{
    const result = await pool.query(
      'INSERT INTO twitter_posts (twitter_id, content, scheduled_time, post_link) VALUES ($1, $2, $3, $4)',
      [twitterId, tweetText, scheduleTime, postLink]
    );
    return result.rows[0];
  }
  module.exports = {
    findTwitterAccountByTwitterId,
    upsertUserWithTwitter,
    findTwitterAccountsByUserId,
    createTwitterPost,
  };