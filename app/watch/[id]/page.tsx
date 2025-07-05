"use client"

import { useEffect, useRef, useState } from "react"
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
  const videoRef = useRef<HTMLVideoElement>(null)
  const playerContainerRef = useRef<HTMLDivElement>(null)

  const [movie, setMovie] = useState<Movie | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [videoSrc, setVideoSrc] = useState<string>("")
  const [currentQuality, setCurrentQuality] = useState<"720p" | "1080p">("720p")
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showPoster, setShowPoster] = useState(true)

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        const res = await fetch(`https://web-production-6321.up.railway.app/movies/${id}`)
        if (!res.ok) throw new Error("Movie not found")
        const data: Movie = await res.json()
        setMovie(data)
        setVideoSrc(data.video_link_720p)
      } catch (err) {
        setError("Failed to load movie")
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchMovie()
  }, [id])

  const handlePlay = async () => {
    if (!videoRef.current || !movie) return
    setVideoSrc(currentQuality === "1080p" ? movie.video_link_1080p : movie.video_link_720p)
    setShowPoster(false)
    setTimeout(async () => {
      try {
        await videoRef.current?.play()
        setIsPlaying(true)
      } catch (e) {
        console.error("Autoplay error:", e)
      }
    }, 100)
  }

  const togglePlayPause = () => {
    if (!videoRef.current) return
    if (videoRef.current.paused) {
      videoRef.current.play()
      setIsPlaying(true)
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

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.volume = v
      setVolume(v)
      setIsMuted(v === 0)
    }
  }

  const toggleFullScreen = () => {
    if (!videoRef.current) return
    if (!document.fullscreenElement) {
      videoRef.current.requestFullscreen()
      setIsFullScreen(true)
    } else {
      document.exitFullscreen()
      setIsFullScreen(false)
    }
  }

  const formatTime = (t: number) =>
    `${Math.floor(t / 60).toString().padStart(2, "0")}:${Math.floor(t % 60).toString().padStart(2, "0")}`

  const cleanTitle = (title: string) => {
    const match = title.match(/^(.*?\(\d{4}\))/)
    return match ? match[1] : title
  }

  // Hide settings on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (playerContainerRef.current && !playerContainerRef.current.contains(e.target as Node)) {
        setShowSettings(false)
      }
    }
    document.addEventListener("click", handleClickOutside)
    return () => document.removeEventListener("click", handleClickOutside)
  }, [])

  // Double tap fullscreen
  useEffect(() => {
    const player = playerContainerRef.current
    if (!player) return

    let lastTap = 0
    const handleTap = () => {
      const now = new Date().getTime()
      const tapLength = now - lastTap
      if (tapLength < 400 && tapLength > 0) {
        toggleFullScreen()
      }
      lastTap = now
    }

    player.addEventListener("touchend", handleTap)
    return () => player.removeEventListener("touchend", handleTap)
  }, [])

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>
  if (error || !movie) return <div className="min-h-screen bg-black text-white flex items-center justify-center">{error}</div>

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-6xl mx-auto">
        <Link href={`/movie/${movie.id}`} className="text-blue-500 flex items-center mb-4">
          <ArrowLeft className="mr-2" /> Back
        </Link>
        <h1 className="text-2xl md:text-3xl font-semibold mb-4">{cleanTitle(movie.title)}</h1>

        <div ref={playerContainerRef} className="relative bg-black aspect-video rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full"
            src={!showPoster ? videoSrc : undefined}
            muted={isMuted}
            onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
            onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
            playsInline
            controls={false}
            poster={movie.thumbnail_url}
          />

          {showPoster && (
            <button
              onClick={handlePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/60 hover:bg-black/80 transition"
            >
              <Play className="w-16 h-16 text-white" />
            </button>
          )}

          {!showPoster && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <input
                type="range"
                min={0}
                max={duration}
                value={currentTime}
                onChange={(e) => {
                  const time = parseFloat(e.target.value)
                  if (videoRef.current) {
                    videoRef.current.currentTime = time
                    setCurrentTime(time)
                  }
                }}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1 mb-2">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <button onClick={togglePlayPause}>
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                  </button>
                  <button onClick={toggleMute}>
                    {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                  </button>
                  <input type="range" min={0} max={1} step={0.01} value={volume} onChange={handleVolume} className="w-24" />
                </div>

                <div className="flex items-center space-x-3 relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation() // prevent outside click
                      setShowSettings((prev) => !prev)
                    }}
                  >
                    <Settings className="w-6 h-6" />
                  </button>
                  {document.pictureInPictureEnabled && (
                    <button onClick={() => videoRef.current?.requestPictureInPicture()}>
                      <PictureInPicture2 className="w-6 h-6" />
                    </button>
                  )}
                  <button onClick={toggleFullScreen}>
                    {isFullScreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
                  </button>

                  {showSettings && (
                    <div className="absolute bottom-full right-0 mb-2 bg-gray-800 rounded p-2 text-sm w-40 z-20">
                      <p className="text-gray-300 font-semibold mb-1">Quality</p>
                      {["720p", "1080p"].map((q) => (
                        <button
                          key={q}
                          onClick={() => {
                            setCurrentQuality(q as "720p" | "1080p")
                            setVideoSrc(q === "720p" ? movie.video_link_720p : movie.video_link_1080p)
                            setShowSettings(false)
                            setTimeout(() => videoRef.current?.play(), 100)
                          }}
                          className={`block w-full px-2 py-1 rounded hover:bg-gray-700 ${
                            currentQuality === q ? "bg-blue-600 text-white" : "text-gray-300"
                          }`}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
