import './globals.css'
import Providers from '../components/Providers'

export const metadata = {
    title: 'FocusB Study Timer',
    description: 'Productivity and study timer',
}

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className="antialiased bg-slate-950 min-h-screen text-slate-200">
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    )
}
