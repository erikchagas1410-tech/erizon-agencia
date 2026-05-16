import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Syne } from "next/font/google";

import { APP_NAME } from "@/lib/constants";

import "./globals.css";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne"
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: `${APP_NAME} | Sistema Operacional da Sua Agencia IA`,
  description:
    "Plataforma SaaS multiagente para operacao criativa com Next.js, Supabase e Groq.",
  applicationName: APP_NAME
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${syne.variable} ${inter.variable} min-h-screen bg-[var(--color-bg)] font-sans text-[var(--color-text-1)] antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
