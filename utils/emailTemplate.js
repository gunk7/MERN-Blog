const emailTemplates = {
  // OTP for Email Verification / Resend
  verificationOTP: (otp) => ({
    subject: "Verify Your Email - Blog Platform",
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #333; text-align: center;">Email Verification</h2>
        <p>Hello,</p>
        <p>Use the OTP below to verify your email:</p>
        <div style="text-align: center; padding: 30px;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #007bff; background: #f0f0f0; padding: 15px 25px; border-radius: 8px;">${otp}</span>
        </div>
        <p>This OTP expires in <strong>10 minutes</strong>.</p>
        <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">Blog Platform</p>
      </div>
    `,
  }),

  // Welcome (after successful verification)
  welcome: (username) => ({
    subject: "Welcome to Blog Platform!",
    html: `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #333; text-align: center;">Welcome, @${username}!</h2>
        <p>Your account is verified and ready.</p>
        <p>You can now create posts, follow writers, and subscribe to exclusive content.</p>
        <div style="text-align: center; padding: 20px;">
          <a href="${process.env.FRONTEND_URL}/login" style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Start Writing</a>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">Blog Platform</p>
      </div>
    `,
  }),
};

module.exports = emailTemplates;
