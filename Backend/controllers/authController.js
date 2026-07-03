const { AppError } = require("../utils/errorUtils");
const catchAsync = require("../utils/catchAsync");
const UserVerify = require("../models/userVerificationModel");
const User = require("../models/userModel");
const UserDetail = require("../models/userDetail");
const Subscription = require("../models/subscriptionModel");
const { generateOTP } = require("../utils/otpGenerator");
const emailTemplates = require("../utils/emailTemplate");
const bcrypt = require("bcryptjs");
const { mailSend } = require("../utils/mail");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../utils/jwt");
const passport = require("passport");
const UAParser = require("ua-parser-js");

exports.signup = catchAsync(async (req, res) => {
  let { username, email, password } = req.body;

  // 1. Basic validation
  if (!email || !username || !password) {
    return res.status(400).json({
      success: false,
      data: false,
      message: "Missing Fields",
    });
  }

  // 2. Normalize once
  email = email.trim().toLowerCase();
  username = username.trim().toLowerCase();

  // (optional) minimal password policy
  if (password.length < 6) {
    return res.status(400).json({
      success: false,
      data: false,
      message: "Password must be at least 6 characters",
    });
  }

  const condition = {
    $or: [{ email }, { username }],
  };

  // 3. Check existing verified user
  const existingUser = await User.findOne(condition);

  if (existingUser) {
    if (existingUser.email === email) {
      if (
        existingUser.authProviders?.includes("google") &&
        !existingUser.authProviders?.includes("local")
      ) {
        return res.status(409).json({
          success: false,
          data: false,
          message:
            "This email is registered with Google. Please login using Google.",
        });
      }

      return res.status(409).json({
        success: false,
        data: false,
        message: "Email is already registered. Please login.",
      });
    }

    return res.status(409).json({
      success: false,
      data: false,
      message: "Username is already taken",
    });
  }

  // 4. Upsert pending verification (instead of blocking)
  const otp = generateOTP(6);

  let verifyDoc = await UserVerify.findOne({ email });
  if (verifyDoc) {
    verifyDoc.username = username;
    verifyDoc.password = hashedPassword;
    verifyDoc.otp = {
      code: otp, // ← plain, hook will hash it
      type: "email_verification",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      attempts: 0,
    };
  } else {
    verifyDoc = new UserVerify({
      username,
      email,
      password,
      otp: {
        code: otp,
        type: "email_verification",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        attempts: 0,
      },
    });
  }
  await verifyDoc.save();

  // 5. Send OTP
  const mail = emailTemplates.verificationOTP(otp);
  mailSend(email, mail.subject, mail.html);

  return res.status(201).json({
    success: true,
    data: email,
    message: "An OTP has been sent for verification.",
  });
});

exports.verifyAndCreateUser = catchAsync(async (req, res) => {
  console.log("verifyAndCreateUser called with body:", req.body);
  const { email, otp } = req.body;

  const verify = await UserVerify.findOne({
    email: email.toLowerCase(),
    "otp.type": "email_verification",
  });
  if (!verify) {
    return res.status(404).json({
      success: false,
      data: false,
      message: "User does not exist",
    });
  }

  if (verify.otp.expiresAt < Date.now()) {
    return res.status(400).json({
      success: false,
      data: false,
      message: "OTP expired. Please register again",
    });
  }

  if (verify.otp.attempts >= 5) {
    await UserVerify.deleteOne({ _id: verify._id });
    return res.status(403).json({
      success: false,
      message: "Max attempts reached. Please register again.",
    });
  }

  const isMatch = await verify.compareOTP(otp);
  console.log("Input OTP:", otp);
  console.log("Stored hash:", verify.otp.code);
  console.log("Match result:", isMatch);

  if (!isMatch) {
    verify.otp.attempts += 1;
    await verify.save();
    return res.status(400).json({
      success: false,
      data: false,
      message: "Invalid OTP",
      attemptsLeft: 5 - verify.otp.attempts,
    });
  }

  //  5. DOUBLE CHECK (race condition protection)
  const existingUser = await User.findOne({
    $or: [{ email: verify.email }, { username: verify.username }],
  });

  if (existingUser) {
    await UserVerify.deleteOne({ _id: verify._id });

    return res.status(409).json({
      success: false,
      message: "Account already exists. Please login.",
    });
  }

  // 6. Create user (IMPORTANT CHANGE HERE)
  const user = await User.create({
    username: verify.username,
    email: verify.email,
    password: verify.password,
    isAccountVerified: true,
    authProviders: ["local"],
  });

  await UserDetail.create({
    userId: user._id,
  });

  const mail = emailTemplates.welcome(verify.username);
  mailSend(email, mail.subject, mail.html);

  await UserVerify.deleteOne({ _id: verify._id });

  res.status(201).json({
    success: true,
    message: "Account verified and created. Please login.",
    data: {
      userId: user._id,
      username: user.username,
      email: user.email,
    },
  });
});

