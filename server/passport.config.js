const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken"); // Import JWT for token generation
const User = require("./models/User"); // Adjust path to your User schema
require('dotenv').config();

// Check if Google credentials are available
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

// Define the callback URL using environment variables
// This allows for flexibility between development and production
const CALLBACK_URL = process.env.API_BASE_URL + "/api/auth/google/callback";

// Log configuration for debugging
console.log('Google OAuth Configuration:');
console.log('- GOOGLE_CLIENT_ID:', GOOGLE_CLIENT_ID ? 'Set' : 'Not set');
console.log('- GOOGLE_CLIENT_SECRET:', GOOGLE_CLIENT_SECRET ? 'Set' : 'Not set');
console.log('- CALLBACK_URL:', CALLBACK_URL);

// Only configure Google strategy if credentials are available
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  // Use environment variable for callback URL to support different environments
  const callbackURL = CALLBACK_URL || "https://s89-satya-capstone-tradebro.onrender.com/api/auth/google/callback";

  console.log('Using Google OAuth callback URL:', callbackURL);

  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: callbackURL,
        scope: ['profile', 'email'],
        proxy: true
      },

    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("Google Profile:", profile); // Debugging - Log the Google profile

        // Check if user already exists
        let user = await User.findOne({ email: profile.emails[0].value });
        let isNewUser = false;

        if (!user) {
          console.log("Creating new user for Google account:", profile.emails[0].value); // Debugging
          isNewUser = true;

          // Create a new user if not found
          user = new User({
            username: profile.displayName || profile.emails[0].value.split('@')[0],
            email: profile.emails[0].value,
            fullName: profile.displayName || profile.name?.givenName + ' ' + profile.name?.familyName,
            password: null, // No password for Google-authenticated users
            profileImage: profile.photos?.[0]?.value || null,
          });
          await user.save();
        } else {
          console.log("User already exists:", user.email); // Debugging

          // Update user information if needed
          let needsUpdate = false;

          // Update fullName if not set
          if (!user.fullName && profile.displayName) {
            user.fullName = profile.displayName;
            needsUpdate = true;
          }

          // Update profile image if available
          if (profile.photos?.[0]?.value && (!user.profileImage || user.profileImage !== profile.photos[0].value)) {
            user.profileImage = profile.photos[0].value;
            needsUpdate = true;
          }

          // Save if updates were made
          if (needsUpdate) {
            await user.save();
            console.log("Updated existing user with Google profile data");
          }
        }

        // Add isNewUser flag to user object for callback handling
        user.isNewUser = isNewUser;

        // Generate JWT token for the user with more user data
        const token = jwt.sign(
          {
            id: user._id,
            email: user.email,
            username: user.username || user.email.split('@')[0],
            fullName: user.fullName || profile.displayName || user.username
          },
          process.env.JWT_SECRET,
          { expiresIn: "7d" } // Token expires in 7 days
        );

        // Attach the token to the user object
        user.token = token;

        return done(null, user); // Pass only the user object to serializeUser
      } catch (err) {
        console.error("Error during Google authentication:", err); // Debugging
        return done(err, null);
      }
    }
  )
  );
} else {
  console.warn("Google OAuth credentials not found. Google authentication will not be available.");
}

passport.serializeUser((user, done) => {
  done(null, user.id || user._id || user.user?.id || user.user?._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    if (!user) {
      return done(new Error("User not found"), null);
    }
    done(null, user);
  } catch (err) {
    console.error("Error during deserialization:", err); // Debugging
    done(err, null);
  }
});

module.exports = passport;
