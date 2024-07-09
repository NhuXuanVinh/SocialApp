const nodeSchedule = require('node-schedule');
const twitterModel = require('../models/twitterModel');
const linkedinModel = require('../models/linkedinModel');
const twitterController = require('./twitterController');
const linkedinController = require('./linkedinController');

const showPostForm = async (req, res) => {
    const { platform, accountId } = req.params;
    const username = req.query.username;

    res.render('postForm', { platform, accountId, username });
};

const handlePost = async (req, res) => {
    const { platform, accountId } = req.params;
    const { content, postType, scheduledTime } = req.body;

    try {
        let job, postId;

        if (platform === 'twitter') {
            if (postType === 'now') {
                const postResponse = await twitterController.postTweet({
                    body: { tweetText: content },
                    params: { twitterId: accountId }
                }, res);

                const postLink = `https://twitter.com/${accountId}/status/${postResponse.id}`;
                postId = await twitterModel.createTwitterPost(accountId, content, null, postLink, 'posted');
                req.flash('success', 'Tweet posted successfully!');
                res.redirect('/dashboard');
            } else {
                postId = await twitterModel.createTwitterPost(accountId, content, scheduledTime, null, 'scheduled');
                job = nodeSchedule.scheduleJob(new Date(scheduledTime), async () => {
                    try {
                        const postResponse = await twitterController.postTweet({
                            body: { tweetText: content },
                            params: { twitterId: accountId }
                        }, {
                            send: (message) => console.log(message),
                            render: (view, options) => console.log(view, options)
                        });
                        console.log('Scheduled tweet response:', postResponse); // Log the entire response
                        const postLink = `https://twitter.com/${accountId}/status/${postResponse.id}`;
                        await twitterModel.updatePostStatusById(postId, 'posted', postLink);
                    } catch (error) {
                        console.error('Error posting scheduled tweet:', error);
                        // Handle error notification here if needed
                    }
                });
                req.flash('success', 'Post scheduled successfully!');
                res.redirect('/dashboard');
            }
        } else if (platform === 'linkedin') {
            if (postType === 'now') {
                const postResponse = await linkedinController.postToLinkedIn({
                    body: { content },
                    params: { linkedinId: accountId }
                }, res);
                const postLink = `https://www.linkedin.com/feed/update/${postResponse.id}`;
                postId = await linkedinModel.createLinkedinPost(accountId, content, null, postLink, 'posted');
                req.flash('success', 'Post successfully!');
                res.redirect('/dashboard');
            } else {
                postId = await linkedinModel.createLinkedinPost(accountId, content, scheduledTime, null, 'scheduled');
                job = nodeSchedule.scheduleJob(new Date(scheduledTime), async () => {
                    try {
                        const postResponse = await linkedinController.postToLinkedIn({
                            body: { content },
                            params: { linkedinId: accountId }
                        }, {
                            send: (message) => console.log(message),
                            render: (view, options) => console.log(view, options)
                        });
                        const postLink = `https://www.linkedin.com/feed/update/${postResponse.id}`;
                        await linkedinModel.updatePostStatusById(postId, 'posted', postLink);
                    } catch (error) {
                        console.error('Error posting scheduled LinkedIn post:', error);
                        // Handle error notification here if needed
                    }
                });
                req.flash('success', 'Post scheduled successfully!');
                res.redirect('/dashboard');
            }
        } else {
            return res.status(400).send('Invalid platform specified.');
        }
    } catch (error) {
        console.error('Error handling post:', error);
        req.flash('error', 'Error handling post');
        res.redirect('/dashboard');
    }
};

module.exports = {
    showPostForm,
    handlePost
};
