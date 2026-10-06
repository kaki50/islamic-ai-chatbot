import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Islamic AI Chatbot",
  description: "Source-aware Islamic information chatbot",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
