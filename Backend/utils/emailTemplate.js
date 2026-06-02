const brand = {
  primary: "#6a5188",
  primaryContainer: "#8e74ae",
  primaryFixed: "#f3ebff",

  surface: "#faf9ff",
  surfaceLow: "#f6f2ff",
  surfaceHigh: "#f0eaff",
  surfaceHighest: "#e9e2f8",

  text: "#261e35",
  textSecondary: "#6b637a",

  success: "#16a34a",
  danger: "#b91c1c",

  border: "#ece7f4",

  shadow:
    "0px 10px 30px rgba(106,81,136,0.06), 0px 4px 12px rgba(106,81,136,0.03)",
};

const wrapLayout = ({ headerContent, bodyContent }) => `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
/>

<title>Wavelog</title>

<style>
  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    padding: 32px 16px;
    background: ${brand.surface};
    font-family: "Times New Roman", Times, serif;
    color: ${brand.text};
    -webkit-font-smoothing: antialiased;
  }

  table {
    border-spacing: 0;
    border-collapse: collapse;
  }

  .container {
    width: 100%;
    max-width: 620px;
    margin: 0 auto;
  }

  .main-card {
    background: #ffffff;
    border-radius: 36px;
    border: 1px solid ${brand.border};
    box-shadow: ${brand.shadow};
    overflow: hidden;
  }

  .hero {
    padding: 52px 42px 24px;
    text-align: center;
    background: linear-gradient(
      180deg,
      #ffffff 0%,
      ${brand.surfaceLow} 100%
    );
  }

  .logo-wrap {
    text-align: center;
    margin-bottom: 28px;
  }

  .logo {
    display: inline-block;
    padding: 12px 24px;
    background: ${brand.primaryFixed};
    border-radius: 999px;
    border: 1px solid ${brand.border};

    font-size: 28px;
    font-weight: bold;
    letter-spacing: -0.02em;
    color: ${brand.primary};
  }

  .logo span {
    color: ${brand.text};
    font-style: italic;
  }

  h1 {
    margin: 0 0 18px;
    font-size: 34px;
    line-height: 1.15;
    color: ${brand.text};
    letter-spacing: -0.03em;
  }

  .subtitle {
    margin: 0 auto;
    max-width: 460px;

    font-size: 17px;
    line-height: 1.8;
    color: ${brand.textSecondary};
  }

  .content {
    padding: 10px 42px 50px;
  }

  .section-card {
    background: ${brand.surfaceLow};

    border: 1px solid ${brand.border};
    border-radius: 30px;

    padding: 32px 28px;
  }

  .otp-wrapper {
    margin-top: 10px;
    margin-bottom: 8px;
  }

  .otp-grid {
    width: 100%;
    table-layout: fixed;
  }

  .otp-grid td {
    padding: 0 6px;
  }

  .otp-box {
    height: 68px;
    background: #ffffff;
    border: 1px solid ${brand.border};

    border-radius: 22px;

    text-align: center;
    vertical-align: middle;

    font-size: 28px;
    font-weight: bold;
    color: ${brand.primary};

    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.9),
      0 4px 10px rgba(106,81,136,0.04);
  }

  .helper {
    margin-top: 18px;
    text-align: center;
    color: ${brand.textSecondary};
    font-size: 14px;
    line-height: 1.7;
  }

  .btn-wrap {
    text-align: center;
    margin-top: 34px;
  }

  .btn {
    display: inline-block;

    width: 100%;
    max-width: 220px;

    background: ${brand.primary};

    color: #ffffff !important;
    text-decoration: none;

    padding: 16px 34px;
    border-radius: 999px;

    font-size: 16px;
    font-weight: bold;

    box-shadow:
      0 10px 24px rgba(106,81,136,0.18);
  }

  .icon-circle {
    width: 78px;
    height: 78px;

    border-radius: 50%;

    background: ${brand.primaryFixed};

    border: 1px solid ${brand.border};

    text-align: center;
    line-height: 78px;

    font-size: 34px;
    color: ${brand.primary};

    margin: 0 auto 24px;

    box-shadow:
      0 10px 20px rgba(106,81,136,0.08);
  }

  .warning-box {
    margin-top: 24px;

    padding: 18px 20px;

    background: #fff5f5;

    border: 1px solid #f5c2c7;

    border-radius: 20px;

    color: ${brand.danger};

    font-size: 14px;
    line-height: 1.7;
  }

  .footer {
    padding: 32px 30px 40px;

    text-align: center;

    color: ${brand.textSecondary};
    font-size: 13px;
    line-height: 1.8;
  }

  .footer-divider {
    width: 100%;
    height: 1px;

    background: ${brand.surfaceHighest};

    margin-bottom: 22px;
  }

  @media screen and (max-width: 640px) {
    body {
      padding: 14px;
    }

    .hero {
      padding: 40px 24px 20px;
    }

    .content {
      padding: 10px 20px 30px;
    }

    .section-card {
      padding: 24px 18px;
      border-radius: 24px;
    }

    h1 {
      font-size: 28px;
    }

    .subtitle {
      font-size: 15px;
    }

    .otp-box {
      height: 58px;
      font-size: 22px;
      border-radius: 18px;
    }

    .btn {
      max-width: 100%;
    }
  }
</style>
</head>

<body>

  <div class="container">

    <div class="main-card">

      <div class="hero">

        <div class="logo-wrap">
          <div class="logo">
            wave<span>log</span>
          </div>
        </div>

        ${headerContent}

      </div>

      <div class="content">
        ${bodyContent}
      </div>

      <div class="footer">

        <div class="footer-divider"></div>

        Sent securely by the Wavelog Editorial Team.
        <br />
        Please do not reply to this automated email.

      </div>

    </div>

  </div>

</body>
</html>
`;

