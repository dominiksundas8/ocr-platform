import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AuthProvider from '@/components/AuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Deep Extractor | Dashboard OCR',
  description: 'Analisi automatica e gestione PDF / JPG per le imprese.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <body className={`${inter.className} bg-slate-900 text-slate-100 min-h-screen`}>
        {/* Avvolge tutta l'app col contesto di sicurezza Server-Client */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
