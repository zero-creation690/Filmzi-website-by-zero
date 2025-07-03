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
  const [currentQuality, setCurrentQuality] = useState<"480p" | "720p" | "1080p">("720p")
  const [videoSrc, setVideoSrc] = useState<string | null>(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [isBuffering, setIsBuffering] = useState(true)
  const [showControls, setShowControls] = useState(true)
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null)

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

  // Fetch movie data
  useEffect(() => {
    const fetchMovie = async (movieId: string) => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`https://web-production-6321.up.railway.app/movies/${movieId}`)
        if (!response.ok) throw new Error("Movie not found")
        const movieData: Movie = await response.json()
        setMovie(movieData)
        setVideoSrc(movieData.video_link_720p) // Set 720p as default
        setCurrentQuality("720p")
      } catch (err) {
        setError("Failed to fetch movie details. The movie might not exist or there's a network issue.")
        console.error("Fetch movie error:", err)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchMovie(id)
    }
  }, [id])

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
        if (isPlaying) {
          setShowControls(false)
        }
      }, 3000)
      setControlsTimeout(timeout)
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener("mousemove", handleMouseMove)
      container.addEventListener("mouseleave", () => {
        if (isPlaying) {
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
  }, [isPlaying, controlsTimeout])

  // Update video source when quality changes
  useEffect(() => {
    if (movie) {
      const prevTime = videoRef.current?.currentTime || 0
      const prevPlaying = !videoRef.current?.paused

      let newSrc = ""
      if (currentQuality === "480p") newSrc = movie.video_link_480p
      else if (currentQuality === "720p") newSrc = movie.video_link_720p
      else if (currentQuality === "1080p") newSrc = movie.video_link_1080p

      if (videoRef.current && newSrc && newSrc !== videoRef.current.src) {
        setIsBuffering(true)
        videoRef.current.src = newSrc
        videoRef.current.load()
        videoRef.current.currentTime = prevTime
        if (prevPlaying) {
          videoRef.current.play().catch((e) => console.error("Autoplay prevented after quality change:", e))
        }
      }
    }
  }, [currentQuality, movie])

  // Handle audio tracks on video load
  useEffect(() => {
    const videoElement = videoRef.current
    if (!videoElement) return

    const handleTracks = () => {
      // Audio Tracks
      if (videoElement.audioTracks && videoElement.audioTracks.length > 0) {
        const tracks = Array.from(videoElement.audioTracks)
        setAvailableAudioTracks(
          tracks.map((track, index) => ({
            id: track.id || index.toString(),
            label: track.label || `Track ${index + 1}`,
            language: track.language || "unknown",
          })),
        )

        const defaultAudioTrack = tracks.find((track) => track.enabled) || tracks[0]
        if (defaultAudioTrack) {
          tracks.forEach((track) => (track.enabled = false))
          defaultAudioTrack.enabled = true
          setSelectedAudioTrackId(defaultAudioTrack.id || "0")
        }
      } else {
        // Fallback: Create dummy audio tracks for demonstration
        setAvailableAudioTracks([
          { id: "hindi", label: "Hindi", language: "hi" },
          { id: "english", label: "English", language: "en" },
        ])
        setSelectedAudioTrackId("hindi")
      }
    }

    videoElement.addEventListener("loadedmetadata", handleTracks)
    return () => videoElement.removeEventListener("loadedmetadata", handleTracks)
  }, [movie])

  const togglePlayPause = useCallback(() => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch((e) => {
          console.error("Play prevented:", e)
          setError("Playback failed. Please try clicking play again.")
        })
      } else {
        videoRef.current.pause()
      }
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
    if (videoRef.current && videoRef.current.audioTracks) {
      const audioTracks = videoRef.current.audioTracks
      for (let i = 0; i < audioTracks.length; i++) {
        audioTracks[i].enabled = audioTracks[i].id === trackId
      }
    }
    setSelectedAudioTrackId(trackId)
  }, [])

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

  const getQualityLabel = () => {
    switch (currentQuality) {
      case "480p":
        return "480P"
      case "720p":
        return "720P"
      case "1080p":
        return "1080P"
      default:
        return "720P"
    }
  }

  const playbackSpeeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
  const availableQualities = [
    movie?.video_link_480p && "480p",
    movie?.video_link_720p && "720p",
    movie?.video_link_1080p && "1080p",
  ].filter(Boolean) as ("480p" | "720p" | "1080p")[]

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
              <p className="text-lg font-medium">
                No video source available for this movie. Please check the movie details or try another movie.
              </p>
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
                setError("Video playback error. The video might be unavailable or in an unsupported format.")
                setIsPlaying(false)
                setIsBuffering(false)
              }}
              onWaiting={() => setIsBuffering(true)}
              onPlaying={() => setIsBuffering(false)}
              onSeeking={() => setIsBuffering(true)}
              onSeeked={() => setIsBuffering(false)}
              className="w-full h-full object-contain cursor-pointer"
              playsInline
              crossOrigin="anonymous"
              onClick={togglePlayPause}
            >
              Your browser does not support the video tag.
            </video>
          )}

          {/* Loading Spinner */}
          {isBuffering && videoSrc && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
            </div>
          )}

          {/* Custom Controls */}
          {videoSrc && (
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
                        onChange={(e) => setCurrentQuality(e.target.value as "480p" | "720p" | "1080p")}
                        className="bg-white/20 text-white text-sm px-2 py-1 rounded border-none outline-none cursor-pointer hover:bg-white/30 transition-colors"
                      >
                        {availableQualities.map((quality) => (
                          <option key={quality} value={quality} className="bg-black text-white">
                            {quality.toUpperCase()}
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
