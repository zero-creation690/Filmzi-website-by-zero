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
} from "lucide-react"
import type { Movie } from "@/contexts/MovieContext"

export default function WatchPage() {
  const params = useParams()
  const id = params.id as string
  const [movie, setMovie] = useState<Movie | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const [currentQuality, setCurrentQuality] = useState<"720p" | "1080p">("720p")
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)

  const availableQualities = ["720p", "1080p"] as const
  const playbackSpeeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

  // Fetch movie data
  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const res = await fetch(`https://web-production-6321.up.railway.app/movies/${id}`)
        if (!res.ok) throw new Error("Movie not found")
        const data: Movie = await res.json()
        setMovie(data)
      } catch (err) {
        setError("Failed to load movie.")
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchMovie()
  }, [id])

  // Handle fullscreen state
  useEffect(() => {
    const handleFS = () => setIsFullScreen(document.fullscreenElement != null)
    document.addEventListener("fullscreenchange", handleFS)
    return () => document.removeEventListener("fullscreenchange", handleFS)
  }, [])

  // Change video quality
  useEffect(() => {
    if (!movie || !videoRef.current) return

    const newSrc =
      currentQuality === "1080p" ? movie.video_link_1080p : movie.video_link_720p

    const prevTime = videoRef.current.currentTime
    const wasPlaying = !videoRef.current.paused

    videoRef.current.src = newSrc
    videoRef.current.load()
    videoRef.current.currentTime = prevTime

    if (wasPlaying) {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => console.error("Play failed:", e))
    }
  }, [currentQuality, movie])

  // Playback handlers
  const togglePlayPause = () => {
    if (!videoRef.current) return
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true))
    } else {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }

  const toggleMute = () => {
    if (!videoRef.current) return
    videoRef.current.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.volume = v
      setVolume(v)
      setIsMuted(v === 0)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  const toggleFullScreen = () => {
    if (!videoRef.current) return
    if (!document.fullscreenElement) {
      videoRef.current.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen()
    }
  }

  const handlePlaybackSpeedChange = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed
      setPlaybackSpeed(speed)
      setShowSettingsMenu(false)
    }
  }

  const togglePictureInPicture = () => {
    if (!videoRef.current) return
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture().catch(() => {})
    } else {
      videoRef.current.requestPictureInPicture().catch(() => {})
    }
  }

  const formatTime = (t: number) =>
    `${Math.floor(t / 60)
      .toString()
      .padStart(2, "0")}:${Math.floor(t % 60)
      .toString()
      .padStart(2, "0")}`

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div>Loading...</div>
      </div>
    )
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div>{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 flex flex-col items-center">
      {/* Back */}
      <div className="w-full max-w-5xl mb-4">
        <Link href={`/movie/${movie.id}`} className="flex items-center space-x-2 text-blue-400">
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Movie</span>
        </Link>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold mb-6">{movie.title}</h1>

      {/* Video Player */}
      <div className="w-full max-w-4xl aspect-video bg-black rounded-lg overflow-hidden relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isMuted}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          className="w-full h-full"
        />

        {/* Controls */}
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 to-transparent p-4 space-y-2">
          {/* Progress */}
          <input
            type="range"
            min={0}
            max={duration}
            value={currentTime}
            onChange={handleProgressChange}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          {/* Buttons */}
          <div className="flex justify-between items-center">
            <div className="flex space-x-3 items-center">
              <button onClick={togglePlayPause}>
                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
              </button>
              <button onClick={toggleMute}>
                {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={handleVolumeChange}
              />
            </div>

            <div className="flex items-center space-x-3 relative">
              {/* Settings */}
              <button onClick={() => setShowSettingsMenu((prev) => !prev)}>
                <Settings className="w-6 h-6" />
              </button>

              {/* Dropdown */}
              {showSettingsMenu && (
                <div className="absolute bottom-full right-0 bg-gray-800 text-sm rounded p-2 z-10 w-40">
                  <div className="mb-2">
                    <div className="text-gray-300 font-semibold mb-1">Quality</div>
                    {availableQualities.map((q) => (
                      <button
                        key={q}
                        onClick={() => {
                          setCurrentQuality(q)
                          setShowSettingsMenu(false)
                        }}
                        className={`block w-full text-left px-2 py-1 rounded hover:bg-gray-700 ${
                          currentQuality === q ? "bg-blue-600 text-white" : "text-gray-300"
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-gray-600 pt-2 mt-2">
                    <div className="text-gray-300 font-semibold mb-1">Speed</div>
                    {playbackSpeeds.map((s) => (
                      <button
                        key={s}
                        onClick={() => handlePlaybackSpeedChange(s)}
                        className={`block w-full text-left px-2 py-1 rounded hover:bg-gray-700 ${
                          playbackSpeed === s ? "bg-blue-600 text-white" : "text-gray-300"
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* PiP */}
              {document.pictureInPictureEnabled && (
                <button onClick={togglePictureInPicture}>
                  <PictureInPicture2 className="w-6 h-6" />
                </button>
              )}

              {/* Fullscreen */}
              <button onClick={toggleFullScreen}>
                {isFullScreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
