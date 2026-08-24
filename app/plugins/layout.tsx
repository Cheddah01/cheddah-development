import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Plugins — Cheddah Development',
  description: 'Browse polished Minecraft plugins built for modern public servers.',
  alternates: { canonical: '/plugins/' },
  openGraph: {
    type: 'website',
    title: 'Plugins — Cheddah Development',
    description: 'Focused Minecraft plugins with friendly setup and serious server polish.',
    url: '/plugins/',
    siteName: 'Cheddah Development',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Cheddah Development — Friendly plugins. Serious server polish.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Plugins — Cheddah Development',
    description: 'Focused Minecraft plugins with friendly setup and serious server polish.',
    images: ['/og.png'],
  },
};

export default function PluginsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
