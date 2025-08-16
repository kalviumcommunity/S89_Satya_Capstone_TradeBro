const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./models/User');
const VirtualMoney = require('./models/VirtualMoney');
const { generateToken } = require('./utils/tokenUtils');
const { USER_DEFAULTS } = require('./config/constants');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const { id: googleId, emails, displayName, name, photos } = profile;
    const email = emails[0].value;

    let user = await User.findOne({ $or: [{ email }, { googleId }] });

    if (!user) {
      let username = email.split('@')[0];
      let counter = 1;
      
      while (await User.findOne({ username })) {
        username = `${email.split('@')[0]}${counter}`;
        counter++;
      }

      user = new User({
        username,
        email,
        fullName: displayName || `${name.givenName} ${name.familyName}`,
        firstName: name.givenName,
        lastName: name.familyName,
        password: 'google_oauth',
        authProvider: 'google',
        googleId,
        profileImage: photos[0]?.value,
        emailVerified: true,
        ...USER_DEFAULTS
      });
      await user.save();

      const virtualMoney = new VirtualMoney({
        userId: user._id,
        userEmail: email,
        balance: 10000,
        totalValue: 10000,
        availableCash: 10000,
        totalInvested: 0,
        totalGainLoss: 0,
        totalGainLossPercentage: 0,
        holdings: [],
        transactions: [{ type: 'DEPOSIT', amount: 10000, description: 'Initial deposit', timestamp: new Date() }]
      });
      await virtualMoney.save();
    }

    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;