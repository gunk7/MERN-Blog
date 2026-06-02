const passport = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const User = require("../models/userModel");
const UserDetail = require("../models/userDetail");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // 1. Extract + normalize email
        const email = profile.emails?.[0]?.value?.trim().toLowerCase();
        if (!email) {
          return done(new Error("Google account has no email"), null);
        }

        // 2. Check existing Google-linked user
        let user = await User.findOne({ googleId: profile.id });
        if (user) return done(null, user);

        // 3. Check existing email user (ACCOUNT LINKING)
        user = await User.findOne({ email });

        if (user) {
          // Link Google provider safely
          if (!user.authProviders.includes("google")) {
            user.authProviders.push("google");
          }

          user.googleId = profile.id;
          user.isAccountVerified = true;

          await user.save();
          return done(null, user);
        }

        // 4. Create new user
        const baseUsername = email.split("@")[0].slice(0, 10);
        const randomSuffix = Math.floor(Math.random() * 10000);

        user = await User.create({
          googleId: profile.id,
          email,
          username: `${baseUsername}${randomSuffix}`,
          authProviders: ["google"],
          isAccountVerified: true,
        });

        const savedUser = await User.findById(user._id);
        await UserDetail.create({
          userId: user._id,
          firstName: profile.name.givenName || "",
          lastName: profile.name.familyName || "",
        });

        return done(null, user);
      } catch (error) {
        console.error("Passport error:", error.message);
        return done(error, null);
      }
    },
  ),
);

/* passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
}); */

module.exports = passport;
