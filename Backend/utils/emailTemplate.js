const brandAccent = "#8b5cf6";
const brandAccentSoft = "rgba(139, 92, 246, 0.15)";
const bgColor = "#020617"; // deeper than slate
const cardColor = "rgba(15, 23, 42, 0.75)";
const borderColor = "rgba(148, 163, 184, 0.15)";
const textPrimary = "#e2e8f0";
const textSecondary = "#94a3b8";

const wrapLayout = (title, content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      background: radial-gradient(circle at top, #0f172a 0%, ${bgColor} 70%);
      margin: 0;
      padding: 50px 12px;
      font-family: 'Inter', -apple-system, sans-serif;
      color: ${textPrimary};
    }

    .wrapper {
      max-width: 520px;
      margin: 0 auto;
      background: ${cardColor};
      backdrop-filter: blur(14px);
      border-radius: 20px;
      padding: 42px 36px;
      border: 1px solid ${borderColor};
      box-shadow: 
        0 10px 30px rgba(0,0,0,0.6),
        inset 0 1px 0 rgba(255,255,255,0.04);
      position: relative;
      overflow: hidden;
    }

    /* subtle glow ring */
    .wrapper::before {
      content: "";
      position: absolute;
      inset: -1px;
      background: radial-gradient(circle at 20% 0%, ${brandAccentSoft}, transparent 40%);
      z-index: 0;
    }

    .content {
      position: relative;
      z-index: 1;
    }

    .logo {
      text-align: center;
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin-bottom: 28px;
    }

    .logo span {
      color: ${brandAccent};
    }

    h2 {
      font-size: 22px;
      font-weight: 700;
      text-align: center;
      margin: 0 0 12px;
    }

    p {
      color: ${textSecondary};
      line-height: 1.6;
      text-align: center;
      margin: 0 0 16px;
      font-size: 14px;
    }

    /* OTP block redesign */
    .otp-container {
      margin: 32px 0;
      padding: 18px;
      border-radius: 14px;
      background: linear-gradient(
        135deg,
        rgba(255,255,255,0.04),
        rgba(255,255,255,0.02)
      );
      border: 1px dashed rgba(148,163,184,0.25);
      text-align: center;
    }

    .otp-code {
      font-size: 36px;
      font-weight: 800;
      letter-spacing: 12px;
      color: #fff;
      text-shadow: 0 0 12px ${brandAccentSoft};
    }

    /* CTA button */
    .btn {
      display: inline-block;
      padding: 14px 28px;
      border-radius: 10px;
      font-weight: 600;
      text-decoration: none;
      background: ${brandAccent};
      color: #fff !important;
      box-shadow: 0 6px 20px rgba(139,92,246,0.35);
    }

    .btn:hover {
      opacity: 0.9;
    }

    .footer {
      margin-top: 28px;
      text-align: center;
      font-size: 12px;
      color: ${textSecondary};
      opacity: 0.8;
    }

    .divider {
      height: 1px;
      background: rgba(148,163,184,0.15);
      margin: 24px 0;
    }
  </style>
</head>

<body>
  <div class="wrapper">
    <div class="content">
      <div class="logo">BLOG<span>.OS</span></div>
      ${content}
      <div class="footer">
        This is an automated secure message.<br/>
        Do not share your code with anyone.
      </div>
    </div>
  </div>
</body>
</html>
`;

const emailTemplates = {
  // 1. Verification & Resend OTP
  verificationOTP: (otp) => ({
    subject: "🔐 Your Verification Code",
    html: wrapLayout(
      "Verify Account",
      `
      <h2>Security Check</h2>
      <p>Almost there! Use the secure code below to verify your email address and unlock your profile.</p>
      <div class="otp-container">
        <div class="otp-code">${otp}</div>
      </div>
      <p style="font-size: 13px;">This code expires in 10 minutes. <br/> For security, never share this code with anyone.</p>
    `,
    ),
  }),

  // 2. Welcome Email
  welcome: (username) => ({
    subject: "🚀 Welcome to the future of blogging!",
    html: wrapLayout(
      "Welcome",
      `
      <h2>Welcome, ${username}!</h2>
      <p>Your account is now fully active. You've joined a community of thinkers, creators, and builders.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.FRONTEND_URL}/login" class="btn">Launch Dashboard</a>
      </div>
      <p>Check out the trending tags to start your first story.</p>
    `,
    ),
  }),

  // 3. Password Reset OTP
  passwordResetOTP: (otp) => ({
    subject: "🔑 Reset Your Password",
    html: wrapLayout(
      "Reset Password",
      `
      <h2>Identity Verification</h2>
      <p>We received a request to reset your password. Enter the code below to set a new one:</p>
      <div class="otp-container">
        <div class="otp-code">${otp}</div>
      </div>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
    ),
  }),

  // 4. Change Password OTP
  changePasswordOTP: (otp) => ({
    subject: "🛡️ Secure Password Change",
    html: wrapLayout(
      "Change Password",
      `
      <h2>Changing Password?</h2>
      <p>Confirm your identity to update your security credentials. Use this authorization code:</p>
      <div class="otp-container">
        <div class="otp-code">${otp}</div>
      </div>
      <p style="color: #ef4444;">Warning: If this wasn't you, please change your login email immediately.</p>
    `,
    ),
  }),
};

module.exports = emailTemplates;
