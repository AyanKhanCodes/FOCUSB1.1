"use client";

import React, { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Activity } from 'lucide-react';
import Link from 'next/link';

function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Check if NextAuth redirected us here with an error
    const searchParams = useSearchParams();
    const urlError = searchParams.get('error');

    const getErrorMessage = (code) => {
        if (!code) return '';
        switch (code) {
            case 'CredentialsSignin': return 'Sign in failed. Check the details you provided are correct.';
            case 'Configuration': return 'Server configuration error. Please contact support.';
            case 'AccessDenied': return 'Access denied.';
            default: return `Authentication error: ${code}. Please try again.`;
        }
    };

    const [error, setError] = useState(getErrorMessage(urlError));
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const res = await signIn('credentials', {
            redirect: false,
            email,
            password,
        });

        if (res?.error) {
            setError(res.error);
            setIsLoading(false);
        } else {
            router.push('/');
            router.refresh();
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900/60 border border-slate-800/80 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-blue-600/20 text-blue-400 rounded-2xl flex items-center justify-center mb-4 border border-blue-500/30">
                        <Activity size={32} />
                    </div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">FocusB</h1>
                    <p className="text-slate-400 font-medium mt-1">Sign in to sync your study data</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 text-red-500 text-sm font-medium rounded-xl text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2" htmlFor="email">
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-950/50 border border-slate-700/60 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-slate-400 text-xs font-bold uppercase tracking-wider mb-2" htmlFor="password">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-950/50 border border-slate-700/60 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                            placeholder="••••••••"
                        />
                        <div className="flex justify-end mt-2">
                            <Link href="/forgot-password" className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium">
                                Forgot Password?
                            </Link>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-blue-500 transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] disabled:opacity-50 mt-4"
                    >
                        {isLoading ? 'Signing In...' : 'Sign In / Register'}
                    </button>
                </form>

                <p className="text-center text-slate-500 text-xs mt-6 font-medium">
                    If you don't have an account, entering an email and password will create one instantly.
                </p>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-md bg-slate-900/60 border border-slate-800/80 rounded-3xl p-8 backdrop-blur-xl shadow-2xl flex justify-center">
                    <div className="animate-pulse w-16 h-16 bg-blue-600/20 rounded-2xl"></div>
                </div>
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}
