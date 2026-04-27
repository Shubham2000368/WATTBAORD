import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { AppShell } from "@/components/layout/AppShell";
import { SidebarProvider } from "@/context/SidebarContext";
import { IssueModalProvider } from "@/context/IssueModalContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "WattBoard | Engineering Intelligence Platform",
  description: "The ultimate mission control for high-performance engineering teams. Manage sprints, track velocity, and orchestrate your vision with AI-powered intelligence.",
  keywords: ["agile", "project management", "engineering", "sprint", "kanban", "AI", "saas"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className={`${poppins.variable} font-sans bg-[#020617] text-slate-900 antialiased selection:bg-indigo-100 selection:text-indigo-700`}>
        <AuthProvider>
          <SidebarProvider>
            <IssueModalProvider>
              <AppShell>
                {children}
              </AppShell>
            </IssueModalProvider>
          </SidebarProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
