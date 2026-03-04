import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/mongodb';
import User from '../../../../models/User';
import bcrypt from 'bcryptjs';

export async function POST(req) {
    try {
        const { email, otp, newPassword } = await req.json();

        if (!email || !otp || !newPassword) {
            return NextResponse.json({ error: 'Email, OTP, and new password are required' }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
        }

        await connectToDatabase();

        const user = await User.findOne({ email });

        if (!user) {
            return NextResponse.json({ error: 'Invalid verification details' }, { status: 400 });
        }

        // Strict Double Check Validation
        if (user.resetPasswordOtp !== otp || new Date() > user.resetPasswordOtpExpiry) {
            return NextResponse.json({ error: 'Invalid or expired OTP. Please start over.' }, { status: 400 });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the password and clear the OTP fields
        user.password = hashedPassword;
        user.resetPasswordOtp = null;
        user.resetPasswordOtpExpiry = null;

        await user.save();

        return NextResponse.json({ success: true, message: 'Password has been reset successfully' });

    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
