import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Plugin Control Panel — Cheddah Development',
  description: 'Private plugin information management for Cheddah Development.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
