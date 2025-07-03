"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react" // Removed Sun, Moon imports

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  // Removed useTheme import and usage
  const pathname = usePathname()

  // Don't show header on welcome page
  if (pathname === "/") {
    return null
  }

  const navLinks = [
    { name: "Home", path: "/home" },
    { name: "About", path: "/about" },
  ]

  const isActive = (path: string) => pathname === path

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/home" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <img
              src="https://i.ibb.co/0pFQp0MN/image.jpg"
              alt="Filmzi Logo"
              className="h-8 w-8 rounded"
              loading="eager"
            />
            <div>
              <h1 className="text-xl font-bold text-blue-600">Filmzi</h1>
              <p className="text-xs text-gray-500 hidden sm:block">Download Movies. Free. Direct. Forever.</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.path}
                className={`text-sm font-medium transition-colors hover:text-blue-500 ${
                  isActive(link.path) ? "text-blue-600" : "text-gray-700"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Mobile Menu button (Theme Toggle removed) */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-5 w-5 text-gray-700" /> : <Menu className="h-5 w-5 text-gray-700" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.path) ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
