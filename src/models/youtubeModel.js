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

// Find YouTube account by YouTube ID
const findYouTubeAccountByYouTubeId = async (youtubeId) => {
    const result = await pool.query('SELECT * FROM youtube_accounts WHERE youtube_id = $1', [youtubeId]);
    return result.rows[0];
};

// Find YouTube accounts by User ID
const findYouTubeAccountsByUserId = async (userId) => {
    const result = await pool.query('SELECT * FROM youtube_accounts WHERE user_id = $1', [userId]);
    return result.rows;
};

// Upsert YouTube user linked to the main user account
const upsertYouTubeAccount = async (youtubeId, userId, username, email, token) => {
    const result = await pool.query(
        `INSERT INTO youtube_accounts (youtube_id, user_id, username, email, token) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [youtubeId, userId, username, email, token]
    );
    return result.rows[0];
};

// Create a new YouTube video entry
const createYouTubeVideo = async (youtubeId, title, link, scheduleTime) => {
    const result = await pool.query(
        `INSERT INTO youtube_videos (youtube_id, title, link, schedule_time) VALUES ($1, $2, $3, $4) RETURNING *`,
        [youtubeId, title, link, scheduleTime]
    );
    return result.rows[0];
};

// Update video status by Video ID
const updateVideoStatusById = async (videoId, title, link, scheduleTime) => {
    const result = await pool.query(
        `UPDATE youtube_videos SET title = $1, link = $2, schedule_time = $3 WHERE video_id = $4 RETURNING *`,
        [title, link, scheduleTime, videoId]
    );
    return result.rows[0];
};

module.exports = {
    findYouTubeAccountByYouTubeId,
    findYouTubeAccountsByUserId,
    upsertYouTubeAccount,
    createYouTubeVideo,
    updateVideoStatusById
};
