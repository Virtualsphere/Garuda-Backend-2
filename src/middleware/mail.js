import dotenv from "dotenv";
dotenv.config();
import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

/**
 * Send an email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Plain text fallback
 * @param {string} html - HTML content
 */
export const sendEmail = async (to, subject, text, html = null) => {
  try {
    const mailOptions = {
      from: `"Garuda User" <${process.env.MAIL_USER}>`,
      to,
      subject,
      text,
      html: html || text, // Use HTML if provided
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.response);
    return info;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw error;
  }
};
