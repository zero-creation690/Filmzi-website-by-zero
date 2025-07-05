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
  Loader2,
} from "lucide-react"
import type { Movie } from "@/contexts/MovieContext"

export default function WatchPage() {
  const params = useParams()
  const id = params.id as string
  const videoRef = useRef<HTMLVideoElement>(null)
  const playerRef = useRef<HTMLDivElement>(null)

  const [movie, setMovie] = useState<Movie | null>(null)
  const [videoSrc, setVideoSrc] = useState<string>("")
  const [currentQuality, setCurrentQuality] = useState<"720p" | "1080p">("720p")
  const [isPlaying, setIsPlaying] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [isBuffering, setIsBuffering] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)

  useEffect(() => {
    const fetchMovie = async () => {
      const res = await fetch(`https://web-production-6321.up.railway.app/movies/${id}`)
      const data = await res.json()
      setMovie(data)
      setVideoSrc(data.video_link_720p)
    }

    if (id) fetchMovie()
  }, [id])

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement)
    }
    document.addEventListener("fullscreenchange", handleFullScreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullScreenChange)
  }, [])

  const formatTime = (time: number) => {
    const m = Math.floor(time / 60).toString().padStart(2, "0")
    const s = Math.floor(time % 60).toString().padStart(2, "0")
    return `${m}:${s}`
  }

  const handlePlayClick = () => {
    setHasStarted(true)
    setIsBuffering(true)
    setTimeout(() => {
      videoRef.current?.play()
    }, 300)
  }

  const togglePlay = () => {
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
    const newVol = parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.volume = newVol
      setVolume(newVol)
      setIsMuted(newVol === 0)
    }
  }

  const toggleFullScreen = () => {
    if (!playerRef.current) return
    if (!document.fullscreenElement) {
      playerRef.current.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const handleDoubleTap = () => {
    toggleFullScreen()
  }

  const switchQuality = (q: "720p" | "1080p") => {
    if (!movie || !videoRef.current) return
    const currentTime = videoRef.current.currentTime
    const wasPlaying = !videoRef.current.paused
    const newSrc = q === "1080p" ? movie.video_link_1080p : movie.video_link_720p
    setVideoSrc(newSrc)
    setCurrentQuality(q)
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = currentTime
        if (wasPlaying) videoRef.current.play()
      }
    }, 100)
  }

  return (
    <div className="bg-black text-white min-h-screen p-4 flex flex-col items-center">
      <div className="w-full max-w-5xl mb-6">
        <Link href={`/movie/${movie?.id || ""}`} className="flex items-center gap-2 text-blue-500">
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Movie</span>
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-4 text-center">
        {movie?.title.split("(")[0].trim()} ({movie?.release_date?.split("-")[0]})
      </h1>

      <div
        ref={playerRef}
        className="relative w-full max-w-4xl aspect-video bg-black rounded overflow-hidden"
        onDoubleClick={handleDoubleTap}
      >
        {!hasStarted ? (
          <div
            className="w-full h-full bg-cover bg-center flex items-center justify-center"
            style={{ backgroundImage: `url(${movie?.thumbnail_url})` }}
          >
            <button
              onClick={handlePlayClick}
              className="bg-white text-black p-4 rounded-full text-xl hover:scale-110 transition"
            >
              <Play className="w-8 h-8" />
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              src={videoSrc}
              autoPlay
              muted={isMuted}
              onPlay={() => {
                setIsPlaying(true)
                setIsBuffering(false)
              }}
              onPause={() => setIsPlaying(false)}
              onWaiting={() => setIsBuffering(true)}
              onPlaying={() => setIsBuffering(false)}
              onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              className="w-full h-full object-contain"
              playsInline
            />
            {isBuffering && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
                <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
              </div>
            )}
            <div
              className="absolute bottom-0 left-0 right-0 bg-black/60 p-3 flex flex-col gap-2"
              onClick={() => setShowSettings(false)}
            >
              <input
                type="range"
                min={0}
                max={duration}
                value={currentTime}
                onChange={(e) => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = parseFloat(e.target.value)
                    setCurrentTime(parseFloat(e.target.value))
                  }
                }}
              />
              <div className="flex items-center justify-between gap-3">
                <div className="flex gap-3 items-center">
                  <button onClick={togglePlay}>
                    {isPlaying ? <Pause /> : <Play />}
                  </button>
                  <button onClick={toggleMute}>
                    {isMuted || volume === 0 ? <VolumeX /> : <Volume2 />}
                  </button>
                  <input type="range" min={0} max={1} step={0.01} value={volume} onChange={handleVolume} />
                  <span className="text-sm">{formatTime(currentTime)} / {formatTime(duration)}</span>
                </div>
                <div className="flex gap-2 items-center relative">
                  <button onClick={() => setShowSettings(!showSettings)}>
                    <Settings />
                  </button>
                  {document.pictureInPictureEnabled && (
                    <button onClick={() => videoRef.current?.requestPictureInPicture()}>
                      <PictureInPicture2 />
                    </button>
                  )}
                  <button onClick={toggleFullScreen}>
                    {isFullScreen ? <Minimize /> : <Maximize />}
                  </button>

                  {showSettings && (
                    <div className="absolute bottom-full right-0 mb-2 bg-gray-800 p-2 rounded shadow-lg text-sm z-50">
                      <div className="mb-1 font-semibold text-white">Quality</div>
                      {["720p", "1080p"].map((q) => (
                        <button
                          key={q}
                          className={`block px-2 py-1 rounded hover:bg-gray-700 w-full text-left ${
                            currentQuality === q ? "bg-blue-600 text-white" : "text-gray-300"
                          }`}
                          onClick={() => switchQuality(q as "720p" | "1080p")}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
