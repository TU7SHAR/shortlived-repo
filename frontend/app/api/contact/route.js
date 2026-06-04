import nodemailer from "nodemailer";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { name, email, message } = await request.json();

    // 1. Configure SMTP using your exact .env variables
    const transporter = nodemailer.createTransport({
      host: process.env.smtp_host,
      port: Number(process.env.smtp_port),
      secure: false, // false for port 587
      auth: {
        user: process.env.smtp_name,
        pass: process.env.smtp_password,
      },
    });

    // 2. Format the email
    const mailOptions = {
      from: process.env.smtp_name,
      to: process.env.smtp_name, // Sends the contact request to yourself
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

    // 3. Send the email
    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: "Message sent successfully",
    });
  } catch (error) {
    console.error("SMTP Error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to send message" },
      { status: 500 },
    );
  }
}
