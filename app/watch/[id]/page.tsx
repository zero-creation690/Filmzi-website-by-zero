"use client"

import type React from "react"
import { useEffect, useState, useRef, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import type { Movie } from "@/contexts/MovieContext"

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
  // Enhanced buffering options
  preload?: string
  crossorigin?: string
  playsinline?: boolean
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
  buffered: number
  media: HTMLVideoElement
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
  const [isBuffering, setIsBuffering] = useState(false)
  const [networkSpeed, setNetworkSpeed] = useState<'slow' | 'normal' | 'fast'>('normal')

  const videoRef = useRef<HTMLVideoElement>(null)
  const plyrRef = useRef<PlyrInstance | null>(null)
  const [currentQuality, setCurrentQuality] = useState<"720p" | "1080p">("720p")
  const retryCountRef = useRef(0)
  const maxRetries = 3

  // Network speed detection
  const detectNetworkSpeed = useCallback(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      if (connection) {
        const effectiveType = connection.effectiveType
        if (effectiveType === 'slow-2g' || effectiveType === '2g') {
          setNetworkSpeed('slow')
        } else if (effectiveType === '3g') {
          setNetworkSpeed('normal')
        } else {
          setNetworkSpeed('fast')
        }
      }
    }
  }, [])

  useEffect(() => {
    detectNetworkSpeed()
  }, [detectNetworkSpeed])

  useEffect(() => {
    const loadPlyr = async () => {
      try {
        // Check if Plyr is already loaded
        if (window.Plyr) {
          setPlyrLoaded(true)
          return
        }

        const cssLink = document.createElement("link")
        cssLink.rel = "stylesheet"
        cssLink.href = "https://cdnjs.cloudflare.com/ajax/libs/plyr/3.7.8/plyr.css"
        cssLink.onload = () => console.log("Plyr CSS loaded")
        cssLink.onerror = () => console.error("Failed to load Plyr CSS")
        document.head.appendChild(cssLink)

        const script = document.createElement("script")
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/plyr/3.7.8/plyr.min.js"
        script.onload = () => {
          console.log("Plyr JS loaded")
          setPlyrLoaded(true)
        }
        script.onerror = () => {
          console.error("Failed to load Plyr JS")
          setError("Failed to load video player")
        }
        document.head.appendChild(script)

        return () => {
          if (document.head.contains(cssLink)) {
            document.head.removeChild(cssLink)
          }
          if (document.head.contains(script)) {
            document.head.removeChild(script)
          }
        }
      } catch (err) {
        console.error("Error loading Plyr:", err)
        setError("Failed to initialize video player")
      }
    }

    loadPlyr()
  }, [])

  useEffect(() => {
    const fetchMovie = async (movieId: string) => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`https://web-production-6321.up.railway.app/movies/${movieId}`)
        if (!response.ok) throw new Error("Movie not found")
        const movieData: Movie = await response.json()
        setMovie(movieData)
        
        // Auto-select quality based on network speed
        if (networkSpeed === 'slow' || !movieData.video_link_1080p) {
          setCurrentQuality("720p")
        } else if (networkSpeed === 'fast' && movieData.video_link_1080p) {
          setCurrentQuality("1080p")
        } else {
          setCurrentQuality("720p")
        }
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
  }, [id, networkSpeed])

  // Enhanced video source handling with fallback
  const getVideoSources = useCallback(() => {
    if (!movie) return []
    
    const sources = []
    
    // Add sources based on availability and network speed
    if (movie.video_link_720p) {
      sources.push({
        src: movie.video_link_720p,
        type: "video/mp4",
        size: "720"
      })
    }
    
    if (movie.video_link_1080p && networkSpeed !== 'slow') {
      sources.push({
        src: movie.video_link_1080p,
        type: "video/mp4",
        size: "1080"
      })
    }
    
    return sources
  }, [movie, networkSpeed])

  // Retry mechanism for failed video loads
  const retryVideoLoad = useCallback(() => {
    if (retryCountRef.current < maxRetries && plyrRef.current) {
      retryCountRef.current++
      console.log(`Retrying video load (attempt ${retryCountRef.current}/${maxRetries})`)
      
      setTimeout(() => {
        if (plyrRef.current) {
          const sources = getVideoSources()
          plyrRef.current.source = {
            type: "video",
            sources
          }
        }
      }, 1000 * retryCountRef.current) // Exponential backoff
    }
  }, [getVideoSources])

  useEffect(() => {
    if (movie && plyrLoaded && videoRef.current && !plyrRef.current) {
      const sources = getVideoSources()
      
      if (sources.length === 0) {
        setError("No video sources available")
        return
      }

      // Enhanced Plyr options for better performance
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
          default: networkSpeed === 'slow' ? "720" : "720",
          options: sources.map(s => s.size || "720"),
          forced: true,
          onChange: (quality: string) => {
            const qualityMap: { [key: string]: "720p" | "1080p" } = {
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
        autoplay: false, // Disable autoplay for better UX
        muted: false,
        volume: 0.8,
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
        },
        preload: networkSpeed === 'slow' ? 'metadata' : 'auto',
        crossorigin: 'anonymous',
        playsinline: true
      }

      try {
        plyrRef.current = new window.Plyr(videoRef.current, plyrOptions)
        plyrRef.current.source = {
          type: "video",
          sources
        }

        // Enhanced event handlers
        plyrRef.current.on("ready", () => {
          console.log("Plyr ready")
          retryCountRef.current = 0 // Reset retry count on success
        })

        plyrRef.current.on("qualitychange", (event) => {
          const quality = event.detail.quality
          const qualityMap: { [key: string]: "720p" | "1080p" } = {
            "720": "720p",
            "1080": "1080p"
          }
          setCurrentQuality(qualityMap[quality] || "720p")
        })

        plyrRef.current.on("error", (event) => {
          console.error("Plyr error:", event.detail)
          setError("Video playback error occurred.")
          retryVideoLoad()
        })

        plyrRef.current.on("loadstart", () => {
          setIsBuffering(true)
        })

        plyrRef.current.on("canplay", () => {
          setIsBuffering(false)
        })

        plyrRef.current.on("waiting", () => {
          setIsBuffering(true)
        })

        plyrRef.current.on("playing", () => {
          setIsBuffering(false)
        })

        plyrRef.current.on("stalled", () => {
          console.log("Video stalled, attempting to recover")
          setIsBuffering(true)
        })

        plyrRef.current.on("suspend", () => {
          console.log("Video suspended")
        })

        plyrRef.current.on("abort", () => {
          console.log("Video aborted")
          retryVideoLoad()
        })

        // Network state monitoring
        plyrRef.current.on("progress", () => {
          if (plyrRef.current?.media) {
            const buffered = plyrRef.current.media.buffered
            if (buffered.length > 0) {
              const bufferedEnd = buffered.end(buffered.length - 1)
              const duration = plyrRef.current.media.duration
              if (duration > 0) {
                const bufferedPercent = (bufferedEnd / duration) * 100
                console.log(`Buffered: ${bufferedPercent.toFixed(1)}%`)
              }
            }
          }
        })

        // Add video element specific optimizations
        if (videoRef.current) {
          videoRef.current.preload = networkSpeed === 'slow' ? 'metadata' : 'auto'
          videoRef.current.crossOrigin = 'anonymous'
          videoRef.current.playsInline = true
          
          // Add additional buffer optimization
          videoRef.current.addEventListener('loadedmetadata', () => {
            console.log('Video metadata loaded')
          })
          
          videoRef.current.addEventListener('loadeddata', () => {
            console.log('Video data loaded')
          })
        }

      } catch (err) {
        console.error("Error initializing Plyr:", err)
        setError("Failed to initialize video player")
      }
    }

    return () => {
      if (plyrRef.current) {
        try {
          plyrRef.current.destroy()
        } catch (err) {
          console.error("Error destroying Plyr:", err)
        }
        plyrRef.current = null
      }
    }
  }, [movie, plyrLoaded, getVideoSources, networkSpeed, retryVideoLoad])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mb-4"></div>
          <p className="text-gray-400">Loading movie...</p>
        </div>
      </div>
    )
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-gray-400 mb-4">{error || "Movie details could not be loaded."}</p>
          <div className="space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Retry
            </button>
            <Link
              href="/home"
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-block"
            >
              Go Home
            </Link>
          </div>
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
          {/* Buffering Indicator */}
          {isBuffering && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mb-4"></div>
                <p className="text-white text-sm">Buffering...</p>
              </div>
            </div>
          )}
          
          <video
            ref={videoRef}
            className="w-full h-full"
            playsInline
            crossOrigin="anonymous"
            poster={movie.thumbnail_url}
            preload={networkSpeed === 'slow' ? 'metadata' : 'auto'}
          />
          
          <style jsx>{`
            :global(.plyr) {
              border-radius: 0;
              font-family: inherit;
            }
            :global(.plyr--video) {
              background: black;
            }
            :global(.plyr__controls) {
              background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
              color: white;
              padding: 20px;
            }
            :global(.plyr__control) {
              color: white;
              transition: all 0.2s ease;
            }
            :global(.plyr__control:hover) {
              background: rgba(255, 255, 255, 0.1);
              transform: scale(1.05);
            }
            :global(.plyr__control--pressed) {
              background: rgba(59, 130, 246, 0.8);
            }
            :global(.plyr__progress) {
              height: 8px;
            }
            :global(.plyr__progress__buffer) {
              background: rgba(255, 255, 255, 0.2);
              height: 100%;
            }
            :global(.plyr__progress__played) {
              background: linear-gradient(90deg, #3b82f6, #1d4ed8);
              height: 100%;
            }
            :global(.plyr__volume__input) {
              background: rgba(255, 255, 255, 0.2);
            }
            :global(.plyr__volume__input::-webkit-slider-thumb) {
              background: #3b82f6;
              border: 2px solid white;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            }
            :global(.plyr__menu) {
              background: rgba(0, 0, 0, 0.95);
              border: 1px solid rgba(255, 255, 255, 0.1);
              backdrop-filter: blur(10px);
            }
            :global(.plyr__menu__item) {
              color: white;
              padding: 12px 16px;
              transition: all 0.2s ease;
            }
            :global(.plyr__menu__item:hover) {
              background: rgba(59, 130, 246, 0.8);
              transform: translateX(4px);
            }
            :global(.plyr__menu__item--active) {
              background: rgba(59, 130, 246, 0.6);
              border-left: 3px solid #3b82f6;
            }
            :global(.plyr__tooltip) {
              background: rgba(0, 0, 0, 0.9);
              color: white;
              border-radius: 6px;
              padding: 8px 12px;
              font-size: 12px;
              backdrop-filter: blur(10px);
            }
            :global(.plyr__poster) {
              background-size: cover;
              background-position: center;
              opacity: 0.8;
            }
            :global(.plyr--loading .plyr__control) {
              opacity: 0.7;
              pointer-events: none;
            }
          `}</style>
        </div>
      </div>

      {/* Enhanced Status Information */}
      <div className="mt-4 text-center space-y-2">
        <div className="flex items-center justify-center space-x-4 text-sm">
          <span className="text-gray-400">
            Quality: <span className="text-blue-400 font-medium">{currentQuality}</span>
          </span>
          <span className="text-gray-400">
            Network: <span className="text-green-400 font-medium capitalize">{networkSpeed}</span>
          </span>
          {retryCountRef.current > 0 && (
            <span className="text-yellow-400">
              Retries: {retryCountRef.current}/{maxRetries}
            </span>
          )}
        </div>
        
        {networkSpeed === 'slow' && (
          <p className="text-xs text-yellow-400">
            Slow network detected - optimized for better buffering
          </p>
        )}
      </div>
    </div>
  )
}
