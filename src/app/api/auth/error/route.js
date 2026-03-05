import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';

// This route catches NextAuth's default error redirect.
// Instead of showing a 404, it redirects to the login page with the error.
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const error = searchParams.get('error') || 'Unknown';

    // Log the full error details so we can see them in Vercel logs
    console.error('[AUTH ERROR ROUTE]', {
        error,
        fullUrl: request.url,
        headers: Object.fromEntries(request.headers.entries()),
    });

    redirect(`/login?error=${error}`);
}