exports.login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Invalid Credentials",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    const isInVerifyTable = await UserVerify.findOne({
      email: normalizedEmail,
    });
    if (isInVerifyTable) {
      console.log("[Login 403] Unverified account:", normalizedEmail);
      return res.status(403).json({
        success: false,
        message:
          "Account not verified. Please check your email to complete signup.",
      });
    }
    console.log("[Login 401] User not found:", normalizedEmail);
    return res.status(401).json({
      success: false,
      message: "Invalid Credentials",
    });
  }

  if (!user.authProviders || !user.authProviders.includes("local")) {
    console.log(
      "[Login 401] Google account tried local login:",
      normalizedEmail,
    );
    return res.status(401).json({
      success: false,
      data: false,
      message: "This account uses Google sign-in. Please login with Google.",
    });
  }

  if (!user.isAccountVerified) {
    const pendingVerification = await UserVerify.findOne({
      email: normalizedEmail,
    });
    if (pendingVerification) {
      console.log("[Login 403] Not verified, pending exists:", normalizedEmail);
      return res.status(403).json({
        success: false,
        data: false,
        message:
          "Email not verified. Please verify your email before logging in.",
      });
    } else {
      console.log("[Login 403] Not verified, resending OTP:", normalizedEmail);
      const newOtp = generateOTP(6);
      await UserVerify.create({
        email: normalizedEmail,
        username: user.username,
        password: user.password,
        otp: {
          code: newOtp,
          type: "email_verification",
          expiresAt: new Date(Date.now() + 10 * 60 * 1000),
          attempts: 0,
        },
      });
      const mail = emailTemplates.verificationOTP(newOtp);
      mailSend(normalizedEmail, mail.subject, mail.html);
      return res.status(403).json({
        success: false,
        data: false,
        message:
          "Verification record expired. A new secure code has been sent to your email.",
      });
    }
  }

  const isMatch = await user.comparePassword(password);
  console.log("[Login] Password match:", isMatch, "for:", normalizedEmail);
  if (!isMatch) {
    console.log("[Login 401] Password mismatch:", normalizedEmail);
    return res.status(401).json({
      success: false,
      data: false,
      message: "Invalid Credentials",
    });
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  const deviceInfo = req.headers["user-agent"] || "Unknown Device";
  const ipAddress = req.ip;

  await User.findByIdAndUpdate(user._id, {
    $pull: { refreshTokens: { deviceInfo: deviceInfo } },
  });
  await user.addRefreshToken(refreshToken, deviceInfo, ipAddress);

  const activeSubscription = await Subscription.findOne({
    userId: user._id,
    status: { $in: ["active", "cancelled"] },
  }).lean();

  res.status(200).json({
    success: true,
    data: {
      accessToken,
      refreshToken,
      user: {
        _id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        isAccountVerified: user.isAccountVerified,
        hasPlan: !!activeSubscription,
      },
    },
    message: "Login Successful",
  });
});

exports.resendOtp = catchAsync(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res
      .status(400)
      .json({ success: false, message: "Email is required" });
  }

  const normalizedEmail = email.toLowerCase();

  // Ensure they aren't already verified
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser?.isAccountVerified) {
    return res.status(400).json({
      success: false,
      message: "This account is already verified. Please login.",
    });
  }

  const newOtp = generateOTP(6);

  let pendingUser = await UserVerify.findOne({ email: normalizedEmail });
  if (pendingUser) {
    pendingUser.otp = {
      code: newOtp,
      type: "email_verification",
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      attempts: 0,
    };
    await pendingUser.save();
  } else {
    await UserVerify.create({
      email: normalizedEmail,
      otp: {
        code: newOtp,
        type: "email_verification",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        attempts: 0,
      },
    });
  }
  // Send the Editorial Template
  const mail = emailTemplates.verificationOTP(newOtp);
  mailSend(normalizedEmail, mail.subject, mail.html);

  return res.status(200).json({
    success: true,
    message: "A new secure code has been sent to your email.",
  });
});

