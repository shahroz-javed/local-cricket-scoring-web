import { Inter, Space_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
    variable: "--font-space-grotesk",
    subsets: ["latin"],
});

export const metadata = {
    title: "CricketApp",
    description: "Live scoring for local cricket",
};

export default function RootLayout({ children }) {
    return (
        <html
            lang="en"
            className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}
        >
            <head>
                <link
                    rel="stylesheet"
                    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
                />
            </head>
            <body className="min-h-full">
                {children}
                <Toaster position="top-right" richColors closeButton duration={4000} />
            </body>
        </html>
    );
}
