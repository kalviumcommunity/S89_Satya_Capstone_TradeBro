const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./models/User'); // Assuming this is your Mongoose/database model
const generateJWT = require('./utils/generateJWT');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/auth/google/callback',
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          user = await User.create({
            googleId: profile.id,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            email: profile.emails[0].value,
            // You can add more fields here like profile image, etc.
            username: profile.emails[0].value.split('@')[0], // Basic username from email
          });
        }

        // Pass user to the next step
        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

// We need to store just the user's ID in the session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// We retrieve the user document from the ID
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
