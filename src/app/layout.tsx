import type { Metadata } from "next";
import "./globals.css";
import "@/styles/reset.scss";

export const metadata: Metadata = {
	title: "DevonGPT - Terminal Portfolio",
	description: "Devon Wieczorek's Personal Assistant Terminal",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	);
}
