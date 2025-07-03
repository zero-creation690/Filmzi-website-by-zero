import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { MovieProvider } from "@/contexts/MovieContext"
import { ThemeProvider } from "@/contexts/ThemeContext"
import Header from "@/components/Header"
import Footer from "@/components/Footer"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
})

export const metadata: Metadata = {
  title: "Filmzi - Download Movies Free",
  description:
    "Download Movies. Free. Direct. Forever. HD Quality movies in 480p, 720p, and 1080p with no ads, no waiting time.",
  keywords: "movies, download, free movies, HD movies, 1080p, 720p, 480p, movie downloader, streaming",
  authors: [{ name: "Filmzi" }],
  creator: "Filmzi",
  publisher: "Filmzi",
  robots: "index, follow",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.ico", type: "image/x-icon" },
    ],
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  openGraph: {
    title: "Filmzi - Download Movies Free",
    description: "Download Movies. Free. Direct. Forever.",
    url: "https://filmzi.com",
    siteName: "Filmzi",
    type: "website",
    images: [
      {
        url: "https://i.ibb.co/0pFQp0MN/image.jpg",
        width: 1200,
        height: 630,
        alt: "Filmzi - Movie Downloader & Streamer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Filmzi - Download Movies Free",
    description: "Download Movies. Free. Direct. Forever.",
    images: ["https://i.ibb.co/0pFQp0MN/image.jpg"],
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
        <link rel="preload" href="https://i.ibb.co/0pFQp0MN/image.jpg" as="image" />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <MovieProvider>
            <div className="min-h-screen bg-white text-black transition-colors">
              <Header />
              <main className="pt-16">{children}</main>
              <Footer />
            </div>
          </MovieProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
