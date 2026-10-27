import type { Metadata, Viewport } from "next";
import {
  Instrument_Sans,
  Instrument_Serif,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";
import "./app.css";
import "./landing.css";
import "./pages.css";
import { Experience } from "@/components/experience/providers";

const sans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TrustBridge — Verify the claim before you pay",
  description:
    "TrustBridge checks the claim before money moves, then holds the payment until the work is delivered. One link. Four honest outcomes.",
  applicationName: "TrustBridge",
  openGraph: {
    title: "TrustBridge — Don't send money into the void",
    description:
      "Verify first. Protect the deal. Evidence tiers, protected payments and human-first disputes for work found in chat.",
    type: "website",
  },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#08120E",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${display.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Experience>{children}</Experience>
      </body>
    </html>
  );
}
