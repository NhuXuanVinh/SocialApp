// In a file like passport-setup.js
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const userModel = require('../src/models/userModel');

module.exports = function(passport) {
    passport.use(new LocalStrategy({ usernameField: 'username' }, async (username, password, done) => {
        // Match user
        try {
            const user = await userModel.findUserByUsername(username);

            if (!user) {
                return done(null, false, { message: 'That username is not registered' });
            }

            // Match password
            bcrypt.compare(password, user.passwordhash, (err, isMatch) => {
                if (err) throw err;
                if (isMatch) {
                    return done(null, user);
                } else {
                    return done(null, false, { message: 'Password incorrect' });
                }
            });
        } catch (err) {
            return done(err);
        }
    }));

    passport.serializeUser((user, done) => {
        done(null, user.userid);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await userModel.findUserById(id);
            done(null, user);
        } catch (err) {
            done(err, null);
        }
    });
};
