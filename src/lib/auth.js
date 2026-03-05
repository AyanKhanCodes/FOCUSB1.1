import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import connectToDatabase from "../lib/mongodb";
import User from "../models/User";

export const authOptions = {
    providers: [
        CredentialsProvider({
            name: "FocusB Account",
            credentials: {
                email: { label: "Email", type: "email", placeholder: "you@example.com" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                try {
                    await connectToDatabase();
                } catch (dbError) {
                    console.error('[NextAuth] MongoDB connection failed:', dbError.message);
                    throw new Error('Database connection failed. Please try again later.');
                }

                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Please enter an email and password');
                }

                const user = await User.findOne({ email: credentials.email });

                if (!user) {
                    const hashedPassword = await bcrypt.hash(credentials.password, 10);
                    const newUser = await User.create({
                        email: credentials.email,
                        password: hashedPassword,
                    });
                    return { id: newUser._id.toString(), email: newUser.email };
                }

                const isPasswordMatch = await bcrypt.compare(credentials.password, user.password);
                if (!isPasswordMatch) {
                    throw new Error('Incorrect password');
                }

                return { id: user._id.toString(), email: user.email };
            }
        })
    ],
    session: { strategy: "jwt" },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (token?.id) {
                session.user.id = token.id;
            }
            return session;
        }
    },
    pages: {
        signIn: '/login',
        error: '/login',
    },
    secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_local_dev_only",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST, authOptions as options };
