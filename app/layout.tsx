// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Glowee - Salon Dashboard",
  description: "Professional salon management dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}