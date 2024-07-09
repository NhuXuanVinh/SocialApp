const { google } = require('googleapis');
const fs = require('fs');
const multer = require('multer');
const dotenv = require('dotenv');
const youtubeModel = require('../models/youtubeModel');

dotenv.config();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URI
);

let tokens; // Variable to store tokens

// Configure Multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 100 * 1024 * 1024 }, // Limit file size to 100MB
});

const renderForm = (req, res) => {
  const { youtubeId } = req.params; // Get YouTube ID from params
  res.render('youtubePostForm', { youtube_id: youtubeId });
};

const authenticate = (req, res) => {
  const scopes = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
  });

  res.redirect(url);
};

const oauth2Callback = async (req, res) => {
  const { code } = req.query;

  try {
    const { tokens: oauthTokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(oauthTokens);
    tokens = oauthTokens;

    // Retrieve user info
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const { id, email, name } = userInfo.data;

    // Save account info to the database
    await youtubeModel.upsertYouTubeAccount(id, req.user.userid, name, email, oauthTokens.refresh_token);

    res.redirect('/dashboard'); // Redirect to the upload form page
  } catch (error) {
    console.error('Error retrieving access token:', error);
    res.status(500).send('Authentication failed');
  }
};

const uploadVideo = async (req, res) => {
  try {
    console.log('File upload attempt:', req.file);
    if (!req.file) {
      throw new Error('No file uploaded');
    }

    const { youtubeId } = req.params; // Use youtubeId from params
    const youtubeAccount = await youtubeModel.findYouTubeAccountByYouTubeId(youtubeId);
    if (!youtubeAccount) {
      throw new Error('No YouTube account found');
    }

    oauth2Client.setCredentials({ refresh_token: youtubeAccount.token });

    const videoPath = req.file.path;
    const { title, description, postType, publishAt, tags } = req.body;

    // Validate and convert the publishAt field if provided
    let scheduledTime = null;
    let finalPrivacyStatus = 'public';
    if (postType === 'schedule' && publishAt) {
      const publishDate = new Date(publishAt);
      if (isNaN(publishDate.getTime()) || publishDate <= new Date()) {
        throw new Error('Invalid scheduled publishing time. It must be in the future and in ISO 8601 format.');
      }
      scheduledTime = publishDate.toISOString();
      console.log('Scheduled publish time:', scheduledTime);
      // If scheduling a publish time, set initial privacy status to private
      finalPrivacyStatus = 'private';
    }

    const requestBody = {
      snippet: {
        title,
        description,
      },
      status: {
        privacyStatus: finalPrivacyStatus,
        madeForKids: false,
        publishAt: scheduledTime,
      },
    };

    // Add tags to the request body if provided
    if (tags) {
      requestBody.snippet.tags = tags.split(',');
    }

    const response = await google.youtube('v3').videos.insert({
      part: 'snippet,status',
      auth: oauth2Client,
      requestBody,
      media: {
        body: fs.createReadStream(videoPath),
      },
    });

    const videoLink = `https://www.youtube.com/watch?v=${response.data.id}`;

    // Save video details to the database
    await youtubeModel.createYouTubeVideo(youtubeAccount.youtube_id, title, videoLink, scheduledTime);

    req.flash('success', `Video uploaded successfully: ${response.data.id}`);
    res.redirect('/dashboard'); // Redirect to dashboard after successful upload
    fs.unlinkSync(videoPath); // Delete the file after upload
  } catch (error) {
    console.error('Error during video upload:', error.message);
    req.flash('error', `An error occurred while uploading the video: ${error.message}`);
    res.redirect('/dashboard');
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
  }
};

module.exports = {
  renderForm,
  authenticate,
  oauth2Callback,
  uploadVideo,
  upload,
};
