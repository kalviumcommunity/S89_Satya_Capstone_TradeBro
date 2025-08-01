const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");
const User = require("./models/User");
require('dotenv').config();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET environment variable is not set');
  process.exit(1);
}

const isDevelopment = process.env.NODE_ENV !== 'production' || process.env.API_BASE_URL?.includes('localhost');
const BASE_URL = isDevelopment ? "http://localhost:5001" : (process.env.API_BASE_URL || "https://s89-satya-capstone-tradebro.onrender.com");
const CALLBACK_URL = BASE_URL + "/api/auth/google/callback";

console.log('Google OAuth Configuration:');
console.log('- GOOGLE_CLIENT_ID:', GOOGLE_CLIENT_ID ? 'Set' : 'Not set');
console.log('- GOOGLE_CLIENT_SECRET:', GOOGLE_CLIENT_SECRET ? 'Set' : 'Not set');
console.log('- JWT_SECRET:', JWT_SECRET ? 'Set' : 'Not set');
console.log('- CALLBACK_URL:', CALLBACK_URL);

if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: CALLBACK_URL,
        scope: ['profile', 'email'],
        accessType: 'offline',
        prompt: 'consent'
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          console.log("Google Profile:", profile);

          // Safely access profile.emails with proper validation
          if (!profile.emails || !Array.isArray(profile.emails) || profile.emails.length === 0) {
            console.error("Google profile missing email information");
            return done(new Error("Email not provided by Google"), null);
          }

          const email = profile.emails[0].value;
          if (!email) {
            console.error("Google profile email is empty");
            return done(new Error("Invalid email from Google"), null);
          }

          let user = await User.findOne({ email });
          let isNewUser = false;

          if (!user) {
            isNewUser = true;
            user = new User({
              username: profile.displayName || email.split('@')[0],
              email: email,
              fullName: profile.displayName ||
                ((profile.name?.givenName || "") + " " + (profile.name?.familyName || "")).trim() ||
                email.split('@')[0],
              authProvider: "google",
              profileImage: profile.photos?.[0]?.value || null,
            });
            await user.save();
          } else {
            let needsUpdate = false;
            if (!user.fullName && profile.displayName) {
              user.fullName = profile.displayName;
              needsUpdate = true;
            }
            if (profile.photos?.[0]?.value && (!user.profileImage || user.profileImage !== profile.photos[0].value)) {
              user.profileImage = profile.photos[0].value;
              needsUpdate = true;
            }
            if (needsUpdate) {
              await user.save();
            }
          }

          if (!JWT_SECRET) {
            console.error("JWT_SECRET is not defined when trying to sign token");
            return done(new Error("Server configuration error"), null);
          }

          const token = jwt.sign(
            {
              id: user._id,
              email: user.email,
              username: user.username,
              fullName: user.fullName
            },
            JWT_SECRET,
            { expiresIn: "7d" }
          );

          
          const userResponse = {
            _id: user._id,
            id: user._id,
            email: user.email,
            username: user.username,
            fullName: user.fullName,
            profileImage: user.profileImage,
            authProvider: user.authProvider || "google",
            isNewUser: isNewUser,
            token: token
          };

          return done(null, userResponse);
        } catch (err) {
          console.error("Error during Google authentication:", err);
          return done(err, null);
        }
      }
    )
  );
} else {
  console.warn("Google OAuth credentials not found. Google authentication will not be available.");
}

// Passport session serialization (required for OAuth flow)
passport.serializeUser((user, done) => {
  // Store minimal user data in session
  done(null, {
    id: user._id || user.id,
    email: user.email,
    isNewUser: user.isNewUser,
    token: user.token
  });
});

passport.deserializeUser((sessionUser, done) => {
  // Return the user data from session
  done(null, sessionUser);
});

module.exports = passport;