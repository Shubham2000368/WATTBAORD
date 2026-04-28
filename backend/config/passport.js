const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const Team = require('../models/Team');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const isWattMonkDomain = email.endsWith('@wattmonk.com');

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
        }

        // Automatic Team Assignment for @wattmonk.com domain
        if (isWattMonkDomain) {
          const teamName = 'WattMonk Team';
          let team = await Team.findOne({ name: teamName });

          if (!team) {
            // Find an admin to be the lead, otherwise use the current user
            const admin = await User.findOne({ role: 'admin' });
            const initialMembers = [{ user: user._id, role: 'member' }];

            if (admin && admin._id.toString() !== user._id.toString()) {
              initialMembers.push({ user: admin._id, role: 'admin' });
            }

            team = await Team.create({
              name: teamName,
              lead: admin ? admin._id : user._id,
              members: initialMembers,
              color: 'bg-indigo-600',
            });
          } else {
            // Add to existing team members if not already there
            const isMember = team.members.some(
              (m) => m.user && m.user.toString() === user._id.toString()
            );
            if (!isMember) {
              team.members.push({ user: user._id, role: 'member' });
              await team.save();
            }
          }

          // If user was in a DIFFERENT team before, remove them from there
          if (user.team && user.team.toString() !== team._id.toString()) {
            const oldTeam = await Team.findById(user.team);
            if (oldTeam) {
              oldTeam.members = oldTeam.members.filter(m => m.user && m.user.toString() !== user._id.toString());
              await oldTeam.save();
            }
          }

          // Update user document with team reference
          user.team = team._id;
          await user.save();
        }

        return done(null, user);
      } catch (err) {
        console.error('[Passport Google] Error:', err.message);
        return done(err, null);
      }
    }
  )
);

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
