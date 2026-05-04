const brandPrimary = "#6a5188"; // --color-primary
const brandSurface = "#faf9ff"; // --color-surface
const brandText = "#261e35"; // --color-on-surface
const brandTextSecondary = "#6b637a"; // --color-on-surface-variant
const brandBorder = "rgba(106, 81, 136, 0.1)"; // primary/10

const wrapLayout = (title, content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      background-color: ${brandSurface};
      margin: 0;
      padding: 40px 15px;
      font-family: "Times New Roman", Times, serif;
      color: ${brandText};
      -webkit-font-smoothing: antialiased;
    }

    .wrapper {
      max-width: 500px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 32px;
      padding: 48px 40px;
      border: 1px solid rgba(0, 0, 0, 0.05);
      box-shadow: 0px 10px 30px rgba(106, 81, 136, 0.06);
    }

    .logo {
      text-align: center;
      font-size: 28px;
      font-weight: bold;
      letter-spacing: -0.02em;
      margin-bottom: 36px;
      color: ${brandPrimary};
      text-transform: lowercase;
    }

    .logo span {
      font-style: italic;
      color: ${brandText};
    }

    h2 {
      font-size: 24px;
      font-weight: 700;
      text-align: center;
      margin: 0 0 16px;
      color: ${brandText};
    }

    p {
      color: ${brandTextSecondary};
      line-height: 1.6;
      text-align: center;
      margin: 0 0 20px;
      font-size: 16px;
    }

    .otp-grid {
      display: flex;
      justify-content: center;
      gap: 8px;
      margin: 32px 0;
    }

    .otp-box {
      width: 45px;
      height: 55px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: ${brandSurface};
      border: 1px solid ${brandBorder};
      border-radius: 12px;
      font-size: 24px;
      font-weight: bold;
      color: ${brandPrimary};
    }

    .btn {
      display: block;
      text-align: center;
      padding: 16px 32px;
      border-radius: 50px;
      font-weight: bold;
      text-decoration: none;
      background: ${brandPrimary};
      color: #ffffff !important;
      margin: 30px auto;
      max-width: 200px;
    }

    .checkmark-circle {
      width: 60px;
      height: 60px;
      background-color: #f3ebff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      color: ${brandPrimary};
      font-size: 30px;
    }

    .footer {
      margin-top: 40px;
      padding-top: 24px;
      border-top: 1px solid ${brandSurface};
      text-align: center;
      font-size: 13px;
      color: ${brandTextSecondary};
      font-style: italic;
    }
  </style>
</head>

<body>
  <div class="wrapper">
    <div class="logo">wave<span>log</span></div>
    ${content}
    <div class="footer">
      Sent securely by Wavelog Editorial Team.<br/>
      Please do not reply to this automated email.
    </div>
  </div>
</body>
</html>
`;

const renderOTPBoxes = (otp) => {
  const digits = otp.toString().split('');
  return `
    <div class="otp-grid">
      ${digits.map(digit => `<div class="otp-box">${digit}</div>`).join('')}
    </div>
  `;
};

const emailTemplates = {
  // 1. Verification & Resend OTP
  verificationOTP: (otp) => ({
    subject: "🔐 Verify your Wavelog account",
    html: wrapLayout(
      "Verify Account",
      `
      <h2>Welcome to the journal.</h2>
      <p>Before you begin your first draft, please verify your identity using the authorization code below.</p>
      ${renderOTPBoxes(otp)}
      <p style="font-size: 14px;">This code is valid for 10 minutes.</p>
    `,
    ),
  }),

  // 2. Verification Success (Account Fully Activated)
  verificationSuccess: (username) => ({
    subject: "✅ Identity Confirmed | Wavelog",
    html: wrapLayout(
      "Verification Success",
      `
      <div class="checkmark-circle">✓</div>
      <h2>Identity Confirmed.</h2>
      <p>Thank you, ${username}. Your email address has been successfully verified. Your editorial space is now fully active.</p>
      <a href="${process.env.FRONTEND_URL}/login" class="btn">Start Writing</a>
      <p style="font-size: 14px;">You can now access your dashboard and start sharing your stories with the world.</p>
    `,
    ),
  }),

  // 3. Welcome Email
  welcome: (username) => ({
    subject: "🚀 The journey begins on Wavelog",
    html: wrapLayout(
      "Welcome",
      `
      <h2>Greetings, ${username}.</h2>
      <p>Your space is ready. Wavelog is where your stories find their rhythm and your ideas find their home.</p>
      <a href="${process.env.FRONTEND_URL}/login" class="btn">Enter Workspace</a>
      <p>We look forward to seeing what you create.</p>
    `,
    ),
  }),

  // 4. Password Reset OTP
  passwordResetOTP: (otp) => ({
    subject: "🔑 Reset your Wavelog access",
    html: wrapLayout(
      "Reset Password",
      `
      <h2>Account Recovery</h2>
      <p>A password reset was requested. Use the individual digits below to authorize the change:</p>
      ${renderOTPBoxes(otp)}
      <p>If you did not request this, please secure your account immediately.</p>
    `,
    ),
  }),

  // 5. Change Password OTP
  changePasswordOTP: (otp) => ({
    subject: "🛡️ Security Alert: Password Update",
    html: wrapLayout(
      "Change Password",
      `
      <h2>Confirm Security Change</h2>
      <p>To finalize your password update, please enter the following code:</p>
      ${renderOTPBoxes(otp)}
      <p style="color: #b91c1c;">Warning: Only enter this code if you are currently on the Wavelog settings page.</p>
    `,
    ),
  }),
};

module.exports = emailTemplates;