import type {Metadata} from 'next';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { Analytics } from '@vercel/analytics/react';

export const metadata: Metadata = {
  title: 'Horological Precision - Gestão de Estoque e Vendas de Relógios',
  description: 'Painel executivo de controle de estoque, lançamentos de transação e análise financeira para negociantes de relógios de luxo.',
  icons: {
    icon: [
      { url: '/wrist-watch.png', sizes: '32x32', type: 'image/png' },
      { url: '/wrist-watch.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' },
    ],
    shortcut: '/wrist-watch.png',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body className="dark bg-[#09090b] text-[#e5e1e4] antialiased selection:bg-[#ffd165] selection:text-[#131315]">
        <AuthProvider>
          {children}
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}

