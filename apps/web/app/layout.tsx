import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'GYMFLOW — Sua academia. Sob controle.',
  description: 'Sistema de gestão completo para academias: controle de acesso, financeiro e app do aluno.',
  openGraph: {
    title: 'GYMFLOW',
    description: 'Gestão inteligente para academias brasileiras',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-dark text-white antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#111119', color: '#fff', border: '1px solid #2A2A3A' },
          }}
        />
      </body>
    </html>
  )
}
