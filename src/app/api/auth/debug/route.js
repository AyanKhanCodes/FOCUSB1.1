// Diagnostic route to test if NextAuth imports work on Vercel
import { NextResponse } from 'next/server';

export async function GET() {
    const diagnostics = {
        nodeVersion: process.version,
        platform: process.platform,
        env: {
            MONGODB_URI: process.env.MONGODB_URI ? 'SET' : 'MISSING',
            NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'MISSING',
            NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'MISSING',
        },
        imports: {},
    };

    // Test each import individually
    try {
        const NextAuth = await import('next-auth');
        diagnostics.imports.nextAuth = 'OK';
    } catch (e) {
        diagnostics.imports.nextAuth = `FAILED: ${e.message}`;
    }

    try {
        const bcrypt = await import('bcryptjs');
        diagnostics.imports.bcryptjs = 'OK';
    } catch (e) {
        diagnostics.imports.bcryptjs = `FAILED: ${e.message}`;
    }

    try {
        const mongoose = await import('mongoose');
        diagnostics.imports.mongoose = 'OK';
    } catch (e) {
        diagnostics.imports.mongoose = `FAILED: ${e.message}`;
    }

    return NextResponse.json(diagnostics, { status: 200 });
}
