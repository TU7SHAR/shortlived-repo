"use server";

import nodemailer from "nodemailer";
import { siteConfig } from "../utils/config";

const transporter = nodemailer.createTransport({
  host: process.env.smtp_host || "smtp.gmail.com",
  port: parseInt(process.env.smtp_port || "587"),
  secure: false,
  auth: {
    user: process.env.smtp_name,
    pass: process.env.smtp_password,
  },
});

export async function sendWelcomeEmail(toEmail) {
  try {
    const mailOptions = {
      from: `"${siteConfig.name}" <${process.env.smtp_name}>`,
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
    console.error("SMTP Error:", error);
    return { success: false, error: error.message };
  }
}

export async function sendInviteLink(toEmail, inviteLink, caption) {
  try {
    const mailOptions = {
      from: `"${siteConfig.name}" <${process.env.smtp_name}>`,
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
    console.error("SMTP Error:", error);
    return { success: false, error: error.message };
  }
}
