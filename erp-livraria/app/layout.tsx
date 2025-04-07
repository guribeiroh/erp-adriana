import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../lib/context/AuthContext';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Livraria Adriana do Nascimento',
  description: 'Sistema de gerenciamento para livrarias',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="bg-neutral-50 text-neutral-900 antialiased" suppressHydrationWarning>
        <AuthProvider>
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
} 