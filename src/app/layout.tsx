import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Fredoka } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import "@/styles/reset.scss";

// Exposed as a CSS variable so only the scene UI opts in; the terminal stays monospace
const fredoka = Fredoka({
    subsets: ["latin"],
    variable: "--font-cartoon",
    display: "swap",
});

export const metadata: Metadata = {
    title: "Devon.Codes",
    description: "Devon Wieczorek's Personal Website",
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en" className={fredoka.variable}>
            {/* suppressHydrationWarning added to avoid error caused by browser extensions */}
            <body suppressHydrationWarning>
                {children}
                <Analytics />
                <SpeedInsights />
            </body>
        </html>
    );
}
