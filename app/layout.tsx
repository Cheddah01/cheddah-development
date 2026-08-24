import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://cheddah-development.net'),
  title: 'Cheddah Development — Minecraft Plugins',
  description: 'Focused, polished Minecraft plugins built for modern public servers.',
  keywords: ['Minecraft plugins', 'Paper plugins', 'Minecraft server tools', 'Cheddah Development'],
  authors: [{ name: 'Cheddah Development', url: 'https://github.com/Cheddah01' }],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    title: 'Cheddah Development — Minecraft Plugins',
    description: 'Plugins built for the servers players remember.',
    url: '/',
    siteName: 'Cheddah Development',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Cheddah Development — Plugins built for the servers players remember.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cheddah Development — Minecraft Plugins',
    description: 'Plugins built for the servers players remember.',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Person',
              name: 'Cheddah Development',
              url: 'https://cheddah-development.net',
              sameAs: ['https://github.com/Cheddah01', 'https://modrinth.com/plugin/waveback'],
              knowsAbout: ['Minecraft plugins', 'PaperMC', 'Java'],
            }),
          }}
        />
      </body>
    </html>
  );
}
