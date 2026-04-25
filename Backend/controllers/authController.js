const UserVerify = require("../models/userVerificationModel");
const User = require("../models/userModel");
const { generateOTP } = require("../utils/otpGenerator");
const emailTemplates = require("../utils/emailTemplate");
const { mailSend } = require("../utils/mail");
const { generateToken } = require("../utils/jwt");
const bcrypt = require("bcryptjs");

exports.signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!email || !username || !password) {
      return res.status(400).json({
        success: false,
        data: false,
        message: "Missing Fields",
      });
    }

    const condition = {
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() },
      ],
    };

    const existingUser = await User.findOne(condition);
    if (existingUser) {
      const message =
        existingUser.email === email.toLowerCase()
          ? "Email is already verified and registered. Please login"
          : "Username is already taken";
      return res.status(409).json({
        success: false,
        data: false,
        message,
      });
    }

    const pendingUser = await UserVerify.findOne(condition);
    if (pendingUser) {
      const message =
        pendingUser.email === email.toLowerCase()
          ? "Verification OTP already sent to this email."
          : "This username is currently awaiting verification by another user.";

      return res.status(409).json({
        success: false,
        data: false,
        message,
      });
    }
    const otp = generateOTP(6);
    await UserVerify.create({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      otp: {
        code: otp,
        type: "email_verification",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        attempts: 0,
      },
    });

    const mail = emailTemplates.verificationOTP(otp);
     mailSend(email, mail.subject, mail.html);

    return res.status(200).json({
      success: true,
      data: email,
      message: "An OTP has been sent for verrficaiton. ",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      data: false,
      message: "Something Went Wrong while registration",
    });
  }
};

exports.verifyAndCreateUser = async (req, res) => {
  try {
    const { email, otp } = req.body;
    console.log(req.body);

    const verify = await UserVerify.findOne({
      email: email.toLowerCase(),
      "otp.type": "email_verification",
    });
    console.log("Data from verify collection:", verify);
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

    const user = await User.create({
      username: verify.username,
      email: verify.email,
      password: verify.password,
      isAccountVerified: true,
    });

    const mail = emailTemplates.welcome(verify.username);
    await mailSend(email, mail.subject, mail.html);

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
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      success: false,
      data: false,
      message: "Something Went wrong while Account Creation",
    });
  }
};

exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }
    const resendCondition = {
      email: email.toLowerCase(),
      "otp.type": "email_verification",
    };
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "This account is already verified. Please login.",
      });
    }

    const pendingUser = await UserVerify.findOne(resendCondition);
    if (!pendingUser) {
      return res.status(404).json({
        success: false,
        message: "No registration in progress. Please sign up first.",
      });
    }

    const newOtp = generateOTP(6);
    pendingUser.otp.code = newOtp;
    pendingUser.otp.type = "email_verification";
    pendingUser.otp.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    pendingUser.otp.attempts = 0;

    await pendingUser.save();
console.log(pendingUser)
    const mail = emailTemplates.verificationOTP(newOtp);
    await mailSend(email, mail.subject, mail.html);

    return res.status(200).json({
      success: true,
      message: "A new OTP has been sent to your email.",
    });
  } catch (error) {
    console.error("Resend OTP Error:", error);
    res.status(500).json({
      success: false,
      data: false,
      message: "Internal Server Error",
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.toLowerCase();

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Invalid Credentials",
      });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      const isInVerifyTable = await UserVerify.findOne({ email: normalizedEmail });
      
      if (isInVerifyTable) {
        return res.status(403).json({
          success: false,
          message: "Account not verified. Please check your email to complete signup.",
        });
      }

      return res.status(401).json({
        success: false,
        message: "Invalid Credentials",
      });
    }

    if (!user.isAccountVerified) {
      const pendingVerification = await UserVerify.findOne({ email: normalizedEmail });

      if (pendingVerification) {
        return res.status(403).json({
          success: false,
          message: "Email not verified. Please verify your email before logging in.",
        });
      } else {
        return res.status(403).json({
          success: false,
          message: "Verification record expired. Please register again.",
        });
      }
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid Credentials",
      });
    }

    const token = generateToken(user);
    res.status(200).json({
      success: true,
      data: { token, user },
      message: "Login Successful",
    });

  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Login Unsuccessful",
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
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
  } catch (error) {
    console.log("Forgot Password error:", error.message);
    res.status(500).json({
      success: false,
      data: false,
      message: "Something went wrong",
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
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
  } catch (error) {
    console.error("Reset Password Error: ", error.message);
    res.status(500).json({
      success: false,
      data: false,
      message: "Reset Password Unsuccessful",
    });
  }
};

exports.changePasswordReq = async (req, res) => {
  try {
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
  } catch (error) {
    console.error("changePasswordReq Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Something Went Wrong",
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    console.log(req.body);
    const userId = req.user._id;
    console.log(userId);
    const { otp, oldPassword, newPassword, confirmPassword } = req.body;

    const user = await User.findById(userId);
    if (!user || !user.isAccountVerified) {
      return res
        .status(404)
        .json({ success: false, message: "User not found or unverified" });
    }

    const email = user.email;

    if (!otp || !oldPassword || !newPassword || !confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Missing Fields" });
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
    // Add these logs to debug
    console.log("Looking for email:", email.toLowerCase());
    console.log("Looking for type: change_password");

    // Temporarily try searching ONLY by email to see if the document exists at all
    const allVerifyDocs = await UserVerify.find({ email: email.toLowerCase() });
    console.log("All OTP docs for this email:", allVerifyDocs);
    const verify = await UserVerify.findOne({
      email: email.toLowerCase(),
      "otp.type": "change_password",
    });
    console.log(verify);

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
  } catch (error) {
    console.error("Change Password Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
