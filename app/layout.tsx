import type { Metadata } from "next";
import { ReactNode } from "react";
import { getServerSession } from "next-auth";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { Providers } from "@/components/providers";
import { authOptions } from "@/lib/auth";
import { cn } from "@/lib/utils";
import Head from "next/head";

export const metadata: Metadata = {
  title: "TaskFlow – Modern Task Management",
  description: "SaaS-платформа для управления задачами в стиле Trello."
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="ru" suppressHydrationWarning className="scroll-smooth">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('taskflow-theme');
                  if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={cn("min-h-screen bg-background text-foreground font-sans antialiased")}>
        <Providers session={session}>
          <div className="flex min-h-screen flex-col">
            <Navbar session={session} />
            <div className="flex flex-1">
              <Sidebar />
              <main className="flex-1">{children}</main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}

