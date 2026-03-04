import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema(
    {
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        resetPasswordOtp: { type: String, default: null },
        resetPasswordOtpExpiry: { type: Date, default: null },
    },
    { timestamps: true }
);

export default mongoose.models.User || mongoose.model('User', UserSchema);
