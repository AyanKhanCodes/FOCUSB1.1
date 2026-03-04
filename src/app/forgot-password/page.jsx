"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, Mail, Lock, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const router = useRouter();

    // Steps: 1 = Email, 2 = OTP verification, 3 = New Password, 4 = Success
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // --- Step 1: Request OTP ---
    const handleRequestOtp = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to send verification code');
            }

            setStep(2);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Step 2: Verify OTP ---
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Invalid code');
            }

            setStep(3);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Step 3: Reset Password ---
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp, newPassword }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to reset password');
            }

            setStep(4);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900/60 border border-slate-800/80 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative">

                {/* Back Button */}
                {step < 4 && (
                    <Link href="/login" className="absolute top-6 left-6 text-slate-500 hover:text-slate-300 transition-colors p-2 -ml-2 rounded-lg hover:bg-slate-800/50">
                        <ArrowLeft size={20} />
                    </Link>
                )}

                <div className="flex flex-col items-center mb-8 mt-2">
                    <div className="w-16 h-16 bg-indigo-600/20 text-indigo-400 rounded-2xl flex items-center justify-center mb-4 border border-indigo-500/30">
                        {step === 1 && <Mail size={32} />}
                        {step === 2 && <KeyRound size={32} />}
                        {step === 3 && <Lock size={32} />}
                        {step === 4 && <CheckCircle2 size={32} className="text-emerald-400" />}
                    </div>

                    <h1 className="text-2xl font-extrabold text-white tracking-tight">
                        {step === 1 && "Reset Password"}
                        {step === 2 && "Enter Code"}
                        {step === 3 && "New Password"}
                        {step === 4 && "All Set!"}
                    </h1>
                    <p className="text-slate-400 font-medium mt-2 text-center text-sm px-4">
                        {step === 1 && "Enter your email address to receive a 6-digit verification code."}
                        {step === 2 && `An email with a code was sent to ${email}. Valid for 15 minutes.`}
                        {step === 3 && "Create a secure new password for your account."}
                        {step === 4 && "Your password has been reset successfully. You can now log in."}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-500 text-sm font-medium rounded-xl text-center">
                        {error}
                    </div>
                )}

                {/* Step 1 Form */}
                {step === 1 && (
                    <form onSubmit={handleRequestOtp} className="space-y-4">
                        <div>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-950/50 border border-slate-700/60 text-white rounded-xl px-4 py-3.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
                                placeholder="you@example.com"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading || !email}
                            className="w-full bg-indigo-600 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-indigo-500 transition-all shadow-[0_0_15px_rgba(79,70,229,0.4)] disabled:opacity-50"
                        >
                            {isLoading ? 'Sending...' : 'Send Reset Code'}
                        </button>
                    </form>
                )}

                {/* Step 2 Form */}
                {step === 2 && (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                        {otp && (
                            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium rounded-xl text-center">
                                Use this verification code: {otp}
                            </div>
                        )}
                        <div>
                            <input
                                type="text"
                                required
                                maxLength={6}
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="w-full bg-slate-950/50 border border-slate-700/60 text-white rounded-xl px-4 py-3.5 text-center text-2xl tracking-[0.5em] focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600 font-mono"
                                placeholder="000000"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading || otp.length < 6}
                            className="w-full bg-indigo-600 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-indigo-500 transition-all shadow-[0_0_15px_rgba(79,70,229,0.4)] disabled:opacity-50"
                        >
                            {isLoading ? 'Verifying...' : 'Verify Code'}
                        </button>
                    </form>
                )}

                {/* Step 3 Form */}
                {step === 3 && (
                    <form onSubmit={handleResetPassword} className="space-y-4">
                        <div>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full bg-slate-950/50 border border-slate-700/60 text-white rounded-xl px-4 py-3.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-600"
                                placeholder="New Password (min 6 chars)"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading || newPassword.length < 6}
                            className="w-full bg-indigo-600 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-indigo-500 transition-all shadow-[0_0_15px_rgba(79,70,229,0.4)] disabled:opacity-50"
                        >
                            {isLoading ? 'Updating...' : 'Set New Password'}
                        </button>
                    </form>
                )}

                {/* Step 4 Success */}
                {step === 4 && (
                    <button
                        onClick={() => router.push('/login')}
                        className="w-full bg-emerald-600 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-emerald-500 transition-all shadow-[0_0_15px_rgba(5,150,105,0.4)] mt-2"
                    >
                        Return to Sign In
                    </button>
                )}
            </div>
        </div>
    );
}
