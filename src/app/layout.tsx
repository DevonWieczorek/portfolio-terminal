import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import "@/styles/reset.scss";

export const metadata: Metadata = {
    title: "Devon.Codes",
    description: "Devon Wieczorek's Personal Website",
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            {/* suppressHydrationWarning added to avoid error caused by browser extensions */}
            <body suppressHydrationWarning>
                {children}
                <Analytics />
                <SpeedInsights />
            </body>
        </html>
    );
}
