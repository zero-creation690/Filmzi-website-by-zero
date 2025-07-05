"use client"

import { useEffect, useState, useRef } from "react"
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
  const [playbackSpeed, setPlaybackSpeed] = useState(1)

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

  const handlePlay = () => {
    if (!videoRef.current || !movie) return
    setVideoSrc(currentQuality === "1080p" ? movie.video_link_1080p : movie.video_link_720p)
    setShowPoster(false)
    videoRef.current.play()
    setIsPlaying(true)
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

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed
    }
  }, [playbackSpeed])

  const cleanTitle = (title: string) => {
    // Match everything up to the year and return like "Thunderbolts (2025) ✅"
    const match = title.match(/^(.*?\(\d{4}\))/)
    return match ? `# ${match[1]} ✅` : `# ${title}`
  }

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>

  if (error || !movie) return <div className="min-h-screen bg-black text-white flex items-center justify-center">{error}</div>

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-6xl mx-auto">
        <Link href={`/movie/${movie.id}`} className="text-blue-500 flex items-center mb-4">
          <ArrowLeft className="mr-2" /> Back
        </Link>
        <h1 className="text-2xl md:text-3xl font-semibold mb-4">{cleanTitle(movie.title)}</h1>

        <div className="relative bg-black aspect-video rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full"
            src={showPoster ? undefined : videoSrc}
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
              className="absolute inset-0 flex items-center justify-center bg-black/60 hover:bg-black/80"
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
                  <button onClick={() => setShowSettings(!showSettings)}>
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
                    <div className="absolute bottom-full right-0 mb-2 bg-gray-800 rounded p-2 text-sm w-40">
                      <div className="mb-2">
                        <p className="text-gray-300 font-semibold mb-1">Quality</p>
                        {["720p", "1080p"].map((q) => (
                          <button
                            key={q}
                            onClick={() => {
                              setCurrentQuality(q as "720p" | "1080p")
                              setVideoSrc(q === "720p" ? movie.video_link_720p : movie.video_link_1080p)
                              setShowSettings(false)
                            }}
                            className={`block w-full px-2 py-1 rounded hover:bg-gray-700 ${
                              currentQuality === q ? "bg-blue-600 text-white" : "text-gray-300"
                            }`}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                      <div className="mt-2 border-t border-gray-600 pt-2">
                        <p className="text-gray-300 font-semibold mb-1">Speed</p>
                        {[0.5, 1, 1.5, 2].map((s) => (
                          <button
                            key={s}
                            onClick={() => setPlaybackSpeed(s)}
                            className={`block w-full px-2 py-1 rounded hover:bg-gray-700 ${
                              playbackSpeed === s ? "bg-blue-600 text-white" : "text-gray-300"
                            }`}
                          >
                            {s}x
                          </button>
                        ))}
                      </div>
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
