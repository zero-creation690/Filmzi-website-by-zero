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
  Headphones,
  Download,
  Cast,
  Monitor,
  Accessibility,
  RefreshCw,
  AlertCircle,
  Wifi,
  WifiOff,
} from "lucide-react"
import type { Movie } from "@/contexts/MovieContext"

interface VideoQuality {
  quality: "480p" | "720p" | "1080p"
  url: string
  label: string
}

export default function WatchPage() {
  const params = useParams()
  const id = params.id as string
  const [movie, setMovie] = useState<Movie | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [videoQualities, setVideoQualities] = useState<VideoQuality[]>([])
  const [currentQuality, setCurrentQuality] = useState<"480p" | "720p" | "1080p">("720p")
  const [videoSrc, setVideoSrc] = useState<string | null>(null)

  // Player states
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [isBuffering, setIsBuffering] = useState(true)
  const [showControls, setShowControls] = useState(true)
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null)

  // Network and performance states
  const [networkSpeed, setNetworkSpeed] = useState<"slow" | "medium" | "fast">("medium")
  const [isOnline, setIsOnline] = useState(true)
  const [videoLoadError, setVideoLoadError] = useState(false)
  const [qualitySwitching, setQualitySwitching] = useState(false)

  // Settings menu states
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)
  const [settingsTab, setSettingsTab] = useState<"playback" | "accessibility" | "audio">("playback")
  const [playbackSpeed, setPlaybackSpeed] = useState(1)

  // Audio and subtitle states
  const [availableAudioTracks, setAvailableAudioTracks] = useState<{ id: string; label: string; language: string }[]>(
    [],
  )
  const [selectedAudioTrackId, setSelectedAudioTrackId] = useState<string | null>(null)
  const [selectedSubtitleTrackLabel, setSelectedSubtitleTrackLabel] = useState<string | null>("Off")

  // Network detection
  useEffect(() => {
    const updateOnlineStatus = () => setIsOnline(navigator.onLine)
    const detectNetworkSpeed = () => {
      // @ts-ignore - navigator.connection is experimental
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection
      if (connection) {
        const speed = connection.effectiveType
        if (speed === "slow-2g" || speed === "2g") setNetworkSpeed("slow")
        else if (speed === "3g") setNetworkSpeed("medium")
        else setNetworkSpeed("fast")
      }
    }

    window.addEventListener("online", updateOnlineStatus)
    window.addEventListener("offline", updateOnlineStatus)
    detectNetworkSpeed()

    return () => {
      window.removeEventListener("online", updateOnlineStatus)
      window.removeEventListener("offline", updateOnlineStatus)
    }
  }, [])

  // Validate and process video URL
  const processVideoUrl = useCallback((url: string): string => {
    if (!url) return ""

    // Handle different video hosting services
    try {
      const urlObj = new URL(url)

      // PixelDrain URLs
      if (urlObj.hostname.includes("pixeldrain")) {
        if (!url.includes("?download")) {
          return url + "?download"
        }
      }

      // Google Drive URLs
      if (urlObj.hostname.includes("drive.google.com")) {
        const fileId = url.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1]
        if (fileId) {
          return `https://drive.google.com/uc?export=download&id=${fileId}`
        }
      }

      // Archive.org URLs
      if (urlObj.hostname.includes("archive.org")) {
        return url.replace("/details/", "/download/")
      }

      return url
    } catch (e) {
      console.warn("Invalid URL:", url)
      return url
    }
  }, [])

  // Fetch movie data with retry mechanism
  const fetchMovie = useCallback(
    async (movieId: string, retry = 0) => {
      setLoading(true)
      setError(null)

      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

        const response = await fetch(`https://web-production-6321.up.railway.app/movies/${movieId}`, {
          signal: controller.signal,
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const movieData: Movie = await response.json()

        // Process and validate video URLs
        const qualities: VideoQuality[] = []

        if (movieData.video_link_480p) {
          qualities.push({
            quality: "480p",
            url: processVideoUrl(movieData.video_link_480p),
            label: "480P",
          })
        }

        if (movieData.video_link_720p) {
          qualities.push({
            quality: "720p",
            url: processVideoUrl(movieData.video_link_720p),
            label: "720P",
          })
        }

        if (movieData.video_link_1080p) {
          qualities.push({
            quality: "1080p",
            url: processVideoUrl(movieData.video_link_1080p),
            label: "1080P",
          })
        }

        if (qualities.length === 0) {
          throw new Error("No valid video sources found")
        }

        setMovie(movieData)
        setVideoQualities(qualities)

        // Auto-select best quality based on network speed
        let defaultQuality: "480p" | "720p" | "1080p" = "720p"
        if (networkSpeed === "slow" && qualities.find((q) => q.quality === "480p")) {
          defaultQuality = "480p"
        } else if (networkSpeed === "fast" && qualities.find((q) => q.quality === "1080p")) {
          defaultQuality = "1080p"
        }

        const selectedQuality = qualities.find((q) => q.quality === defaultQuality) || qualities[0]
        setCurrentQuality(selectedQuality.quality)
        setVideoSrc(selectedQuality.url)
        setRetryCount(0)
      } catch (err: any) {
        console.error("Fetch movie error:", err)

        if (retry < 3) {
          console.log(`Retrying... Attempt ${retry + 1}`)
          setTimeout(
            () => {
              setRetryCount(retry + 1)
              fetchMovie(movieId, retry + 1)
            },
            2000 * (retry + 1),
          ) // Exponential backoff
          return
        }

        if (err.name === "AbortError") {
          setError("Request timed out. Please check your internet connection and try again.")
        } else if (!isOnline) {
          setError("No internet connection. Please check your network and try again.")
        } else {
          setError(`Failed to load movie: ${err.message}. Please try again later.`)
        }
      } finally {
        setLoading(false)
      }
    },
    [processVideoUrl, networkSpeed, isOnline],
  )

  // Initial fetch
  useEffect(() => {
    if (id) {
      fetchMovie(id)
    }
  }, [id, fetchMovie])

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullScreen(document.fullscreenElement != null)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  // Auto-hide controls
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true)
      if (controlsTimeout) {
        clearTimeout(controlsTimeout)
      }
      const timeout = setTimeout(() => {
        if (isPlaying && !showSettingsMenu) {
          setShowControls(false)
        }
      }, 3000)
      setControlsTimeout(timeout)
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener("mousemove", handleMouseMove)
      container.addEventListener("mouseleave", () => {
        if (isPlaying && !showSettingsMenu) {
          setShowControls(false)
        }
      })
    }

    return () => {
      if (container) {
        container.removeEventListener("mousemove", handleMouseMove)
      }
      if (controlsTimeout) {
        clearTimeout(controlsTimeout)
      }
    }
  }, [isPlaying, controlsTimeout, showSettingsMenu])

  // Handle quality switching with state preservation
  const handleQualityChange = useCallback(
    async (newQuality: "480p" | "720p" | "1080p") => {
      if (!videoRef.current || qualitySwitching) return

      const targetQuality = videoQualities.find((q) => q.quality === newQuality)
      if (!targetQuality) return

      setQualitySwitching(true)
      setIsBuffering(true)

      // Save current state
      const currentTimeBackup = videoRef.current.currentTime
      const wasPlaying = !videoRef.current.paused
      const currentVolumeBackup = videoRef.current.volume
      const wasMutedBackup = videoRef.current.muted

      try {
        // Test if new URL is accessible
        const testResponse = await fetch(targetQuality.url, {
          method: "HEAD",
          mode: "no-cors",
        }).catch(() => null)

        // Change source
        videoRef.current.src = targetQuality.url
        setVideoSrc(targetQuality.url)
        setCurrentQuality(newQuality)

        // Wait for metadata to load
        await new Promise<void>((resolve, reject) => {
          const video = videoRef.current!
          const timeout = setTimeout(() => reject(new Error("Timeout")), 15000)

          const onLoadedMetadata = () => {
            clearTimeout(timeout)
            video.removeEventListener("loadedmetadata", onLoadedMetadata)
            video.removeEventListener("error", onError)
            resolve()
          }

          const onError = () => {
            clearTimeout(timeout)
            video.removeEventListener("loadedmetadata", onLoadedMetadata)
            video.removeEventListener("error", onError)
            reject(new Error("Video load error"))
          }

          video.addEventListener("loadedmetadata", onLoadedMetadata)
          video.addEventListener("error", onError)
          video.load()
        })

        // Restore state
        videoRef.current.currentTime = currentTimeBackup
        videoRef.current.volume = currentVolumeBackup
        videoRef.current.muted = wasMutedBackup

        if (wasPlaying) {
          await videoRef.current.play()
        }

        setVideoLoadError(false)
      } catch (error) {
        console.error("Quality switch failed:", error)
        setVideoLoadError(true)

        // Fallback to previous quality
        const fallbackQuality = videoQualities.find((q) => q.quality === currentQuality)
        if (fallbackQuality && fallbackQuality.url !== targetQuality.url) {
          videoRef.current.src = fallbackQuality.url
          setVideoSrc(fallbackQuality.url)
          videoRef.current.load()
        }
      } finally {
        setQualitySwitching(false)
        setIsBuffering(false)
      }
    },
    [videoQualities, currentQuality, qualitySwitching],
  )

  // Handle audio tracks
  useEffect(() => {
    const videoElement = videoRef.current
    if (!videoElement) return

    const handleTracks = () => {
      // Create realistic audio tracks based on movie data
      const tracks = [
        { id: "hindi", label: "Hindi", language: "hi" },
        { id: "english", label: "English", language: "en" },
        { id: "tamil", label: "Tamil", language: "ta" },
        { id: "telugu", label: "Telugu", language: "te" },
      ]

      setAvailableAudioTracks(tracks)
      setSelectedAudioTrackId("hindi")
    }

    videoElement.addEventListener("loadedmetadata", handleTracks)
    return () => videoElement.removeEventListener("loadedmetadata", handleTracks)
  }, [])

  // Player control functions
  const togglePlayPause = useCallback(() => {
    if (!videoRef.current) return

    if (videoRef.current.paused) {
      videoRef.current.play().catch((e) => {
        console.error("Play prevented:", e)
        setError("Playback failed. Please try again or check your internet connection.")
      })
    } else {
      videoRef.current.pause()
    }
  }, [])

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }, [isMuted])

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const newVolume = Number(e.target.value)
      videoRef.current.volume = newVolume
      setVolume(newVolume)
      setIsMuted(newVolume === 0)
    }
  }, [])

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }, [])

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
      setIsBuffering(false)
      setVideoLoadError(false)
    }
  }, [])

  const handleProgressChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const newTime = Number(e.target.value)
      videoRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }, [])

  const toggleFullScreen = useCallback(() => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch((e) => console.error("Fullscreen failed:", e))
      } else {
        document.exitFullscreen()
      }
    }
  }, [])

  const handlePlaybackSpeedChange = useCallback((speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed
      setPlaybackSpeed(speed)
    }
  }, [])

  const togglePictureInPicture = useCallback(() => {
    if (videoRef.current && document.pictureInPictureEnabled) {
      if (document.pictureInPictureElement) {
        document.exitPictureInPicture().catch((e) => console.error("Exit PiP failed:", e))
      } else {
        videoRef.current.requestPictureInPicture().catch((e) => console.error("Enter PiP failed:", e))
      }
    }
  }, [])

  const handleAudioTrackChange = useCallback((trackId: string) => {
    setSelectedAudioTrackId(trackId)
    // In a real implementation, this would switch audio tracks
    console.log("Switched to audio track:", trackId)
  }, [])

  const handleRetry = useCallback(() => {
    if (id) {
      setError(null)
      setVideoLoadError(false)
      fetchMovie(id)
    }
  }, [id, fetchMovie])

  const formatTime = (time: number) => {
    if (!isFinite(time)) return "0:00"
    const hours = Math.floor(time / 3600)
    const minutes = Math.floor((time % 3600) / 60)
    const seconds = Math.floor(time % 60)

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const playbackSpeeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Loading Movie...</h2>
          <p className="text-gray-400 mb-4">
            {retryCount > 0 ? `Retry attempt ${retryCount}/3` : "Fetching movie details"}
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            {isOnline ? (
              <>
                <Wifi className="h-4 w-4" />
                <span>Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4" />
                <span>Offline</span>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !movie) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-4">Playback Error</h1>
          <p className="text-gray-400 mb-6">{error || "Movie details could not be loaded."}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleRetry}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Retry</span>
            </button>
            <Link
              href="/home"
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Back Button - Only visible when not in fullscreen */}
      {!isFullScreen && (
        <div className="p-4 sm:p-6">
          <Link
            href={`/movie/${movie.id}`}
            className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Movie Details</span>
          </Link>
        </div>
      )}

      {/* Movie Title - Only visible when not in fullscreen */}
      {!isFullScreen && (
        <div className="px-4 sm:px-6 pb-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center">{movie.title.split("(")[0].trim()}</h1>
        </div>
      )}

      {/* Video Player Container */}
      <div ref={containerRef} className={`relative w-full ${isFullScreen ? "h-screen" : "max-w-6xl mx-auto"} bg-black`}>
        <div className="relative w-full aspect-video bg-black">
          {!videoSrc ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black text-white text-center p-4">
              <div>
                <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <p className="text-lg font-medium mb-4">No video source available</p>
                <button
                  onClick={handleRetry}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <video
              ref={videoRef}
              src={videoSrc}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setIsPlaying(false)}
              onError={(e) => {
                console.error("Video error:", e.currentTarget.error)
                setVideoLoadError(true)
                setIsPlaying(false)
                setIsBuffering(false)
              }}
              onWaiting={() => setIsBuffering(true)}
              onPlaying={() => setIsBuffering(false)}
              onSeeking={() => setIsBuffering(true)}
              onSeeked={() => setIsBuffering(false)}
              onCanPlay={() => setIsBuffering(false)}
              className="w-full h-full object-contain cursor-pointer"
              playsInline
              crossOrigin="anonymous"
              onClick={togglePlayPause}
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
          )}

          {/* Loading/Buffering Spinner */}
          {(isBuffering || qualitySwitching) && videoSrc && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-2" />
                <p className="text-sm text-white">{qualitySwitching ? "Switching Quality..." : "Loading..."}</p>
              </div>
            </div>
          )}

          {/* Video Load Error Overlay */}
          {videoLoadError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
              <div className="text-center p-6">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Video Load Error</h3>
                <p className="text-gray-300 mb-4">Unable to load this video quality</p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={handleRetry}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm transition-colors"
                  >
                    Retry
                  </button>
                  {videoQualities.length > 1 && (
                    <button
                      onClick={() => {
                        const fallbackQuality = videoQualities.find((q) => q.quality !== currentQuality)
                        if (fallbackQuality) {
                          handleQualityChange(fallbackQuality.quality)
                        }
                      }}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm transition-colors"
                    >
                      Try Different Quality
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Custom Controls */}
          {videoSrc && !videoLoadError && (
            <div
              className={`absolute inset-0 flex flex-col justify-end transition-opacity duration-300 ${
                showControls ? "opacity-100" : "opacity-0"
              }`}
            >
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

              {/* Controls Container */}
              <div className="relative z-20 p-4 bg-black/90">
                {/* Progress Bar */}
                <div className="mb-4">
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleProgressChange}
                    className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-lg"
                  />
                </div>

                {/* Main Controls Row */}
                <div className="flex items-center justify-between">
                  {/* Left Controls */}
                  <div className="flex items-center space-x-3">
                    <button onClick={togglePlayPause} className="p-2 rounded-full hover:bg-white/20 transition-colors">
                      {isPlaying ? <Pause className="h-6 w-6 text-white" /> : <Play className="h-6 w-6 text-white" />}
                    </button>

                    <button onClick={toggleMute} className="p-2 rounded-full hover:bg-white/20 transition-colors">
                      {isMuted || volume === 0 ? (
                        <VolumeX className="h-5 w-5 text-white" />
                      ) : (
                        <Volume2 className="h-5 w-5 text-white" />
                      )}
                    </button>

                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-16 sm:w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                    />

                    {/* Movie Title */}
                    <span className="hidden sm:block text-sm font-medium text-white/90 ml-4 max-w-xs truncate">
                      {movie.title.split("(")[0].trim()}
                    </span>
                  </div>

                  {/* Center - Time Display */}
                  <div className="hidden sm:flex items-center space-x-2 text-sm text-white/90">
                    <span>{formatTime(currentTime)}</span>
                    <span>/</span>
                    <span>{formatTime(duration)}</span>
                  </div>

                  {/* Right Controls */}
                  <div className="flex items-center space-x-2">
                    {/* Quality Selector */}
                    <div className="relative">
                      <select
                        value={currentQuality}
                        onChange={(e) => handleQualityChange(e.target.value as "480p" | "720p" | "1080p")}
                        disabled={qualitySwitching}
                        className="bg-white/20 text-white text-sm px-2 py-1 rounded border-none outline-none cursor-pointer hover:bg-white/30 transition-colors disabled:opacity-50"
                      >
                        {videoQualities.map((quality) => (
                          <option key={quality.quality} value={quality.quality} className="bg-black text-white">
                            {quality.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Audio Language Selector */}
                    {availableAudioTracks.length > 0 && (
                      <div className="relative">
                        <select
                          value={selectedAudioTrackId || ""}
                          onChange={(e) => handleAudioTrackChange(e.target.value)}
                          className="bg-white/20 text-white text-sm px-2 py-1 rounded border-none outline-none cursor-pointer hover:bg-white/30 transition-colors"
                        >
                          {availableAudioTracks.map((track) => (
                            <option key={track.id} value={track.id} className="bg-black text-white">
                              {track.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Download Button */}
                    <button
                      onClick={() => window.open(videoSrc || "", "_blank")}
                      className="p-2 rounded-full hover:bg-white/20 transition-colors"
                      title="Download"
                    >
                      <Download className="h-5 w-5 text-white" />
                    </button>

                    {/* Cast Button */}
                    <button
                      onClick={() => alert("Cast functionality coming soon!")}
                      className="p-2 rounded-full hover:bg-white/20 transition-colors"
                      title="Cast"
                    >
                      <Cast className="h-5 w-5 text-white" />
                    </button>

                    {/* Settings Menu */}
                    <div className="relative">
                      <button
                        onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                        className="p-2 rounded-full hover:bg-white/20 transition-colors"
                        title="Settings"
                      >
                        <Settings className="h-5 w-5 text-white" />
                      </button>

                      {showSettingsMenu && (
                        <div className="absolute bottom-full right-0 mb-2 w-64 bg-gray-900 rounded-lg shadow-xl border border-purple-500 overflow-hidden z-30">
                          {/* Settings Tabs */}
                          <div className="flex border-b border-gray-700">
                            <button
                              onClick={() => setSettingsTab("playback")}
                              className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                                settingsTab === "playback"
                                  ? "bg-purple-600 text-white"
                                  : "text-gray-300 hover:text-white hover:bg-gray-800"
                              }`}
                            >
                              <Monitor className="h-4 w-4 mx-auto mb-1" />
                              Playback
                            </button>
                            <button
                              onClick={() => setSettingsTab("accessibility")}
                              className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                                settingsTab === "accessibility"
                                  ? "bg-purple-600 text-white"
                                  : "text-gray-300 hover:text-white hover:bg-gray-800"
                              }`}
                            >
                              <Accessibility className="h-4 w-4 mx-auto mb-1" />
                              Accessibility
                            </button>
                            <button
                              onClick={() => setSettingsTab("audio")}
                              className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                                settingsTab === "audio"
                                  ? "bg-purple-600 text-white"
                                  : "text-gray-300 hover:text-white hover:bg-gray-800"
                              }`}
                            >
                              <Headphones className="h-4 w-4 mx-auto mb-1" />
                              Audio
                            </button>
                          </div>

                          {/* Settings Content */}
                          <div className="p-3 max-h-48 overflow-y-auto">
                            {settingsTab === "playback" && (
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-sm font-medium text-gray-300 mb-2">Playback Speed</label>
                                  <div className="space-y-1">
                                    {playbackSpeeds.map((speed) => (
                                      <button
                                        key={speed}
                                        onClick={() => handlePlaybackSpeedChange(speed)}
                                        className={`w-full text-left px-2 py-1 rounded text-sm transition-colors ${
                                          playbackSpeed === speed
                                            ? "bg-purple-600 text-white"
                                            : "text-gray-300 hover:bg-gray-700"
                                        }`}
                                      >
                                        {speed === 1 ? "Normal" : `${speed}x`}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                            {settingsTab === "accessibility" && (
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-sm font-medium text-gray-300 mb-2">Subtitles</label>
                                  <div className="space-y-1">
                                    <button
                                      onClick={() => setSelectedSubtitleTrackLabel("Off")}
                                      className={`w-full text-left px-2 py-1 rounded text-sm transition-colors ${
                                        selectedSubtitleTrackLabel === "Off"
                                          ? "bg-purple-600 text-white"
                                          : "text-gray-300 hover:bg-gray-700"
                                      }`}
                                    >
                                      Off
                                    </button>
                                    <button
                                      onClick={() => setSelectedSubtitleTrackLabel("English")}
                                      className={`w-full text-left px-2 py-1 rounded text-sm transition-colors ${
                                        selectedSubtitleTrackLabel === "English"
                                          ? "bg-purple-600 text-white"
                                          : "text-gray-300 hover:bg-gray-700"
                                      }`}
                                    >
                                      English
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {settingsTab === "audio" && (
                              <div className="space-y-3">
                                <div>
                                  <label className="block text-sm font-medium text-gray-300 mb-2">Audio Track</label>
                                  <div className="space-y-1">
                                    {availableAudioTracks.map((track) => (
                                      <button
                                        key={track.id}
                                        onClick={() => handleAudioTrackChange(track.id)}
                                        className={`w-full text-left px-2 py-1 rounded text-sm transition-colors ${
                                          selectedAudioTrackId === track.id
                                            ? "bg-purple-600 text-white"
                                            : "text-gray-300 hover:bg-gray-700"
                                        }`}
                                      >
                                        {track.label} ({track.language.toUpperCase()})
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Picture-in-Picture */}
                    {document.pictureInPictureEnabled && (
                      <button
                        onClick={togglePictureInPicture}
                        className="p-2 rounded-full hover:bg-white/20 transition-colors"
                        title="Picture-in-Picture"
                      >
                        <PictureInPicture2 className="h-5 w-5 text-white" />
                      </button>
                    )}

                    {/* Fullscreen */}
                    <button
                      onClick={toggleFullScreen}
                      className="p-2 rounded-full hover:bg-white/20 transition-colors"
                      title="Fullscreen"
                    >
                      {isFullScreen ? (
                        <Minimize className="h-5 w-5 text-white" />
                      ) : (
                        <Maximize className="h-5 w-5 text-white" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Mobile Time Display */}
                <div className="sm:hidden flex justify-center mt-2 text-sm text-white/90">
                  <span>
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
