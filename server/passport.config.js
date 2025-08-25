// passport.config.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./models/User'); // Adjust path if necessary
const VirtualMoney = require('./models/VirtualMoney'); // Adjust path if necessary
const { generateToken } = require('./utils/tokenUtils'); // Adjust path if necessary
const { USER_DEFAULTS } = require('./config/constants'); // Adjust path if necessary

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "https://s89-satya-capstone-tradebro.onrender.com/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const { id: googleId, emails, displayName, name, photos } = profile;
        const email = emails[0].value;

        // Log profile data for debugging
        console.log("Google Profile:", profile);

        let user = await User.findOne({ $or: [{ email }, { googleId }] });

        if (!user) {
            let username = email.split('@')[0];
            let counter = 1;
            
            // Ensure unique username
            while (await User.findOne({ username })) {
                username = `${email.split('@')[0]}${counter}`;
                counter++;
            }

            user = new User({
                username,
                email,
                fullName: displayName || `${name.givenName || ''} ${name.familyName || ''}`.trim(),
                firstName: name.givenName,
                lastName: name.familyName,
                password: 'google_oauth', // Placeholder password for OAuth users
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
            console.log("New Google user created:", user.email);
        } else {
            console.log("Existing Google user logged in:", user.email);
            // Optional: Update existing user's profile image or other details if they change on Google
            if (user.profileImage !== photos[0]?.value) {
                user.profileImage = photos[0]?.value;
                await user.save();
            }
        }

        return done(null, user);
    } catch (error) {
        console.error('Passport Google Strategy Error:', error);
        return done(error, null);
    }
}));

// Passport session serialization (used by app.use(passport.session()))
// This is still needed even if session: false is used in authenticate,
// as passport.initialize() and passport.session() are active.
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