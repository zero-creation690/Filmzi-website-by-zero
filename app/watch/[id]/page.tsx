"use client"

import type React from "react"
import { useEffect, useState, useRef, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  PictureInPicture2,
  Loader2,
  Download,
  Cast,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import type { Movie } from "@/contexts/MovieContext"

export default function WatchPage() {
  const params = useParams()
  const id = params.id as string
  const [movie, setMovie] = useState<Movie | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Video states
  const [currentQuality, setCurrentQuality] = useState<"480p" | "720p" | "1080p">("720p")
  const [videoSrc, setVideoSrc] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [showSettings, setShowSettings] = useState(false)

  // Available qualities
  const [availableQualities, setAvailableQualities] = useState<
    Array<{ quality: "480p" | "720p" | "1080p"; url: string; label: string }>
  >([])

  // Process video URL for better compatibility
  const processVideoUrl = useCallback((url: string): string => {
    if (!url) return ""

    try {
      // Handle PixelDrain URLs
      if (url.includes("pixeldrain.com")) {
        const fileId = url.match(/\/u\/([a-zA-Z0-9]+)/)?.[1]
        if (fileId) {
          return `https://pixeldrain.com/api/file/${fileId}?download`
        }
      }

      // Handle Google Drive URLs
      if (url.includes("drive.google.com")) {
        const fileId = url.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1]
        if (fileId) {
          return `https://drive.google.com/uc?export=download&id=${fileId}`
        }
      }

      // Handle Archive.org URLs
      if (url.includes("archive.org")) {
        return url.replace("/details/", "/download/")
      }

      return url
    } catch (e) {
      return url
    }
  }, [])

  // Fetch movie data - FAST loading
  useEffect(() => {
    const fetchMovie = async () => {
      if (!id) return

      setLoading(true)
      setError(null)

      try {
        // Fast fetch with short timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

        const response = await fetch(`https://web-production-6321.up.railway.app/movies/${id}`, {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
            "Cache-Control": "no-cache",
          },
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`Movie not found (${response.status})`)
        }

        const movieData: Movie = await response.json()
        setMovie(movieData)

        // Process and set available qualities
        const qualities = []
        if (movieData.video_link_480p) {
          qualities.push({
            quality: "480p" as const,
            url: processVideoUrl(movieData.video_link_480p),
            label: "480P",
          })
        }
        if (movieData.video_link_720p) {
          qualities.push({
            quality: "720p" as const,
            url: processVideoUrl(movieData.video_link_720p),
            label: "720P",
          })
        }
        if (movieData.video_link_1080p) {
          qualities.push({
            quality: "1080p" as const,
            url: processVideoUrl(movieData.video_link_1080p),
            label: "1080P",
          })
        }

        setAvailableQualities(qualities)

        // Set default quality (prefer 720p, fallback to available)
        const defaultQuality = qualities.find((q) => q.quality === "720p") || qualities[0]
        if (defaultQuality) {
          setCurrentQuality(defaultQuality.quality)
          setVideoSrc(defaultQuality.url)
        }
      } catch (err: any) {
        console.error("Fetch error:", err)
        if (err.name === "AbortError") {
          setError("Loading timeout. Please check your connection and try again.")
        } else {
          setError(`Failed to load movie: ${err.message}`)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchMovie()
  }, [id, processVideoUrl])

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  // Auto-hide controls
  useEffect(() => {
    let timeout: NodeJS.Timeout

    const resetTimeout = () => {
      clearTimeout(timeout)
      setShowControls(true)
      if (isPlaying) {
        timeout = setTimeout(() => setShowControls(false), 3000)
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener("mousemove", resetTimeout)
      container.addEventListener("click", resetTimeout)
    }

    return () => {
      clearTimeout(timeout)
      if (container) {
        container.removeEventListener("mousemove", resetTimeout)
        container.removeEventListener("click", resetTimeout)
      }
    }
  }, [isPlaying])

  // Video event handlers
  const handlePlay = () => setIsPlaying(true)
  const handlePause = () => setIsPlaying(false)
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
      setIsBuffering(false)
    }
  }
  const handleWaiting = () => setIsBuffering(true)
  const handleCanPlay = () => setIsBuffering(false)

  // Control functions
  const togglePlayPause = () => {
    if (!videoRef.current) return

    if (videoRef.current.paused) {
      videoRef.current.play().catch(console.error)
    } else {
      videoRef.current.pause()
    }
  }

  const toggleMute = () => {
    if (!videoRef.current) return
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return
    const newVolume = Number.parseFloat(e.target.value)
    videoRef.current.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return
    const newTime = Number.parseFloat(e.target.value)
    videoRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(console.error)
    } else {
      document.exitFullscreen().catch(console.error)
    }
  }

  const togglePiP = () => {
    if (!videoRef.current || !document.pictureInPictureEnabled) return

    if (document.pictureInPictureElement) {
      document.exitPictureInPicture().catch(console.error)
    } else {
      videoRef.current.requestPictureInPicture().catch(console.error)
    }
  }

  const changeQuality = (quality: "480p" | "720p" | "1080p") => {
    const qualityOption = availableQualities.find((q) => q.quality === quality)
    if (!qualityOption || !videoRef.current) return

    const currentTimeBackup = videoRef.current.currentTime
    const wasPlaying = !videoRef.current.paused

    setIsBuffering(true)
    setCurrentQuality(quality)
    setVideoSrc(qualityOption.url)

    // Restore state after load
    const restoreState = () => {
      if (videoRef.current) {
        videoRef.current.currentTime = currentTimeBackup
        if (wasPlaying) {
          videoRef.current.play().catch(console.error)
        }
      }
      setIsBuffering(false)
    }

    setTimeout(restoreState, 100)
  }

  const changeSpeed = (speed: number) => {
    if (!videoRef.current) return
    videoRef.current.playbackRate = speed
    setPlaybackSpeed(speed)
    setShowSettings(false)
  }

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return "0:00"

    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const retry = () => {
    setError(null)
    setLoading(true)
    window.location.reload()
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-lg">Loading movie...</p>
          <p className="text-sm text-gray-400 mt-2">This should only take a few seconds</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !movie || !videoSrc) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center text-white max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Unable to Load Video</h2>
          <p className="text-gray-300 mb-6">{error || "No video source available"}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={retry}
              className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
            <Link href="/home" className="bg-gray-600 hover:bg-gray-700 px-6 py-2 rounded-lg transition-colors">
              Go Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header - hidden in fullscreen */}
      {!isFullScreen && (
        <div className="p-4">
          <Link
            href={`/movie/${movie.id}`}
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Movie
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold mt-4 text-center">{movie.title.split("(")[0].trim()}</h1>
        </div>
      )}

      {/* Video Player */}
      <div ref={containerRef} className={`relative ${isFullScreen ? "h-screen" : "max-w-6xl mx-auto"} bg-black`}>
        <div className="relative w-full aspect-video bg-black">
          {/* Video Element */}
          <video
            ref={videoRef}
            src={videoSrc}
            className="w-full h-full object-contain"
            onPlay={handlePlay}
            onPause={handlePause}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onWaiting={handleWaiting}
            onCanPlay={handleCanPlay}
            onError={() => setError("Video playback error. Please try a different quality.")}
            playsInline
            crossOrigin="anonymous"
            preload="metadata"
            autoPlay
          />

          {/* Loading Overlay */}
          {isBuffering && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          )}

          {/* Controls Overlay */}
          <div
            className={`absolute inset-0 flex flex-col justify-end transition-opacity duration-300 ${
              showControls ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

            {/* Controls */}
            <div className="relative p-4 bg-black/90">
              {/* Progress Bar */}
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer mb-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500"
              />

              {/* Main Controls */}
              <div className="flex items-center justify-between">
                {/* Left Controls */}
                <div className="flex items-center gap-3">
                  <button onClick={togglePlayPause} className="p-2 rounded-full hover:bg-white/20 transition-colors">
                    {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                  </button>

                  <button onClick={toggleMute} className="p-2 rounded-full hover:bg-white/20 transition-colors">
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                  </button>

                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                  />

                  <span className="hidden sm:block text-sm font-medium ml-4 max-w-xs truncate">
                    {movie.title.split("(")[0].trim()}
                  </span>
                </div>

                {/* Center - Time */}
                <div className="hidden sm:flex items-center gap-2 text-sm">
                  <span>{formatTime(currentTime)}</span>
                  <span>/</span>
                  <span>{formatTime(duration)}</span>
                </div>

                {/* Right Controls */}
                <div className="flex items-center gap-2">
                  {/* Quality Selector */}
                  <select
                    value={currentQuality}
                    onChange={(e) => changeQuality(e.target.value as "480p" | "720p" | "1080p")}
                    className="bg-white/20 text-white text-sm px-2 py-1 rounded border-none outline-none cursor-pointer hover:bg-white/30 transition-colors"
                  >
                    {availableQualities.map((q) => (
                      <option key={q.quality} value={q.quality} className="bg-black">
                        {q.label}
                      </option>
                    ))}
                  </select>

                  {/* Download */}
                  <button
                    onClick={() => window.open(videoSrc, "_blank")}
                    className="p-2 rounded-full hover:bg-white/20 transition-colors"
                    title="Download"
                  >
                    <Download className="h-5 w-5" />
                  </button>

                  {/* Cast */}
                  <button
                    onClick={() => alert("Cast feature coming soon!")}
                    className="p-2 rounded-full hover:bg-white/20 transition-colors"
                    title="Cast"
                  >
                    <Cast className="h-5 w-5" />
                  </button>

                  {/* Settings */}
                  <div className="relative">
                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className="p-2 rounded-full hover:bg-white/20 transition-colors"
                      title="Settings"
                    >
                      <Settings className="h-5 w-5" />
                    </button>

                    {showSettings && (
                      <div className="absolute bottom-full right-0 mb-2 w-48 bg-gray-900 rounded-lg shadow-xl border border-purple-500 p-3">
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-gray-300 mb-2">Playback Speed</div>
                          {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                            <button
                              key={speed}
                              onClick={() => changeSpeed(speed)}
                              className={`w-full text-left px-2 py-1 rounded text-sm transition-colors ${
                                playbackSpeed === speed ? "bg-purple-600 text-white" : "text-gray-300 hover:bg-gray-700"
                              }`}
                            >
                              {speed === 1 ? "Normal" : `${speed}x`}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Picture-in-Picture */}
                  {document.pictureInPictureEnabled && (
                    <button
                      onClick={togglePiP}
                      className="p-2 rounded-full hover:bg-white/20 transition-colors"
                      title="Picture-in-Picture"
                    >
                      <PictureInPicture2 className="h-5 w-5" />
                    </button>
                  )}

                  {/* Fullscreen */}
                  <button
                    onClick={toggleFullscreen}
                    className="p-2 rounded-full hover:bg-white/20 transition-colors"
                    title="Fullscreen"
                  >
                    {isFullScreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Mobile Time Display */}
              <div className="sm:hidden flex justify-center mt-2 text-sm">
                <span>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
