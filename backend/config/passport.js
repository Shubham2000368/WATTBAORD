const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const Team = require('../models/Team');

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.NODE_ENV === 'production' 
          ? 'https://wattbaord.onrender.com/api/auth/google/callback'
          : '/api/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails[0].value;

          // Check if user already exists
          let user = await User.findOne({ email });

          if (!user) {
            // Create new user from Google profile
            user = await User.create({
              name: profile.displayName,
              email: email,
              avatar: profile.photos[0]?.value || '',
              password: `google_${profile.id}_${Date.now()}`, // Dummy password for OAuth users
              role: 'user',
            });

            // Automatic Team Assignment using utility
            const assignUserToTeam = require('../utils/teamAssignment');
            await assignUserToTeam(user);
          }

          return done(null, user);
        } catch (err) {
          console.error('[Passport Google] Error:', err.message);
          return done(err, null);
        }
      }
    )
  );
} else {
  console.warn('[Passport] Google Client ID/Secret not found. Google Login will be disabled locally.');
}

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
