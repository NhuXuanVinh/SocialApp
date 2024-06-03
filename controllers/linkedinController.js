const axios = require('axios');
const querystring = require('querystring');
const linkedinModel = require('../models/linkedinModel')
// const db = require('../models/db');

const LINKEDIN_OAUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const LINKEDIN_USERINFO_URL = 'https://api.linkedin.com/v2/userinfo';
const LINKEDIN_POST_URL = 'https://api.linkedin.com/v2/ugcPosts';

const redirectToLinkedIn = (req, res) => {
    const params = querystring.stringify({
        response_type: 'code',
        client_id: process.env.LINKEDIN_CLIENT_ID,
        redirect_uri: process.env.LINKEDIN_CALLBACK_URI,
        scope: 'openid profile w_member_social email',
        state: '12345'  // Use a unique state parameter for security
    });
    console.log(`Redirecting to: ${LINKEDIN_OAUTH_URL}?${params}`);
    res.redirect(`${LINKEDIN_OAUTH_URL}?${params}`);
};

const handleLinkedInCallback = async (req, res) => {
    console.log('Callback query parameters:', req.query);
    
    const { code, state } = req.query;

    console.log(`Received code: ${code}, state: ${state}`);

    // Check if code is present
    if (!code) {
        return res.status(400).send('Authorization code is missing');
    }

    try {
        const tokenResponse = await axios.post(LINKEDIN_TOKEN_URL, querystring.stringify({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: process.env.LINKEDIN_CALLBACK_URI,
            client_id: process.env.LINKEDIN_CLIENT_ID,
            client_secret: process.env.LINKEDIN_CLIENT_SECRET
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        const accessToken = tokenResponse.data.access_token;
        const loggedInUser = req.user;

        // Get the user's LinkedIn profile information from /me endpoint
        const userInfoResponse = await axios.get(LINKEDIN_USERINFO_URL, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        // Log the entire profile response for debugging
        console.log('Profile response:', userInfoResponse.data);

        // Check if userInfoResponse contains the required information
        if (!userInfoResponse.data.sub) {
            throw new Error('LinkedIn profile ID is missing in the response');
        }

        const userId = loggedInUser.userid
        const linkedinId = userInfoResponse.data.sub;
        const username = userInfoResponse.data.name;
        const email = userInfoResponse.data.email;

        if (!userId) {
            throw new Error('User ID is missing in the request');
        }

        await linkedinModel.upsertUserWithLinkedin(userId, linkedinId, username, email, accessToken)

        req.session.accessToken = accessToken;
        req.session.linkedinUrn = `urn:li:person:${linkedinId}`;

        res.redirect('/dashboard');
    } catch (error) {
        console.error('Error getting access token or user profile:', error.response ? error.response.data : error.message);
        res.status(500).send('Error getting access token or user profile');
    }
};

const postToLinkedIn = async (req, res) => {
    const { content } = req.body;
    try {
        const linkedinAccount = await linkedinModel.findLinkedinAccountByUserId(req.user.userid);
        if (!linkedinAccount) {
            return res.status(400).send('LinkedIn account not found for the user.');
        }

        const accessToken = linkedinAccount.token;
        const linkedinUrn = `urn:li:person:${linkedinAccount.linkedin_id}`;

        if (!accessToken || !linkedinUrn) {
            return res.status(400).send('Session expired or invalid. Please re-authenticate.');
        }

        const postBody = {
            author: linkedinUrn,
            lifecycleState: 'PUBLISHED',
            specificContent: {
                'com.linkedin.ugc.ShareContent': {
                    shareCommentary: {
                        text: content
                    },
                    shareMediaCategory: 'NONE'
                }
            },
            visibility: {
                'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
            }
        };

        await axios.post(LINKEDIN_POST_URL, postBody, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'X-Restli-Protocol-Version': '2.0.0'
            }
        });

        res.render('form', { message: 'Post successful!' });
    } catch (error) {
        console.error('Error posting to LinkedIn:', error.response ? error.response.data : error.message);
        res.status(500).send('Error posting to LinkedIn');
    }
};

module.exports = {
    redirectToLinkedIn,
    handleLinkedInCallback,
    postToLinkedIn
};