exports.forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({
      success: false,
      data: false,
      message: "Missing Fields",
    });
  }
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !user.isAccountVerified) {
    return res.status(400).json({
      success: false,
      data: false,
      message: "Email does not exist",
    });
  }
  const forgotOtp = generateOTP(6);

  let reqUser = await UserVerify.findOne({
    email: user.email,
    "otp.type": "password_reset",
  });
  if (reqUser) {
    reqUser.otp.code = forgotOtp;
    reqUser.otp.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    reqUser.otp.attempts = 0;
    reqUser.markModified("otp"); // ← add this
  } else {
    reqUser = new UserVerify({
      username: user.username,
      email: user.email,
      otp: {
        code: forgotOtp,
        type: "password_reset",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        attempts: 0,
      },
    });
  }

  await reqUser.save();

  const mail = emailTemplates.passwordResetOTP(forgotOtp);
  await mailSend(reqUser.email, mail.subject, mail.html);

  res.status(200).json({
    success: true,
    message: "If email exists, OTP will be sent",
  });
});

exports.resetPassword = catchAsync(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) {
    return res.status(400).json({
      success: false,
      data: false,
      message: "Missing Fields",
    });
  }
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !user.isAccountVerified) {
    return res.status(400).json({
      success: false,
      data: false,
      message: "Account not verified",
    });
  }

  const verify = await UserVerify.findOne({
    email: email.toLowerCase(),
    "otp.type": "password_reset",
  });
  if (!verify) {
    return res.status(400).json({
      success: false,
      data: false,
      message: "No User Found",
    });
  }

  if (verify.otp.expiresAt < Date.now()) {
    await UserVerify.deleteOne({ _id: verify._id });
    return res.status(400).json({
      success: false,
      message: "OTP expired",
    });
  }

  if (verify.otp.attempts >= 5) {
    await UserVerify.deleteOne({ _id: verify._id });
    return res.status(403).json({
      success: false,
      message: "Max attempts reached",
    });
  }
  const isMatch = await verify.compareOTP(otp);
  if (!isMatch) {
    verify.otp.attempts += 1;
    await verify.save();
    return res.status(400).json({
      success: false,
      message: "Invalid OTP",
      attemptsLeft: 5 - verify.otp.attempts,
    });
  }

  user.password = newPassword;
  await user.save();

  await UserVerify.deleteOne({ _id: verify._id });

  res.status(200).json({
    success: true,
    message: "Password reset successful. Please login.",
  });
});

exports.changePasswordReq = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  const otp = generateOTP(6);

  let verify = await UserVerify.findOne({
    email: user.email,
    "otp.type": "change_password",
  });

  if (verify) {
    verify.otp.code = otp;
    verify.otp.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    verify.otp.attempts = 0;
    await verify.save();
  } else {
    await UserVerify.create({
      username: user.username,
      email: user.email,
      otp: {
        code: otp,
        type: "change_password",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        attempts: 0,
      },
    });
  }

  const mail = emailTemplates.changePasswordOTP(otp);
  await mailSend(user.email, mail.subject, mail.html);

  return res.status(200).json({
    success: true,
    message: "OTP sent for password change",
  });
});

exports.changePassword = catchAsync(async (req, res) => {
  const userId = req.user._id;
  const { otp, oldPassword, newPassword, confirmPassword } = req.body;

  const user = await User.findById(userId);
  if (!user || !user.isAccountVerified) {
    return res
      .status(404)
      .json({ success: false, message: "User not found or unverified" });
  }

  const email = user.email;

  if (!otp || !oldPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ success: false, message: "Missing Fields" });
  }

  if (newPassword !== confirmPassword) {
    return res
      .status(400)
      .json({ success: false, message: "Passwords do not match" });
  }

  if (oldPassword === newPassword) {
    return res.status(400).json({
      success: false,
      message: "New password cannot be the same as old",
    });
  }

  const isOldMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isOldMatch) {
    return res
      .status(400)
      .json({ success: false, message: "Incorrect current password" });
  }

  // Temporarily try searching ONLY by email to see if the document exists at all
  const allVerifyDocs = await UserVerify.find({ email: email.toLowerCase() });
  const verify = await UserVerify.findOne({
    email: email.toLowerCase(),
    "otp.type": "change_password",
  });

  if (!verify) {
    return res
      .status(400)
      .json({ success: false, message: "No OTP request found" });
  }

  if (verify.otp.expiresAt < Date.now()) {
    await UserVerify.deleteOne({ _id: verify._id });
    return res.status(400).json({ success: false, message: "OTP expired" });
  }

  if (verify.otp.attempts >= 5) {
    await UserVerify.deleteOne({ _id: verify._id });
    return res
      .status(403)
      .json({ success: false, message: "Max attempts reached" });
  }

  const isMatch = await verify.compareOTP(otp);
  if (!isMatch) {
    verify.otp.attempts += 1;
    await verify.save();
    return res.status(400).json({
      success: false,
      message: "Invalid OTP",
      attemptsLeft: 5 - verify.otp.attempts,
    });
  }

  user.password = newPassword;
  await user.save();

  await UserVerify.deleteOne({ _id: verify._id });

  await mailSend(user.email, "passwordChangedSuccess");

  return res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
});

