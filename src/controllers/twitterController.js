const passport = require('passport');
const TwitterStrategy = require('passport-twitter').Strategy;
const twitterModel = require('../models/twitterModel');
const dotenv = require('dotenv');
// const Twitter = require('twitter');
const { TwitterApi } = require('twitter-api-v2');
const userModel = require('../models/userModel'); // Assuming this model has the necessary methods
const { redirect } = require('express/lib/response');
dotenv.config();

passport.use(new TwitterStrategy({
  consumerKey: process.env.TWITTER_CONSUMER_KEY,
  consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
  callbackURL: process.env.TWITTER_CALLBACK_URL,
  includeEmail: true,
  passReqToCallback: true  // Ensure this is set to true
},
async (req, token, tokenSecret, profile, done) => {
  try {
    const loggedInUser = req.user;
    if (!loggedInUser) {
      return done(null, false, { message: 'User must be logged in first' });
    }
    const userId = loggedInUser.userid;
    const email = profile.emails ? profile.emails[0].value : null;
    const twitterId = profile.id;
    const username = profile.username || profile.displayName;
    await twitterModel.upsertUserWithTwitter(userId, twitterId, username, profile.displayName, email, token, tokenSecret);
    done(null, loggedInUser); // Keep the local user as req.user
  } catch (err) {
    console.error("Error in Twitter Strategy", err);
    done(err);
  }
}
));

// const createTwitterClient = (token, tokenSecret) => {
//   return new Twitter({
//     consumer_key: process.env.TWITTER_CONSUMER_KEY,
//     consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
//     access_token_key: token,
//     access_token_secret: tokenSecret
//   });
// };

const createTwitterClient = (token, tokenSecret) => {
  console.log('Creating Twitter client with tokens:', {
    token,
    token_secret: tokenSecret,
  });
  return new TwitterApi({
    appKey: process.env.TWITTER_CONSUMER_KEY,
    appSecret: process.env.TWITTER_CONSUMER_SECRET,
    accessToken: token,
    accessSecret: tokenSecret,
  });
};


const postTweet = async (req, res) => {
  try {
    // Retrieve the user's Twitter tokens from your database
    // const userId = req.user.userid
    const twitterId = req.params.twitterId;
    const tweetText = req.body.tweetText;
    const twitterAccount = await twitterModel.findTwitterAccountByTwitterId(twitterId);

    if (!twitterAccount) {
      console.error('Twitter account not linked for user:', userId);
      req.flash('error', 'Twitter account not linked.');
      return res.redirect('/dashboard');
    }
    console.log('Retrieved tokens:', {
      token: twitterAccount.token,
      token_secret: twitterAccount.token_secret,
    });
    // Create a Twitter client using the user's tokens
    const client = createTwitterClient(twitterAccount.token, twitterAccount.token_secret);

    // Post the tweet
    const { data: tweet } = await client.v2.tweet(tweetText);
    console.log('Tweet posted successfully:', tweet);

    // // Save post to db
    // const postLink = `https://twitter.com/${twitterAccount.username}/status/${tweet.id}`;
    // await twitterModel.createTwitterPost(twitterId, tweetText, null, postLink, "posted");

    // Redirect to dashboard
    return tweet;
  } catch (error) {
    console.error('Error posting tweet:', error);
    throw error;
  }
};


const twitterAuth = passport.authenticate('twitter');

const twitterCallback = passport.authenticate('twitter', {
  successRedirect: '/dashboard',
  failureRedirect: '/dashboard',
});

module.exports = {
  twitterAuth,
  twitterCallback,
  postTweet,
};
