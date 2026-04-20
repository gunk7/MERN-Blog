const { createTransporter } = require("../services/nodemailer");

exports.mailSend = async (to, subject, text) => {
  try {
    const porter = await createTransporter();
    const mailOptions = {
      from: `${process.env.MAIL_APP_NAME} <${process.env.MAIL_FROM_ADDRESS}>`,
      to: to,
      subject: subject,
      html: text,
    };
    await porter.sendMail(mailOptions);
  } catch (error) {
    console.log("Error in mailSend:", error);
    throw new Error("Failed to send email: " + error.message);
  }
};
