const userModel = require('../models/userModel');
const bcrypt = require('bcryptjs');
const passport = require('passport');

const registerUser = async (req, res) => {
    const { username, password, email, phoneNumber } = req.body;

    if (!username || !password || !email) {
        return res.status(400).send('Username, password, and email are required');
    }

    try {
        const existingUser = await userModel.findUserByUsername(username);
        if (existingUser) {
            return res.status(409).send('Username already exists');
        }

        const existingEmail = await userModel.findUserByEmail(email);
        if (existingEmail) {
            return res.status(409).send('Email already used');
        }

        const newUser = await userModel.createUser(username, password, email, phoneNumber);

        req.login(newUser, (err) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Error while logging in');
            }
            return res.redirect('/index');
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
};

const loginUser = (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/dashboard',
        failureRedirect: '/login',
        failureFlash: true
    })(req, res, next);
};

const logoutUser = (req, res) => {
    req.logout(() => {
        res.redirect('/login');
    });
};

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/login');
  }

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    ensureAuthenticated
};
