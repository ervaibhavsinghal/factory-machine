import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Machinify - Factory Maintenance",
  description: "QR-powered factory machine maintenance management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