exports.refresh = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      data: false,
      message: "Invalid Token",
    });
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (error) {
    console.error("error in refreh token", error.message);
    return res.status(401).json({
      success: false,
      data: false,
      message: "Refresh token expired or invalid. Please login again.",
    });
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    return res.status(401).json({
      success: false,
      data: false,
      message: "User no longer exists",
    });
  }
  if (!user.hasRefreshToken(refreshToken)) {
    return res.status(401).json({
      success: false,
      data: false,
      message: "Session revoked. Please login again.",
    });
  }

  // exports.refresh update
  const deviceInfo = req.headers["user-agent"] || "Unknown Device";
  const ipAddress = req.ip;

  // CHANGE THIS: Instead of just user.removeRefreshToken(refreshToken)
  // Use an atomic update to wipe the device sessions and add the new one
  await User.findByIdAndUpdate(user._id, {
    $pull: { refreshTokens: { deviceInfo: deviceInfo } },
  });

  const newRefreshToken = generateRefreshToken(user);
  const newAccessToken = generateAccessToken(user);

  // Add the rotated token
  await user.addRefreshToken(newRefreshToken, deviceInfo, ipAddress);
  // 5. Send both back
  res.status(200).json({
    success: true,
    data: {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    },
    message: "Token refreshed",
  });
});

exports.logout = catchAsync(async (req, res) => {
  const { refreshToken, allDevices } = req.body;

  if (!allDevices && !refreshToken) {
    return res.status(400).json({
      success: false,
      data: false,
      message: "No refresh token provided",
    });
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({
      success: false,
      data: false,
      message: "User not found",
    });
  }

  if (allDevices) {
    await user.removeAllRefreshTokens();
  } else {
    await user.removeRefreshToken(refreshToken);
  }
  res.status(200).json({
    success: true,
    message: allDevices
      ? "Logged out from all devices"
      : "Logged out successfully",
  });
});

// Step 1 — redirect to Google
exports.googleAuth = passport.authenticate("google", {
  scope: ["profile", "email"],
});

// Step 2 — Google redirects back here

exports.googleCallback = (req, res, next) => {
  passport.authenticate(
    "google",
    {
      session: false,
      failureRedirect: `${process.env.CLIENT_URL}/login?error=google_failed`,
    },
    async (error, user) => {
      try {
        if (error || !user) {
          console.log("No user or error:", error);
          return res.send(`
  <script>
    window.opener.postMessage({ error: "google_failed" }, "${process.env.CLIENT_URL}");
    window.close();
  </script>
`);
        }
        console.log("user found:", user._id);

        const accessToken = generateAccessToken(user);
        console.log("accessToken generated");

        const refreshToken = generateRefreshToken(user);
        console.log("refreshToken generated");

        const parser = new UAParser(req.headers["user-agent"]);
        const deviceInfo = `${parser.getBrowser().name} - ${parser.getOS().name}`;
        const ipAddress =
          req.headers["x-forwarded-for"]?.split(",")[0] ||
          req.socket.remoteAddress;

        // Clear any existing Google or Local sessions for this device
        await User.findByIdAndUpdate(user._id, {
          $pull: { refreshTokens: { deviceInfo: deviceInfo } },
        });

        await user.addRefreshToken(refreshToken, deviceInfo, ipAddress);
        console.log("refresh token saved");

        /* // Redirect to frontend with both tokens in query params
        res.redirect(
          `${process.env.CLIENT_URL}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`,
        ); */

        const payload = JSON.stringify({
          accessToken,
          refreshToken,
        });

        res.send(`
  <script>
    if (window.opener) {
      window.opener.postMessage(${payload}, "${process.env.CLIENT_URL}");
      window.close();
    } else {
      window.location.href = "${process.env.CLIENT_URL}/auth/callback";
    }
  </script>
`);
      } catch (error) {
        console.error("Wavelog Google Callback Error:", error.message);
        res.redirect(`${process.env.CLIENT_URL}/login?error=server_error`);
      }
    },
  )(req, res, next);
};
