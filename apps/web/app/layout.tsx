import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

// Google Analytics 4 — configurado em https://analytics.google.com
const GA_ID = 'G-SRZ7HE1DVD'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.gymflowgestor.com.br'),
  title: 'GymFlow Gestor — Sua academia. Sob controle.',
  description: 'Sistema de gestão completo para academias: controle de acesso, financeiro e app do aluno.',
  openGraph: {
    title: 'GymFlow Gestor',
    description: 'Gestão inteligente para academias brasileiras',
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

        {/* ─── Google Analytics 4 (gtag.js) ─── */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
      </body>
    </html>
  )
}
