"use client"

import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import type { Movie } from "@/contexts/MovieContext"

export default function WatchPage() {
  const params = useParams()
  const id = params.id as string
  const videoRef = useRef<HTMLVideoElement>(null)

  const [movie, setMovie] = useState<Movie | null>(null)
  const [videoSrc, setVideoSrc] = useState<string>("")
  const [currentQuality, setCurrentQuality] = useState<"720p" | "1080p">("720p")

  useEffect(() => {
    const fetchMovie = async () => {
      const res = await fetch(`https://web-production-6321.up.railway.app/movies/${id}`)
      const data = await res.json()
      setMovie(data)
      setVideoSrc(data.video_link_720p)
    }

    if (id) fetchMovie()
  }, [id])

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

      <div className="w-full max-w-4xl aspect-video bg-black rounded overflow-hidden">
        {videoSrc && (
          <video
            ref={videoRef}
            src={videoSrc}
            controls
            autoPlay
            className="w-full h-full object-contain"
            poster={movie?.thumbnail_url}
            playsInline
          />
        )}
      </div>

      <div className="mt-4 flex gap-4">
        <button
          onClick={() => switchQuality("720p")}
          className={`px-4 py-2 rounded ${
            currentQuality === "720p" ? "bg-blue-600" : "bg-gray-700"
          }`}
        >
          720p
        </button>
        <button
          onClick={() => switchQuality("1080p")}
          className={`px-4 py-2 rounded ${
            currentQuality === "1080p" ? "bg-blue-600" : "bg-gray-700"
          }`}
        >
          1080p
        </button>
      </div>
    </div>
  )
}
