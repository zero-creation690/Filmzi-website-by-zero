"use client"

import React, { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import type { Movie } from "@/contexts/MovieContext"

declare global {
  interface Window {
    Plyr: any
  }
}

export default function WatchPage() {
  const { id } = useParams()
  const videoRef = useRef<HTMLVideoElement>(null)
  const playerRef = useRef<any>(null)
  const [movie, setMovie] = useState<Movie | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPlyr = () => {
      const css = document.createElement("link")
      css.rel = "stylesheet"
      css.href = "https://cdn.plyr.io/3.7.8/plyr.css"
      document.head.appendChild(css)

      const script = document.createElement("script")
      script.src = "https://cdn.plyr.io/3.7.8/plyr.min.js"
      script.onload = () => {
        if (videoRef.current) {
          playerRef.current = new window.Plyr(videoRef.current, {
            controls: [
              "play-large", "play", "progress", "current-time", "mute", "volume",
              "settings", "fullscreen"
            ],
            settings: ["quality"],
            quality: {
              default: 720,
              options: [720, 1080],
              forced: true,
              onChange: handleQualityChange
            }
          })
        }
      }
      document.body.appendChild(script)
    }

    loadPlyr()
  }, [])

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

  const handleQualityChange = (quality: number) => {
    if (!movie || !playerRef.current || !videoRef.current) return

    const src =
      quality === 1080
        ? movie.video_link_1080p
        : movie.video_link_720p || movie.video_link_1080p

    playerRef.current.source = {
      type: "video",
      sources: [
        {
          src,
          type: "video/mp4",
          size: quality
        }
      ],
      poster: movie.thumbnail_url || "" // keeps poster when quality switches
    }

    playerRef.current.play()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-black text-white">
        <p>Loading movie...</p>
      </div>
    )
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen flex justify-center items-center flex-col bg-black text-white">
        <h1 className="text-2xl font-bold">Error</h1>
        <p>{error || "Movie not found."}</p>
        <Link href="/home" className="mt-4 bg-blue-600 px-4 py-2 rounded">
          Go Home
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 flex flex-col items-center">
      <div className="w-full max-w-4xl mb-6">
        <Link
          href={`/movie/${movie.id}`}
          className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Movie Details</span>
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-4 text-center">{movie.title}</h1>

      <div className="w-full max-w-4xl bg-gray-900 rounded-lg shadow-lg overflow-hidden">
        <video
          ref={videoRef}
          className="w-full aspect-video"
          controls
          playsInline
          crossOrigin="anonymous"
          poster={movie.thumbnail_url} // ✅ Poster before playback
        >
          <source
            src={movie.video_link_720p || movie.video_link_1080p}
            type="video/mp4"
            size="720"
          />
        </video>
      </div>
    </div>
  )
}
