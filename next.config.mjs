/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
            // Route all NextAuth sub-paths to the handler
            {
                source: '/api/auth/callback/:path*',
                destination: '/api/auth/handler',
            },
            {
                source: '/api/auth/signin/:path*',
                destination: '/api/auth/handler',
            },
            {
                source: '/api/auth/signout',
                destination: '/api/auth/handler',
            },
            {
                source: '/api/auth/session',
                destination: '/api/auth/handler',
            },
            {
                source: '/api/auth/csrf',
                destination: '/api/auth/handler',
            },
            {
                source: '/api/auth/providers',
                destination: '/api/auth/handler',
            },
        ];
    },
};

export default nextConfig;
