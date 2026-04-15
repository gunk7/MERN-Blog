const UserVerify = require("../models/userVerificationModel");
const User = require("../models/userModel");
const { generateOTP } = require("../utils/otpGenerator");
const emailTemplates = require("../utils/emailTemplate");
const { mailSend } = require("../utils/mail");
const { generateToken } = require("../utils/jwt");

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

    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() },
      ],
    });
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

    const pendingUser = await UserVerify.findOne({ email });
    if (pendingUser) {
      return res.status(409).json({
        success: false,
        data: false,
        message: "Email Already Registered ",
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
    await mailSend(email, mail.subject, mail.html);

    return res.status(200).json({
      success: true,
      data: email,
      message: "An OTP has been sent for verficaiton. ",
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

    const verify = await UserVerify.findOne({ email });
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
      await UserVerify.deleteOne({ email });
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

    const mail = emailTemplates.welcome(username);
    await mailSend(email, mail.subject, mail.html);

    if (user) {
      await UserVerify.deleteOne({ email: verify.email });
    }
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
      message: "Somthing Went wrong while Account Creation",
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        data: false,
        message: "Invalid email or password",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        data: false,
        message: "User doesn't exists",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        data: false,
        message: "Invalid email or password",
      });
    }

    if (!user.isAccountVerified) {
      return res.status(403).json({
        success: false,
        data: false,
        message: "User's email has not being Verified",
      });
    }

    const token = generateToken(user);
    res.status(200).json({
      success: true,
      data: token,
      message: "Login Successful",
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({
      success: false,
      data: false,
      message: "Login Unsuccessful",
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

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "This account is already verified. Please login.",
      });
    }

    const pendingUser = await UserVerify.findOne({
      email: email.toLowerCase(),
    });
    if (!pendingUser) {
      return res.status(404).json({
        success: false,
        message: "No registration in progress. Please sign up first.",
      });
    }

    const newOtp = generateOTP(6);
    pendingUser.otp.code = newOtp;
    pendingUser.otp.type = "resend_new_otp";
    pendingUser.otp.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    pendingUser.otp.attempts = 0;

    await pendingUser.save();

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
