import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ClipFarm × Cantina Generator',
  description:
    'Fake text message video generator for the Cantina campaign — by ClipFarm',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
