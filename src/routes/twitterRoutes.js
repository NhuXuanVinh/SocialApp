const express = require('express');
const router = express.Router();
const twitterController = require('../controllers/twitterController');
const authController = require("../controllers/authController");
const twitterModel = require("../models/twitterModel");

router.get('/auth/twitter', twitterController.twitterAuth);
router.get('/auth/twitter/callback', twitterController.twitterCallback);

// Route to show the form to post a tweet
router.get('/tweet/:twitterId', authController.ensureAuthenticated, async (req, res) => {
  try {
    const twitterAccount = await twitterModel.findTwitterAccountByTwitterId(req.params.twitterId);
    if (!twitterAccount) {
      return res.status(400).send('Twitter account not linked.');
    }
    res.render('twitterPostForm', { twitter_username: twitterAccount.username, twitter_id: twitterAccount.twitter_id });
  } catch (error) {
    console.error('Error retrieving Twitter account:', error);
    res.status(500).send('Error retrieving Twitter account');
  }
});

// Route to handle tweet posting
router.post('/tweet/:twitterId', authController.ensureAuthenticated, twitterController.postTweet);

module.exports = router;
