"use server";

import nodemailer from "nodemailer";
import { siteConfig } from "../utils/config";

/**
 * Gmail SMTP transporter using an App Password (simple + reliable).
 *
 * How to get the credentials:
 * 1. Enable 2-Step Verification on the Gmail account
 * 2. Google Account → Security → App passwords → generate one for "Mail"
 * 3. You get a 16-char password like "abcd efgh ijkl mnop" (remove spaces)
 *
 * Env vars needed:
 *   GMAIL_USER         = salesjiteam@gmail.com
 *   GMAIL_APP_PASSWORD = abcdefghijklmnop   (16 chars, no spaces)
 */
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: (process.env.GMAIL_APP_PASSWORD || "").replace(/\s+/g, ""),
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

export async function sendCredentialsEmail(toEmail, password, telegramLink, caption) {
  try {
    // Use a runtime server env (APP_BASE_URL) so the link is correct
    // regardless of where the build was produced. Falls back to prod domain.
    const base = (process.env.APP_BASE_URL || "https://app.salesji.com").replace(
      /\/$/,
      ""
    );
    const loginUrl = `${base}/login`;
    const mailOptions = {
      from: `"${siteConfig.name}" <${process.env.GMAIL_USER}>`,
      to: toEmail,
      subject: `Your ${siteConfig.name} access is ready`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #eaeaea; border-radius: 12px;">
          <h2 style="color: #0f172a; margin-bottom: 4px;">Welcome to ${siteConfig.name}</h2>
          <p style="color: #64748b; margin-top: 0;">${caption || "You've been granted access."}</p>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0 0 8px; color: #0f172a; font-weight: 600;">Web App Login</p>
            <p style="margin: 0; color: #475569; font-size: 14px;">Email: <strong>${toEmail}</strong></p>
            <p style="margin: 4px 0 0; color: #475569; font-size: 14px;">Password: <strong>${password}</strong></p>
            <a href="${loginUrl}" style="display: inline-block; margin-top: 12px; background-color: #2563eb; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-size: 14px;">Log in to Web App</a>
          </div>

          <div style="margin: 20px 0;">
            <p style="margin: 0 0 8px; color: #0f172a; font-weight: 600;">Or use Telegram</p>
            <a href="${telegramLink}" style="display: inline-block; background-color: #0f172a; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 8px; font-size: 14px;">Open Telegram Bot</a>
          </div>

          <p style="margin-top: 24px; font-size: 12px; color: #94a3b8;">
            For security, please change your password after your first login.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Gmail API Error (credentials):", error);
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
