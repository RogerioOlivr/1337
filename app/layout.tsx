import type { Metadata } from 'next'
import { Anton, Inter, Geist_Mono } from 'next/font/google'
import Navbar from './_components/Navbar'
import Footer from './_components/Footer'
import CartSidebar from './_components/CartSidebar'
import './globals.css'

const anton = Anton({
  weight: '400',
  variable: '--font-anton',
  subsets: ['latin'],
})

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: '1337 — Premium Streetwear',
  description: 'Streetwear premium para quem vive o código.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${anton.variable} ${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <CartSidebar />
      </body>
    </html>
  )
}
