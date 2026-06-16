import type { Metadata } from 'next';
import ConfigureAmplify from './ConfigureAmplify';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kirpajeet Singh Gill',
  description: 'A gallery of moments — photos and music.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ConfigureAmplify />
        {children}
      </body>
    </html>
  );
}
