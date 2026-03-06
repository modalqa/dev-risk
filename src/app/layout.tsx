import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DevRisk AI — AI Risk Intelligence',
  description: 'AI Risk Intelligence for Scaling Product Teams',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-white antialiased">
        {children}
      </body>
    </html>
  );
}
