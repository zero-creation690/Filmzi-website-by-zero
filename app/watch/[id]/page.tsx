"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
} from "lucide-react"
import type { Movie } from "@/contexts/MovieContext"

export default function WatchPage() {
  const params = useParams()
  const id = params.id as string
  const [movie, setMovie] = useState<Movie | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentQuality, setCurrentQuality] = useState<"720p" | "1080p">("720p")
  const [videoSrc, setVideoSrc] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const fetchMovie = async (movieId: string) => {
      try {
        const response = await fetch(`https://web-production-6321.up.railway.app/movies/${movieId}`)
        if (!response.ok) throw new Error("Movie not found")
        const movieData: Movie = await response.json()
        setMovie(movieData)
        setVideoSrc(movieData.video_link_720p) // default to 720p
        setCurrentQuality("720p")
      } catch (err) {
        setError("Failed to fetch movie details.")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchMovie(id)
  }, [id])

  useEffect(() => {
    if (!movie) return

    const prevTime = videoRef.current?.currentTime || 0
    const wasPlaying = !videoRef.current?.paused

    const newSrc =
      currentQuality === "1080p"
        ? movie.video_link_1080p
        : movie.video_link_720p

    setVideoSrc(newSrc)

    if (videoRef.current) {
      videoRef.current.src = newSrc
      videoRef.current.load()
      videoRef.current.currentTime = prevTime
      if (wasPlaying) {
        videoRef.current.play().catch((e) => console.error("Autoplay prevented:", e))
      }
    }
  }, [currentQuality, movie])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <span>Loading...</span>
      </div>
    )
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white text-center p-4">
        <h1 className="text-2xl font-bold mb-2">Error</h1>
        <p className="mb-4">{error || "Movie not found."}</p>
        <Link
          href="/home"
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
        >
          Go Home
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center p-4 sm:p-6 lg:p-8">
      {/* Back Button */}
      <div className="w-full max-w-6xl mb-6">
        <Link
          href={`/movie/${movie.id}`}
          className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Movie Details</span>
        </Link>
      </div>

      {/* Movie Title */}
      <h1 className="text-3xl md:text-4xl font-bold text-center mb-6">
        {movie.title.split("(")[0].trim()}
      </h1>

      {/* Native HTML5 Video Player */}
      <div className="w-full max-w-4xl bg-gray-900 rounded-lg overflow-hidden mb-4">
        <video
          ref={videoRef}
          src={videoSrc || undefined}
          className="w-full h-full"
          controls
          autoPlay
          poster={movie.thumbnail_url}
          crossOrigin="anonymous"
          playsInline
        >
          Your browser does not support the video tag.
        </video>
      </div>

      {/* Quality Selection */}
      <div className="flex space-x-4">
        {movie.video_link_720p && (
          <button
            onClick={() => setCurrentQuality("720p")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentQuality === "720p"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            720p
          </button>
        )}
        {movie.video_link_1080p && (
          <button
            onClick={() => setCurrentQuality("1080p")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              currentQuality === "1080p"
                ? "bg-blue-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            1080p
          </button>
        )}
      </div>
    </div>
  )
}
