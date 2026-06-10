/* const { createTransporter } = require("../services/nodemailer");

exports.mailSend = async (to, subject, text) => {
  console.log("mailSend called:", to, subject);
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
 */

/* const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

exports.mailSend = async (to, subject, html) => {
  try {
    await resend.emails.send({
      from: `${process.env.MAIL_APP_NAME} <onboarding@resend.dev>`,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.log("Error in mailSend:", error);
    throw new Error("Failed to send email: " + error.message);
  }
}; */

const brevo = require("../services/brevo");

exports.mailSend = async (to, subject, html) => {
  try {
    await brevo.transactionalEmails.sendTransacEmail({
      to: [{ email: to }],
      subject,
      htmlContent: html,
      sender: {
        name: process.env.MAIL_APP_NAME,
        email: process.env.MAIL_FROM_ADDRESS,
      },
    });
  } catch (error) {
    console.log("Error in mailSend:", error);
    throw new Error("Failed to send email: " + error.message);
  }
};