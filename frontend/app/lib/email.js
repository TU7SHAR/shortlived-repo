"use server";

import nodemailer from "nodemailer";
import { siteConfig } from "../utils/config";

/**
 * Gmail API (OAuth2) transporter.
 *
 * How to get the credentials:
 * 1. Go to Google Cloud Console → APIs & Services → Enable "Gmail API"
 * 2. Create OAuth2 credentials (Web application type)
 * 3. Use OAuth2 Playground to get a refresh token for salesji.team@gmail.com
 * 4. Put the values in .env.local (see README.md)
 *
 * Env vars needed:
 *   GMAIL_USER          = salesji.team@gmail.com
 *   GMAIL_CLIENT_ID     = xxxx.apps.googleusercontent.com
 *   GMAIL_CLIENT_SECRET = GOCSPX-xxxx
 *   GMAIL_REFRESH_TOKEN = 1//xxxx
 */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.GMAIL_USER,
    clientId: process.env.GMAIL_CLIENT_ID,
    clientSecret: process.env.GMAIL_CLIENT_SECRET,
    refreshToken: process.env.GMAIL_REFRESH_TOKEN,
  },
});

export async function sendWelcomeEmail(toEmail) {
  try {
    const mailOptions = {
      from: `"${siteConfig.name}" <${process.env.GMAIL_USER}>`,
      to: toEmail,
      subject: `Welcome to the ${siteConfig.name} Dashboard!`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
          <h2 style="color: #000;">Welcome to the Dashboard!</h2>
          <p style="color: #555;">Your admin account has been successfully created. You can now generate, track, and revoke access keys for ${siteConfig.name}.</p>
          <br/>
          <a href="${siteConfig.url}" style="background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Dashboard</a>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Gmail API Error:", error);
    return { success: false, error: error.message };
  }
}

export async function sendInviteLink(toEmail, inviteLink, caption) {
  try {
    const mailOptions = {
      from: `"${siteConfig.name}" <${process.env.GMAIL_USER}>`,
      to: toEmail,
      subject: `You've been invited to use ${siteConfig.name}!`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px;">
          <h2 style="color: #000;">Your Access Token</h2>
          <p style="color: #555;">You have been granted access to ${siteConfig.name}.</p>
          <p style="color: #555;"><strong>Access Level:</strong> ${caption}</p>
          <br/>
          <a href="${inviteLink}" style="background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Start Chatting Now</a>
          <p style="margin-top: 20px; font-size: 12px; color: #999;">If the button doesn't work, copy this link: <br/> ${inviteLink}</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Gmail API Error:", error);
    return { success: false, error: error.message };
  }
}
