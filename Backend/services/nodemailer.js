const nodemailer = require("nodemailer");

exports.createTransporter = () => {
  const port = Number(process.env.SMTP_PORT);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: port,
    secure: port === 465,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  // Add this
  transporter.verify((error) => {
    if (error) console.error("Mail transporter error:", error);
    else console.log("Mail transporter ready");
  });

  return transporter;
};
