const express = require('express');
const router = express.Router();
const linkedinController = require('../controllers/linkedinController');
const authController = require("../controllers/authController");

router.get('/auth/linkedin', authController.ensureAuthenticated, linkedinController.redirectToLinkedIn);
router.get('/auth/linkedin/callback', authController.ensureAuthenticated, linkedinController.handleLinkedInCallback);
router.get('/post-to-linkedin/:linkedin_id', authController.ensureAuthenticated, (req, res) => {
    res.render('linkedinPostForm',{
        platform: "Linkedin",
        accountId: 2,
        username: "vinh"
    });
});
router.post('/post-to-linkedin/:linkedin_id', authController.ensureAuthenticated, linkedinController.postToLinkedIn);

module.exports = router;