const renderOTPBoxes = (otp) => {
  const digits = otp.toString().split("");

  return `
    <div class="otp-wrapper">

      <table
        class="otp-grid"
        role="presentation"
      >
        <tr>

          ${digits
            .map(
              (digit) => `
                <td>
                  <div class="otp-box">
                    ${digit}
                  </div>
                </td>
              `,
            )
            .join("")}

        </tr>
      </table>

    </div>
  `;
};

const buildTemplate = ({ title, subtitle, body }) => {
  return wrapLayout({
    headerContent: `
      <h1>${title}</h1>

      <p class="subtitle">
        ${subtitle}
      </p>
    `,

    bodyContent: body,
  });
};

const emailTemplates = {
  verificationOTP: (otp) => ({
    subject: "🔐 Verify your Wavelog account",

    html: buildTemplate({
      title: "Verify Your Identity",

      subtitle:
        "Before entering your editorial workspace, please confirm your identity using the secure authorization code below.",

      body: `
        <div class="section-card">

          ${renderOTPBoxes(otp)}

          <div class="helper">
            This verification code will expire in 10 minutes.
          </div>

        </div>
      `,
    }),
  }),

  verificationSuccess: (username) => ({
    subject: "✅ Identity Confirmed | Wavelog",

    html: buildTemplate({
      title: "Identity Confirmed",

      subtitle: "Your editorial space is now active and ready for publishing.",

      body: `
        <div class="section-card">

          <div class="icon-circle">
            ✓
          </div>

          <p
            style="
              text-align:center;
              font-size:17px;
              line-height:1.9;
              color:${brand.textSecondary};
              margin:0;
            "
          >
            Thank you,
            <strong style="color:${brand.text}">
              ${username}
            </strong>.

            Your email address has been successfully verified.
          </p>

          <div class="btn-wrap">

            <a
              href="${process.env.FRONTEND_URL}/login"
              class="btn"
            >
              Enter Workspace
            </a>

          </div>

        </div>
      `,
    }),
  }),

  welcome: (username) => ({
    subject: "🚀 Welcome to Wavelog",

    html: buildTemplate({
      title: `Greetings, ${username}.`,

      subtitle:
        "Your publishing environment is ready. Wavelog is where stories find rhythm and ideas become timeless.",

      body: `
        <div class="section-card">

          <p
            style="
              text-align:center;
              color:${brand.textSecondary};
              line-height:1.9;
              font-size:16px;
              margin:0;
            "
          >
            Start writing, publish your thoughts,
            and build your own editorial presence.
          </p>

          <div class="btn-wrap">

            <a
              href="${process.env.FRONTEND_URL}/login"
              class="btn"
            >
              Start Writing
            </a>

          </div>

        </div>
      `,
    }),
  }),

  passwordResetOTP: (otp) => ({
    subject: "🔑 Reset your Wavelog access",

    html: buildTemplate({
      title: "Password Recovery",

      subtitle:
        "We received a request to reset your password. Use the secure verification code below to continue.",

      body: `
        <div class="section-card">

          ${renderOTPBoxes(otp)}

          <div class="warning-box">
            If you did not request a password reset,
            we recommend securing your account immediately.
          </div>

        </div>
      `,
    }),
  }),

  changePasswordOTP: (otp) => ({
    subject: "🛡️ Confirm Security Change",

    html: buildTemplate({
      title: "Confirm Password Update",

      subtitle:
        "Use the verification code below to complete your password change request.",

      body: `
        <div class="section-card">

          ${renderOTPBoxes(otp)}

          <div class="warning-box">
            Only enter this code if you are currently
            updating your password from the Wavelog settings page.
          </div>

        </div>
      `,
    }),
  }),
};

module.exports = emailTemplates;
