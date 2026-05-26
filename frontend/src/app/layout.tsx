import type { Metadata } from 'next'
import './globals.css'
import 'leaflet/dist/leaflet.css'

export const metadata: Metadata = {
  title: 'Real Rails – Remittance Corridor Analyzer',
  description: 'Production intelligence dashboard · Payment Rail · ID 13 · Temporal Archetype',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
