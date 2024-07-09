const express = require('express');
const router = express.Router();
const youtubeController = require('../controllers/youtubeController');
const authController = require("../controllers/authController");

// Routes
router.get('/youtube_upload/:youtubeId', authController.ensureAuthenticated, youtubeController.renderForm);
router.get('/auth/google', authController.ensureAuthenticated, youtubeController.authenticate);
router.get('/auth/google/callback', authController.ensureAuthenticated, youtubeController.oauth2Callback);
router.post('/upload/:youtubeId', authController.ensureAuthenticated, youtubeController.upload.single('video'), youtubeController.uploadVideo);

module.exports = router;
