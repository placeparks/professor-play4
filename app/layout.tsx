import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TCGPlaytest | Custom Card Printing USA',
  description: 'Design and print your custom card games and TCG prototypes with TCGPlaytest.',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="text-slate-800 bg-white dark:bg-slate-950 dark:text-slate-100 min-h-screen flex flex-col transition-colors duration-300">
        {children}
      </body>
    </html>
  )
}

