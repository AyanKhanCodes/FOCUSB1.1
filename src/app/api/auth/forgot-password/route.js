import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/mongodb';
import User from '../../../../models/User';
import nodemailer from 'nodemailer';

export async function POST(req) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        await connectToDatabase();

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            // Return a generic success message even if email isn't found to prevent email enumeration
            return NextResponse.json({ success: true, message: 'If an account exists, an OTP will be sent.' });
        }

        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Set expiry to 15 minutes from now
        const otpExpiry = new Date();
        otpExpiry.setMinutes(otpExpiry.getMinutes() + 15);

        // Save to database
        user.resetPasswordOtp = otp;
        user.resetPasswordOtpExpiry = otpExpiry;
        await user.save();

        // Configuration check
        if (!process.env.SMTP_USER || process.env.SMTP_USER === 'your-actual-email@gmail.com' || !process.env.SMTP_PASS) {
            console.warn(`\n[DEV MODE] Password Reset OTP for ${email}: ${otp}\n(Add valid SMTP env vars to actual send emails)\n`);
            return NextResponse.json({ success: true, message: 'OTP generated. Check server console or use this code.', devOtp: otp });
        }

        try {
            // Configure Nodemailer
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT,
                secure: false, // true for 465, false for other ports
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });

            // Send the email
            await transporter.sendMail({
                from: '"FocusB Study Timer" <noreply@focusb.local>',
                to: email,
                subject: 'FocusB - Password Reset Code',
                text: `Your password reset code is: ${otp}. It will expire in 15 minutes.`,
                html: `
        <div style="font-family: sans-serif; max-w-md; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2563eb;">Password Reset</h2>
          <p>You requested a password reset for FocusB. Your one-time verification code is:</p>
          <div style="background: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
             <h1 style="margin: 0; letter-spacing: 5px; color: #0f172a;">${otp}</h1>
          </div>
          <p style="color: #64748b; font-size: 14px;">This code will expire in 15 minutes. If you did not request this, please ignore this email.</p>
        </div>
      `,
            });

            return NextResponse.json({ success: true, message: 'OTP sent successfully' });

        } catch (emailError) {
            console.error('Nodemailer SMTP Error:', emailError.message);
            // Revert Fallback: Strict enforcement. If email fails, return an error.
            return NextResponse.json({
                error: 'Failed to send email. Please check your SMTP configuration.'
            }, { status: 500 });
        }

    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
