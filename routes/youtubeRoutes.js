const express = require('express');
const router = express.Router();
const youtubeController = require('../controllers/youtubeController');

// Routes
router.get('/youtube_upload', youtubeController.renderForm);
router.get('/auth/google', youtubeController.authenticate);
router.get('/auth/google/callback', youtubeController.oauth2Callback);
router.post('/upload', youtubeController.upload.single('video'), youtubeController.uploadVideo);

module.exports = router;
