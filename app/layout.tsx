import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DM_Sans, Syne } from "next/font/google";

import { APP_NAME } from "@/lib/constants";

import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne"
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans"
});

export const metadata: Metadata = {
  title: `${APP_NAME} | Sistema Operacional da Sua Agência IA`,
  description:
    "Plataforma SaaS multiagente para operação criativa com Next.js, Supabase e Groq.",
  applicationName: APP_NAME
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body
        className={`${syne.variable} ${dmSans.variable} min-h-screen bg-[#050505] font-body text-white antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
