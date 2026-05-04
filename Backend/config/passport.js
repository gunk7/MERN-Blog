const passport = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const User = require("../models/userModel");
const UserDetail = require("../models/userDetail");

console.log("Callback URL:", process.env.GOOGLE_CALLBACK_URL);
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("profile:", profile.id, profile.emails[0].value);

        const email = profile.emails[0].value.trim().toLowerCase();

        let user = await User.findOne({ googleId: profile.id });
        console.log("existing google user:", user);

        if (user) return done(null, user);

        const found = await User.findOne({ email: "gunukaur2807@gmail.com" });
        console.log("hardcoded query:", found);
        console.log("User model collection:", User.collection.name);
        console.log("Total users:", await User.countDocuments());
        const allUsers = await User.find({}).select("email googleId").lean();
        console.log("All users:", JSON.stringify(allUsers));
        if (user) {
          user.googleId = profile.id;
          user.authProvider = "google";
          user.isAccountVerified = true;
          await user.save();
          return done(null, user);
        }

        user = await User.create({
          googleId: profile.id,
          email,
          username: email.split("@")[0].slice(0, 12),
          authProvider: "google",
          isAccountVerified: true,
        });
        const savedUser = await User.findById(user._id);
        console.log("saved user fetched:", savedUser);
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

passport.serializeUser((user, done) => {
  done(null, user._id);
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
