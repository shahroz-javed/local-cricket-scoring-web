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
    manifest: "/manifest.json",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "CricketApp",
    },
    formatDetection: { telephone: false },
    openGraph: {
        type: "website",
        title: "CricketApp",
        description: "Live scoring for local cricket",
        siteName: "CricketApp",
    },
};

export const viewport = {
    themeColor: "#004ac6",
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
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
                {/* PWA */}
                <link rel="apple-touch-icon" href="/icons/icon-192.png" />
                <meta name="mobile-web-app-capable" content="yes" />
                {/* SW registration */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').catch(function() {});
  });
}
`,
                    }}
                />
            </head>
            <body className="min-h-full">
                {children}
                <Toaster position="top-right" richColors closeButton duration={4000} />
            </body>
        </html>
    );
}
