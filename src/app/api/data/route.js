import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import connectToDatabase from '../../../lib/mongodb';
import UserData from '../../../models/UserData';

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        const userData = await UserData.findOne({ userId: session.user.id });

        if (!userData) {
            return NextResponse.json({ topics: [], history: {} });
        }

        // Mongoose Maps need to be converted to plain objects for JSON transmission
        const plainHistory = {};
        if (userData.history) {
            userData.history.forEach((value, key) => {
                // value is the Map containing tags and gym
                plainHistory[key] = {
                    gym: value.gym,
                    tags: value.tags ? Object.fromEntries(value.tags) : {}
                };
            });
        }

        return NextResponse.json({
            topics: userData.topics,
            history: plainHistory
        });

    } catch (error) {
        console.error('Error fetching data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { topics, history } = body;

        await connectToDatabase();

        await UserData.findOneAndUpdate(
            { userId: session.user.id },
            {
                $set: {
                    topics: topics || [],
                    history: history || {}
                }
            },
            { new: true, upsert: true }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
