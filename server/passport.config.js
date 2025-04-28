const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken"); // Import JWT for token generation
const User = require("./models/User"); // Adjust path to your User schema

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID, // Replace with your Google Client ID
      clientSecret: process.env.GOOGLE_CLIENT_SECRET, // Replace with your Google Client Secret
      callbackURL: "http://localhost:5000/api/auth/auth/google/callback", // Adjust for production
    },

    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("Google Profile:", profile); // Debugging - Log the Google profile

        // Check if user already exists
        let user = await User.findOne({ email: profile.emails[0].value });
        if (!user) {
          console.log("Creating new user for Google account:", profile.emails[0].value); // Debugging

          // Create a new user if not found
          user = new User({
            username: profile.displayName,
            email: profile.emails[0].value,
            password: null, // No password for Google-authenticated users
          });
          await user.save();
        } else {
          console.log("User already exists:", user.email); // Debugging
        }

        // Generate JWT token for the user
        const token = jwt.sign(
          { id: user._id, email: user.email },
          process.env.JWT_SECRET,
          { expiresIn: "1h" } // Token expires in 1 hour
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
