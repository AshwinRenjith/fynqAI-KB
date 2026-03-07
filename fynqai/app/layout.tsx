import type { Metadata } from "next";
import { Cormorant_Garamond, Sora, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const fontDisplay = Cormorant_Garamond({
    subsets: ["latin"],
    weight: ["400", "500", "600", "700"],
    variable: "--font-display",
    style: "italic",
});

const fontUi = Sora({
    subsets: ["latin"],
    weight: ["300", "400", "500", "600", "700"],
    variable: "--font-ui",
});

const fontMono = JetBrains_Mono({
    subsets: ["latin"],
    variable: "--font-mono",
});

export const metadata: Metadata = {
    title: "fynqAI | Enterprise Governance Hub",
    description: "AI-powered regulatory audit and contradiction detection for enterprise governance.",
};

import { Providers } from "@/components/providers/Providers";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark scroll-smooth">
            <body className={`${fontDisplay.variable} ${fontUi.variable} ${fontMono.variable} font-ui antialiased selection:bg-fynq-red/30 bg-fynq-void overflow-x-hidden`}>
                {/* ── Noise Texture Overlay §9 ── */}
                <div
                    className="fixed inset-0 pointer-events-none z-[9999] opacity-[0.03] mix-blend-overlay"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.8) 0.5px, transparent 0.5px), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.7) 0.5px, transparent 0.5px)',
                        backgroundSize: '3px 3px, 4px 4px',
                    }}
                />

                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}
