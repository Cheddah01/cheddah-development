import type { Metadata, Viewport } from 'next';
import { Fredoka, Nunito } from 'next/font/google';
import './globals.css';

const nunito = Nunito({
  variable: '--font-nunito',
  subsets: ['latin'],
});

const fredoka = Fredoka({
  variable: '--font-fredoka',
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
    description: 'Friendly plugins. Serious server polish.',
    url: '/',
    siteName: 'Cheddah Development',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Cheddah Development — Friendly plugins. Serious server polish.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cheddah Development — Minecraft Plugins',
    description: 'Friendly plugins. Serious server polish.',
    images: ['/og.png'],
  },
};

export const viewport: Viewport = {
  themeColor: '#5eaae8',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${nunito.variable} ${fredoka.variable}`}
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
