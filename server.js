const express = require('express');
const session = require('express-session');
const dotenv = require('dotenv');
const passport = require('passport');
// const ngrok = require('ngrok');
const authRoutes = require('./src/routes/authRoutes'); // Import the authentication routes
const twitterRoutes = require('./src/routes/twitterRoutes'); // Import the authentication routes
const linkedinRoutes = require('./src/routes/linkedinRoutes')
const youtubeRoutes = require('./src/routes/youtubeRoutes')
require('./config/passport_setup')(passport);
const flash = require('connect-flash'); 
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;


app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using https
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // To handle URL-encoded data
app.use(express.json()); // To handle JSON data
// Serve static files from the 'public' directory
app.set('view engine', 'ejs');
app.use(express.static('public'));

// Use the authentication routes from the routes module
app.use(authRoutes);
app.use(twitterRoutes);
app.use(linkedinRoutes);
app.use(youtubeRoutes);
// Optionally, define a root route or any additional routes
app.get('/dashboard', (req, res) => {
    if (req.isAuthenticated()) {
      res.render('dashboard', {
        linkedinUsername: "Nhu Xuan Vinh",
        twitterUsername: "NXVINHPRO2",
        youtubeChannel: "Vinh Nhu"
    });
    } else {
      res.redirect('/login');
    }
  });

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
