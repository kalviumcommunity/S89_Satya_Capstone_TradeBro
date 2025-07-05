const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");
const User = require("./models/User");
require('dotenv').config();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const CALLBACK_URL = (process.env.API_BASE_URL || "https://s89-satya-capstone-tradebro.onrender.com") + "/api/auth/google/callback";

console.log('Google OAuth Configuration:');
console.log('- GOOGLE_CLIENT_ID:', GOOGLE_CLIENT_ID ? 'Set' : 'Not set');
console.log('- GOOGLE_CLIENT_SECRET:', GOOGLE_CLIENT_SECRET ? 'Set' : 'Not set');
console.log('- CALLBACK_URL:', CALLBACK_URL);

if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: CALLBACK_URL
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log("Google Profile:", profile);

          let user = await User.findOne({ email: profile.emails[0].value });
          let isNewUser = false;

          if (!user) {
            isNewUser = true;
            user = new User({
              username: profile.displayName || profile.emails[0].value.split('@')[0],
              email: profile.emails[0].value,
              fullName: profile.displayName ||
                ((profile.name?.givenName || "") + " " + (profile.name?.familyName || "")).trim() ||
                profile.emails[0].value.split('@')[0],
              password: "", // Use empty string for Google users
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

          user.isNewUser = isNewUser;

          // Generate JWT token
          const token = jwt.sign(
            {
              id: user._id,
              email: user.email,
              username: user.username,
              fullName: user.fullName
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
          );

          user.token = token;

          return done(null, user);
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

passport.serializeUser((user, done) => {
  done(null, user.id || user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    if (!user) {
      return done(new Error("User not found"), null);
    }
    done(null, user);
  } catch (err) {
    console.error("Error during deserialization:", err);
    done(err, null);
  }
});

module.exports = passport;
