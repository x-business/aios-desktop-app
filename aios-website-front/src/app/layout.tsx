import type { Metadata } from "next";
import { Sora, Montserrat } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { PointsProvider } from "@/contexts/PointsContext";

// Import Sora from Google Fonts
const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

// Use Montserrat instead of Inter
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "AIOS - Advanced AI Integration Tool",
  description: "The ultimate AI assistant designed to connect people with AI tools, boosting productivity and simplifying workflows.",
  keywords: ["AI", "artificial intelligence", "cognitive extension", "AI integration", "MCP", "Model Context Protocol"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <style>{`
          /* Hide Next.js dev tools */
          button[aria-label*="Next.js"],
          div[role="button"][aria-label*="Next.js"],
          div[style*="position: fixed"][style*="bottom: 0"][style*="left: 0"],
          div[style*="position: fixed"][style*="bottom: 0"][style*="right: 0"] {
            display: none !important;
            visibility: hidden !important;
          }
        `}</style>
      </head>
      <body
        className={`${sora.variable} ${montserrat.variable} antialiased bg-[#020207] min-h-screen text-white`}
      >
        <AuthProvider>
          <PointsProvider>
            {children}
          </PointsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}