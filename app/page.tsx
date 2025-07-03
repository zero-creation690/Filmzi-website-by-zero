"use client"

import Link from "next/link"
import { Play, Star, Shield, Zap, Heart, ArrowRight, Download } from "lucide-react"

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-black overflow-hidden">
      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header Section with CTA */}
        <section className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center max-w-4xl mx-auto">
            {/* Logo & Brand */}
            <div className="mb-8 animate-fade-in">
              <div className="inline-block p-4 bg-white/10 backdrop-blur-sm rounded-3xl mb-6 shadow-2xl">
                <img
                  src="https://i.ibb.co/0pFQp0MN/image.jpg"
                  alt="Filmzi"
                  className="h-16 w-16 rounded-2xl"
                  loading="eager"
                />
              </div>
              <h1 className="text-6xl md:text-8xl font-black text-white mb-4 tracking-tight">
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Filmzi
                </span>
              </h1>
              <p className="text-2xl md:text-3xl text-blue-300 font-bold mb-2">Movie Downloader</p>
              <p className="text-lg text-blue-300">Free • Direct • Forever</p>
            </div>

            {/* Main CTA Button - White and Blue Colors */}
            <div className="mb-12 animate-bounce-slow">
              <Link
                href="/home"
                className="group inline-flex items-center space-x-4 bg-white hover:bg-blue-50 text-blue-600 hover:text-blue-700 px-12 py-6 rounded-2xl font-bold text-xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 border-2 border-blue-500 hover:border-blue-600"
              >
                <Play className="h-8 w-8 group-hover:scale-110 transition-transform" />
                <span>Enter Filmzi</span>
                <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Quick Features */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/15 transition-all duration-300 hover:scale-105">
                <Star className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                <p className="text-white font-semibold text-sm">HD Quality</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/15 transition-all duration-300 hover:scale-105">
                <Shield className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <p className="text-white font-semibold text-sm">Ad-Free</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/15 transition-all duration-300 hover:scale-105">
                <Zap className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                <p className="text-white font-semibold text-sm">Instant</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/15 transition-all duration-300 hover:scale-105">
                <Heart className="h-8 w-8 text-red-400 mx-auto mb-2" />
                <p className="text-white font-semibold text-sm">Free</p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex justify-center space-x-8 text-center mb-8">
              <div>
                <div className="text-3xl font-bold text-white">150+</div>
                <div className="text-blue-300 text-sm">Movies</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">0</div>
                <div className="text-blue-300 text-sm">Ads</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">100%</div>
                <div className="text-blue-300 text-sm">Free</div>
              </div>
            </div>

            {/* Secondary CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/about"
                className="bg-white/10 backdrop-blur-sm text-white border border-white/30 px-6 py-3 rounded-xl font-medium hover:bg-white/20 transition-all duration-300 flex items-center space-x-2"
              >
                <Download className="h-5 w-5" />
                <span>Learn More</span>
              </Link>
              <a
                href="https://t.me/filmzi2"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-300 hover:text-white transition-colors font-medium"
              >
                Join Telegram →
              </a>
            </div>
          </div>
        </section>

        {/* Bottom Features - Minimal for Fast Loading */}
        <section className="py-8 bg-black/20 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="group hover:scale-105 transition-transform duration-300">
                <div className="bg-blue-500/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Download className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="text-white font-semibold mb-1">Direct Downloads</h3>
                <p className="text-blue-300 text-sm">No redirects, no waiting</p>
              </div>

              <div className="group hover:scale-105 transition-transform duration-300">
                <div className="bg-green-500/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Shield className="h-6 w-6 text-green-400" />
                </div>
                <h3 className="text-white font-semibold mb-1">Safe & Clean</h3>
                <p className="text-blue-300 text-sm">No malware, no popups</p>
              </div>

              <div className="group hover:scale-105 transition-transform duration-300">
                <div className="bg-purple-500/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Star className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="text-white font-semibold mb-1">HD Quality</h3>
                <p className="text-blue-300 text-sm">480p, 720p, 1080p</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
