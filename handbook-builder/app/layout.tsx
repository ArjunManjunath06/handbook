import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Handbook Builder',
  description: 'Generate a custom employee handbook for your company in minutes.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
