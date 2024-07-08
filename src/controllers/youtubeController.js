const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const dotenv = require('dotenv')

dotenv.config()


const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_CALLBACK_URI
);

let tokens; // Variable to store tokens

const upload = multer({ dest: 'uploads/' });

const renderForm = (req, res) => {
  res.render('youtubePostForm');
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

    // Store the refresh token in a database or session for later use
    if (oauthTokens.refresh_token) {
      console.log('Refresh token:', oauthTokens.refresh_token);
      // Store the refresh token securely
    }

    res.redirect('/youtube_upload'); // Redirect to the upload form page
  } catch (error) {
    console.error('Error retrieving access token:', error);
    res.status(500).send('Authentication failed');
  }
};

const uploadVideo = async (req, res) => {
  try {
    if (!tokens) {
      throw new Error('No tokens available');
    }
    oauth2Client.setCredentials(tokens);

    const videoPath = req.file.path;
    const requestBody = {
      snippet: {
        title: req.body.title,
        description: req.body.description,
      },
      status: {
        privacyStatus: req.body.privacyStatus, // Set privacy status based on form input
        madeForKids: false, // Always set madeForKids to false
      },
    };

    // Add tags to the request body if provided
    if (req.body.tags) {
      requestBody.snippet.tags = req.body.tags.split(',');
    }

    const response = await google.youtube('v3').videos.insert({
      part: 'snippet,status',
      auth: oauth2Client,
      requestBody: requestBody,
      media: {
        body: fs.createReadStream(videoPath),
      },
    });

    res.status(200).send(`Video uploaded successfully: ${response.data.id}`);
    fs.unlinkSync(videoPath); // Delete the file after upload
  } catch (error) {
    console.error('Error during video upload:', error);
    res.status(500).send('An error occurred while uploading the video.');
  }
};

module.exports = {
  renderForm,
  authenticate,
  oauth2Callback,
  uploadVideo,
  upload,
};
