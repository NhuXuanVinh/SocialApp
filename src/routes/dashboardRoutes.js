const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const linkedinModel = require('../models/linkedinModel');
const twitterModel = require('../models/twitterModel');
const youtubeModel = require('../models/youtubeModel');
// const youtubeModel = require('../models/youtubeModel');

router.get('/dashboard', authController.ensureAuthenticated, async (req, res) => {
    try {
        const userId = req.user.userid;
        const linkedinAccounts = await linkedinModel.findLinkedinAccountsByUserId(userId);
        const twitterAccounts = await twitterModel.findTwitterAccountsByUserId(userId);
        const youtubeAccounts = await youtubeModel.findYouTubeAccountsByUserId(userId);

        res.render('dashboard', {
            linkedinAccounts: linkedinAccounts || [],
            twitterAccounts: twitterAccounts || [],
            youtubeAccounts: youtubeAccounts || [],
            messages: req.flash(),
        });
    } catch (error) {
        console.error('Error retrieving social accounts:', error);
        res.status(500).send('Error retrieving social accounts');
    }
});

module.exports = router;
