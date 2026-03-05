import { redirect } from 'next/navigation';

// This route catches NextAuth's default error redirect.
// Instead of showing a 404, it redirects to the login page with the error.
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const error = searchParams.get('error') || 'Unknown';
    redirect(`/login?error=${error}`);
}
