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

const findUserByTwitterId = async (twitterId) => {
    const result = await pool.query('SELECT * FROM twitter_accounts WHERE twitter_id = $1', [twitterId]);
    return result.rows[0];
  };
  const findTwitterAccountByUserId = async (userId) => {
    const result = await pool.query('SELECT * FROM twitter_accounts WHERE user_id = $1', [userId]);
    console.log(result.rows[0]);
    return result.rows[0];
  };
  
  const upsertUserWithTwitter = async (userId, twitterId, username, displayName, email, token, tokenSecret) => {
    const existingUser = await findUserByTwitterId(twitterId);
    if (existingUser) {
      // Update user if any details have changed, including token and tokenSecret
      const result = await pool.query(
        'UPDATE twitter_accounts SET username = $1, display_name = $2, email = $3, token = $4, token_secret = $5, user_id = $6 WHERE twitter_id = $7 RETURNING *',
        [username, displayName, email, token, tokenSecret, userId, twitterId]
      );
      return result.rows[0];
    } else {
      // Insert new Twitter user linked to the main user account
      const result = await pool.query(
        'INSERT INTO twitter_accounts (user_id, twitter_id, username, display_name, email, token, token_secret) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [userId, twitterId, username, displayName, email, token, tokenSecret]
      );
      return result.rows[0];
    }
  };
  
  module.exports = {
    findUserByTwitterId,
    upsertUserWithTwitter,
    findTwitterAccountByUserId
  };