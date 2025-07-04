"use client"

import type React from "react"
import { useEffect, useState, useRef, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"
import type { Movie } from "@/contexts/MovieContext"

// Plyr types
interface PlyrOptions {
  controls?: string[]
  settings?: string[]
  quality?: {
    default: string
    options: string[]
    forced: boolean
    onChange: (quality: string) => void
  }
  speed?: {
    selected: number
    options: number[]
  }
  autoplay?: boolean
  muted?: boolean
  volume?: number
  clickToPlay?: boolean
  hideControls?: boolean
  resetOnEnd?: boolean
  keyboard?: {
    focused: boolean
    global: boolean
  }
  tooltips?: {
    controls: boolean
    seek: boolean
  }
  captions?: {
    active: boolean
    language: string
  }
  fullscreen?: {
    enabled: boolean
    fallback: boolean
    iosNative: boolean
  }
  pip?: {
    enabled: boolean
  }
}

interface PlyrInstance {
  play: () => Promise<void>
  pause: () => void
  stop: () => void
  restart: () => void
  rewind: (seekTime?: number) => void
  forward: (seekTime?: number) => void
  increaseVolume: (step?: number) => void
  decreaseVolume: (step?: number) => void
  togglePlay: () => Promise<void>
  toggleMute: () => void
  toggleCaptions: () => void
  toggleFullscreen: () => void
  airplay: () => void
  pip: () => void
  on: (event: string, callback: (event: any) => void) => void
  off: (event: string, callback: (event: any) => void) => void
  once: (event: string, callback: (event: any) => void) => void
  destroy: () => void
  source: {
    type: string
    sources: Array<{
      src: string
      type: string
      size?: string
    }>
  }
  currentTime: number
  duration: number
  ended: boolean
  fullscreen: {
    active: boolean
    enabled: boolean
    enter: () => void
    exit: () => void
    toggle: () => void
  }
  loop: boolean
  muted: boolean
  paused: boolean
  pip: boolean
  playing: boolean
  quality: string
  speed: number
  volume: number
  ratio: string
  download: string
  poster: string
}

declare global {
  interface Window {
    Plyr: {
      new (selector: string | Element, options?: PlyrOptions): PlyrInstance
    }
  }
}

export default function WatchPage() {
  const params = useParams()
  const id = params.id as string
  const [movie, setMovie] = useState<Movie | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [plyrLoaded, setPlyrLoaded] = useState(false)
  const [isBuffering, setIsBuffering] = useState(true)

  const videoRef = useRef<HTMLVideoElement>(null)
  const plyrRef = useRef<PlyrInstance | null>(null)
  const [currentQuality, setCurrentQuality] = useState<"480p" | "720p" | "1080p">("720p")

  // Load Plyr CSS and JS
  useEffect(() => {
    const loadPlyr = async () => {
      // Load Plyr CSS
      const cssLink = document.createElement("link")
      cssLink.rel = "stylesheet"
      cssLink.href = "https://cdnjs.cloudflare.com/ajax/libs/plyr/3.7.8/plyr.css"
      document.head.appendChild(cssLink)

      // Load Plyr JS
      const script = document.createElement("script")
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/plyr/3.7.8/plyr.min.js"
      script.onload = () => setPlyrLoaded(true)
      document.head.appendChild(script)

      return () => {
        document.head.removeChild(cssLink)
        document.head.removeChild(script)
      }
    }

    loadPlyr()
  }, [])

  // Fetch movie data
  useEffect(() => {
    const fetchMovie = async (movieId: string) => {
      setLoading(true)
      try {
        const response = await fetch(`https://web-production-6321.up.railway.app/movies/${movieId}`)
        if (!response.ok) throw new Error("Movie not found")
        const movieData: Movie = await response.json()
        setMovie(movieData)
        setCurrentQuality("720p")
      } catch (err) {
        setError("Failed to fetch movie details.")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchMovie(id)
    }
  }, [id])

  // Initialize Plyr when both movie data and Plyr are loaded
  useEffect(() => {
    if (movie && plyrLoaded && videoRef.current && !plyrRef.current) {
      // Get available qualities
      const availableQualities = []
      const sources = []

      if (movie.video_link_480p) {
        availableQualities.push("480p")
        sources.push({
          src: movie.video_link_480p,
          type: "video/mp4",
          size: "480"
        })
      }
      if (movie.video_link_720p) {
        availableQualities.push("720p")
        sources.push({
          src: movie.video_link_720p,
          type: "video/mp4",
          size: "720"
        })
      }
      if (movie.video_link_1080p) {
        availableQualities.push("1080p")
        sources.push({
          src: movie.video_link_1080p,
          type: "video/mp4",
          size: "1080"
        })
      }

      const plyrOptions: PlyrOptions = {
        controls: [
          "play-large",
          "play",
          "progress",
          "current-time",
          "mute",
          "volume",
          "captions",
          "settings",
          "pip",
          "airplay",
          "fullscreen"
        ],
        settings: ["captions", "quality", "speed"],
        quality: {
          default: "720",
          options: sources.map(s => s.size || "720"),
          forced: true,
          onChange: (quality: string) => {
            const qualityMap: { [key: string]: "480p" | "720p" | "1080p" } = {
              "480": "480p",
              "720": "720p",
              "1080": "1080p"
            }
            setCurrentQuality(qualityMap[quality] || "720p")
          }
        },
        speed: {
          selected: 1,
          options: [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
        },
        autoplay: true,
        muted: false,
        volume: 1,
        clickToPlay: true,
        hideControls: true,
        resetOnEnd: false,
        keyboard: {
          focused: true,
          global: true
        },
        tooltips: {
          controls: true,
          seek: true
        },
        captions: {
          active: false,
          language: "en"
        },
        fullscreen: {
          enabled: true,
          fallback: true,
          iosNative: true
        },
        pip: {
          enabled: true
        }
      }

      // Initialize Plyr
      plyrRef.current = new window.Plyr(videoRef.current, plyrOptions)

      // Set video source
      plyrRef.current.source = {
        type: "video",
        sources: sources
      }

      // Add event listeners
      plyrRef.current.on("loadedmetadata", () => {
        setIsBuffering(false)
      })

      plyrRef.current.on("waiting", () => {
        setIsBuffering(true)
      })

      plyrRef.current.on("playing", () => {
        setIsBuffering(false)
      })

      plyrRef.current.on("seeking", () => {
        setIsBuffering(true)
      })

      plyrRef.current.on("seeked", () => {
        setIsBuffering(false)
      })

      plyrRef.current.on("qualitychange", (event) => {
        const quality = event.detail.quality
        const qualityMap: { [key: string]: "480p" | "720p" | "1080p" } = {
          "480": "480p",
          "720": "720p",
          "1080": "1080p"
        }
        setCurrentQuality(qualityMap[quality] || "720p")
      })

      plyrRef.current.on("error", (event) => {
        console.error("Plyr error:", event.detail)
        setError("Video playback error occurred.")
      })
    }

    // Cleanup function
    return () => {
      if (plyrRef.current) {
        plyrRef.current.destroy()
        plyrRef.current = null
      }
    }
  }, [movie, plyrLoaded])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-gray-400 mb-4">{error || "Movie details could not be loaded."}</p>
          <Link
            href="/home"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center p-4 sm:p-6 lg:p-8">
      {/* Back Button */}
      <div className="w-full max-w-6xl mb-6">
        <Link
          href={`/movie/${movie.id}`}
          className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Movie Details</span>
        </Link>
      </div>

      {/* Movie Title */}
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-8 max-w-6xl w-full">
        {movie.title.split("(")[0].trim()}
      </h1>

      {/* Video Player Container */}
      <div className="w-full max-w-4xl bg-gray-900 rounded-lg shadow-lg overflow-hidden">
        <div className="relative w-full aspect-video bg-black">
          {/* Plyr Video Player */}
          <video
            ref={videoRef}
            className="w-full h-full"
            playsInline
            crossOrigin="anonymous"
          />

          {/* Loading Spinner Overlay */}
          {(isBuffering || !plyrLoaded) && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-50">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
            </div>
          )}

          {/* Custom Plyr Styling */}
          <style jsx>{`
            :global(.plyr) {
              border-radius: 0;
            }
            :global(.plyr--video) {
              background: black;
            }
            :global(.plyr__controls) {
              background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
              color: white;
            }
            :global(.plyr__control) {
              color: white;
            }
            :global(.plyr__control:hover) {
              background: rgba(255, 255, 255, 0.1);
            }
            :global(.plyr__control--pressed) {
              background: rgba(59, 130, 246, 0.8);
            }
            :global(.plyr__progress__buffer) {
              background: rgba(255, 255, 255, 0.2);
            }
            :global(.plyr__progress__played) {
              background: #3b82f6;
            }
            :global(.plyr__volume__input) {
              background: rgba(255, 255, 255, 0.2);
            }
            :global(.plyr__volume__input::-webkit-slider-thumb) {
              background: #3b82f6;
            }
            :global(.plyr__menu) {
              background: rgba(0, 0, 0, 0.9);
              border: 1px solid rgba(255, 255, 255, 0.1);
            }
            :global(.plyr__menu__item) {
              color: white;
            }
            :global(.plyr__menu__item:hover) {
              background: rgba(59, 130, 246, 0.8);
            }
            :global(.plyr__menu__item--active) {
              background: rgba(59, 130, 246, 0.6);
            }
            :global(.plyr__tooltip) {
              background: rgba(0, 0, 0, 0.9);
              color: white;
            }
          `}</style>
        </div>
      </div>

      {/* Quality Indicator */}
      <div className="mt-4 text-center">
        <span className="text-sm text-gray-400">
          Current Quality: <span className="text-blue-400 font-medium">{currentQuality}</span>
        </span>
      </div>
    </div>
  )
}
