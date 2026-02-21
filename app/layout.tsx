import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Brunswick.pt - Shopfloor Management",
  description: "Sistema Avançado de Gestão de Chão de Fábrica e Diagnóstico IoT",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
