const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Route for displaying the login page
router.get('/login', (req, res) => {
    res.render('login');  // Assuming 'login.ejs' is your login template
});

// Route for handling the login logic
router.post('/login', authController.loginUser);

// Route for displaying the sign-up page
router.get('/signup', (req, res) => {
    res.render('signUp');  // Assuming 'signup.ejs' is your sign-up template
});

// Route for handling the sign-up logic
router.post('/signup', authController.registerUser);

// Route for logging out
router.get('/logout', authController.logoutUser);

module.exports = router;
