import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Property Ledger",
  description: "Property, suite, tenant, and lease tracker",
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
