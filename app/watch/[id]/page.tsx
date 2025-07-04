"use client"

import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import type { Movie } from "@/contexts/MovieContext"

declare global {
  interface Window {
    Clappr: any
    ClapprLevelSelector: any
  }
}

export default function WatchPage() {
  const params = useParams()
  const id = params.id as string
  const [movie, setMovie] = useState<Movie | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const playerContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchMovie = async () => {
      setLoading(true)
      try {
        const res = await fetch(`https://web-production-6321.up.railway.app/movies/${id}`)
        if (!res.ok) throw new Error("Movie not found")
        const data: Movie = await res.json()
        setMovie(data)
      } catch (err) {
        setError("Failed to load movie.")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchMovie()
  }, [id])

  useEffect(() => {
    if (!movie || !playerContainerRef.current) return

    const loadClappr = async () => {
      // Load Clappr core
      const script = document.createElement("script")
      script.src = "https://cdn.jsdelivr.net/npm/clappr@latest/dist/clappr.min.js"
      script.async = true
      document.body.appendChild(script)

      // Load LevelSelector plugin (for quality)
      const levelScript = document.createElement("script")
      levelScript.src = "https://cdn.jsdelivr.net/npm/clappr-level-selector@latest/dist/level-selector.min.js"
      levelScript.async = true
      document.body.appendChild(levelScript)

      script.onload = () => {
        levelScript.onload = () => {
          const sources = []

          if (movie.video_link_720p) {
            sources.push({
              source: movie.video_link_720p,
              mimeType: "video/mp4",
              label: "720p",
              default: true,
            })
          }

          if (movie.video_link_1080p) {
            sources.push({
              source: movie.video_link_1080p,
              mimeType: "video/mp4",
              label: "1080p",
            })
          }

          new window.Clappr.Player({
            parentId: "#player-container",
            poster: movie.thumbnail_url,
            autoPlay: true,
            width: "100%",
            height: "100%",
            playback: {
              controls: true,
            },
            source: sources[0].source,
            plugins: [window.ClapprLevelSelector],
            levelSelectorConfig: {
              title: "Quality",
              labels: sources.reduce((acc: any, src, idx) => {
                acc[idx] = src.label
                return acc
              }, {}),
            },
            sources,
          })
        }
      }

      return () => {
        document.body.removeChild(script)
        document.body.removeChild(levelScript)
      }
    }

    loadClappr()
  }, [movie])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <p>Loading movie...</p>
      </div>
    )
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white">
        <h1 className="text-2xl font-bold">Error</h1>
        <p className="text-gray-400 mb-4">{error || "Movie not found."}</p>
        <Link href="/home" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
          Go Home
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 flex flex-col items-center">
      {/* Back */}
      <div className="w-full max-w-6xl mb-4">
        <Link
          href={`/movie/${movie.id}`}
          className="inline-flex items-center text-blue-400 hover:text-blue-300"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          <span>Back to Details</span>
        </Link>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-center mb-6">{movie.title.split("(")[0].trim()}</h1>

      {/* Clappr Player */}
      <div
        id="player-container"
        ref={playerContainerRef}
        className="w-full max-w-4xl aspect-video bg-black rounded-lg overflow-hidden"
      ></div>
    </div>
  )
}
