import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/mongodb';
import User from '../../../../models/User';

export async function POST(req) {
    try {
        const { email, otp } = await req.json();

        if (!email || !otp) {
            return NextResponse.json({ error: 'Email and OTP are required' }, { status: 400 });
        }

        await connectToDatabase();

        const user = await User.findOne({ email });

        if (!user) {
            return NextResponse.json({ error: 'Invalid verification details' }, { status: 400 });
        }

        // Check if OTP matches and hasn't expired
        if (user.resetPasswordOtp !== otp) {
            return NextResponse.json({ error: 'Invalid or incorrect OTP' }, { status: 400 });
        }

        if (new Date() > user.resetPasswordOtpExpiry) {
            return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 });
        }

        // OTP is valid
        return NextResponse.json({ success: true, message: 'OTP verified successfully' });

    } catch (error) {
        console.error('Verify OTP error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
