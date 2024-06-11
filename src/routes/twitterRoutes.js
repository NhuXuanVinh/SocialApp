const express = require('express');
const router = express.Router();
const twitterController = require('../controllers/twitterController');
const authController = require("../controllers/authController");
const twitterModel = require("../models/twitterModel");

router.get('/auth/twitter', twitterController.twitterAuth);
router.get('/auth/twitter/callback', twitterController.twitterCallback);
// router.post('/postTweet', twitterController.postTweet);

// Route to show the form to post a tweet
router.get('/tweet', authController.ensureAuthenticated, async (req, res) => {
  try {
    const twitterAccount = await twitterModel.findTwitterAccountByUserId(req.user.userid);
    const twitter_username = twitterAccount.username;
    console.log(twitter_username);
    res.render('tweet', {
      twitter_username: twitter_username
    }); // This renders the tweet.ejs file
  } catch (error) {
    console.error('Error retrieving Twitter account:', error);
    res.status(500).send('Error retrieving Twitter account');
  }
  });
  
  // Route to handle tweet posting
  router.post('/tweet', authController.ensureAuthenticated, async (req, res) => {
    const userId = req.user.userid; // Adjust according to your user session structure
    const tweetText = req.body.tweetText;
    // console.log(userId)
    try {
      const tweet = await twitterController.postTweet(userId, tweetText);
      res.send(`Tweet posted successfully: ${tweet.text}`);
    } catch (error) {
      res.status(500).send('Error posting tweet');
    }
  });
module.exports = router;
