const nodeSchedule = require('node-schedule');
const twitterPostModel = require('../models/twitterPostModel');
const linkedinPostModel = require('../models/linkedinPostModel');
const twitterModel = require('../models/twitterModel');
const linkedinModel = require('../models/linkedinModel');
const twitterController = require('./twitterController');
const linkedinController = require('./linkedinController');

const schedulePost = async (req, res) => {
    const { platform, content, scheduleTime } = req.body;
    const userId = req.user.userid;

    try {
        let account, scheduledPost, job;

        if (platform === 'twitter') {
            account = await twitterModel.findTwitterAccountByUserId(userId);
            if (!account) {
                return res.status(400).send('Twitter account not found for the user.');
            }
            scheduledPost = await twitterPostModel.createScheduledPost(account.twitter_id, content, scheduleTime);
            job = nodeSchedule.scheduleJob(new Date(scheduleTime), async () => {
                await twitterController.postTweet({
                    body: { content: scheduledPost.content },
                    user: { userid: userId }
                }, {
                    send: (message) => console.log(message),
                    render: (view, options) => console.log(view, options)
                });
                await twitterPostModel.updatePostStatusById(scheduledPost.post_id, 'posted');
            });
        } else if (platform === 'linkedin') {
            account = await linkedinModel.findLinkedinAccountByUserId(userId);
            if (!account) {
                return res.status(400).send('LinkedIn account not found for the user.');
            }
            scheduledPost = await linkedinPostModel.createScheduledPost(account.linkedin_id, content, scheduleTime);
            job = nodeSchedule.scheduleJob(new Date(scheduleTime), async () => {
                await linkedinController.postToLinkedIn({
                    body: { content: scheduledPost.content },
                    user: { userid: userId }
                }, {
                    send: (message) => console.log(message),
                    render: (view, options) => console.log(view, options)
                });
                await linkedinPostModel.updatePostStatusById(scheduledPost.post_id, 'posted');
            });
        } else {
            return res.status(400).send('Invalid platform specified.');
        }

        res.status(201).send({ message: 'Post scheduled successfully!', jobId: job.id });
    } catch (error) {
        console.error('Error scheduling post:', error);
        res.status(500).send('Error scheduling post');
    }
};

module.exports = {
    schedulePost
};
