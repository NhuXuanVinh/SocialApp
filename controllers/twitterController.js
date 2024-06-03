const passport = require('passport');
const TwitterStrategy = require('passport-twitter').Strategy;
const twitterModel = require('../models/twitterModel');
const dotenv = require('dotenv');
// const Twitter = require('twitter');
const { TwitterApi } = require('twitter-api-v2');
const userModel = require('../models/userModel'); // Assuming this model has the necessary methods
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

// const postTweet = async (userId, tweetText) => {
//   try {
//     // Retrieve the user's Twitter tokens from your database
//     const twitterAccount = await twitterModel.findTwitterAccountByUserId(userId);
//     if (!twitterAccount) {
//       throw new Error('Twitter account not linked');
//     }

//     // Create a Twitter client using the user's tokens
//     const client = createTwitterClient(twitterAccount.token, twitterAccount.token_secret);

//     // Post the tweet
//     const tweet = await client.post('statuses/update', { status: tweetText });
//     return tweet;
//   } catch (error) {
//     console.error('Error posting tweet', error);
//     throw error;
//   }
// };

const postTweet = async (userId, tweetText) => {
  try {
    // Retrieve the user's Twitter tokens from your database
    const twitterAccount = await twitterModel.findTwitterAccountByUserId(userId);

    if (!twitterAccount) {
      console.error('Twitter account not linked for user:', userId);
      throw new Error('Twitter account not linked');
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
    return tweet;
  } catch (error) {
    console.error('Error posting tweet for user:', userId, 'with message:', tweetText, 'Error:', error);
    throw error;
  }
};


const twitterAuth = passport.authenticate('twitter');

const twitterCallback = passport.authenticate('twitter', {
  successRedirect: '/index',
  failureRedirect: '/index',
});

module.exports = {
  twitterAuth,
  twitterCallback,
  postTweet,
};
