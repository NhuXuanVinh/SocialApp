const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authController = require('../controllers/authController');

router.get('/post-form/:platform/:accountId', authController.ensureAuthenticated, postController.showPostForm);
router.post('/post/:platform/:accountId', authController.ensureAuthenticated, postController.handlePost);

module.exports = router;
