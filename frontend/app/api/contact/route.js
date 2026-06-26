import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { name, email, message } = await request.json();

    // Gmail API OAuth2 transport
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

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER, // Sends the contact request to yourself
      subject: `New Contact Request from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; background: #0B0F19; color: #fff;">
          <h2 style="color: #60A5FA;">New Platform Inquiry</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <div style="background: #111827; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <p style="margin: 0; color: #D1D5DB;">${message}</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: "Message sent successfully",
    });
  } catch (error) {
    console.error("Gmail API Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to send message" },
      { status: 500 },
    );
  }
}
