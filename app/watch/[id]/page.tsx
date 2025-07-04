"use client"

import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import type { Movie } from "@/contexts/MovieContext"

declare global {
  interface Window {
    Clappr: any
  }
}

export default function WatchPage() {
  const params = useParams()
  const id = params.id as string
  const [movie, setMovie] = useState<Movie | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const playerContainerRef = useRef<HTMLDivElement>(null)
  const playerInstanceRef = useRef<any>(null)
  const [scriptsLoaded, setScriptsLoaded] = useState(false)

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

  // Load Clappr scripts
  useEffect(() => {
    if (scriptsLoaded) return

    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const script = document.createElement("script")
        script.src = src
        script.onload = () => resolve()
        script.onerror = reject
        document.head.appendChild(script)
      })
    }

    const loadScripts = async () => {
      try {
        await loadScript("https://cdn.jsdelivr.net/npm/clappr@latest/dist/clappr.min.js")
        await loadScript("https://cdn.jsdelivr.net/npm/clappr-level-selector@latest/dist/clappr-level-selector.min.js")
        setScriptsLoaded(true)
      } catch (error) {
        console.error("Failed to load Clappr scripts:", error)
        setError("Failed to load video player.")
      }
    }

    loadScripts()
  }, [])

  // Initialize player when movie data and scripts are ready
  useEffect(() => {
    if (!movie || !scriptsLoaded || !playerContainerRef.current || !window.Clappr) return

    // Clean up existing player
    if (playerInstanceRef.current) {
      playerInstanceRef.current.destroy()
      playerInstanceRef.current = null
    }

    // Clear container
    if (playerContainerRef.current) {
      playerContainerRef.current.innerHTML = ""
    }

    // Prepare video sources
    const sources = []
    if (movie.video_link_720p) {
      sources.push({
        source: movie.video_link_720p,
        label: "720p"
      })
    }
    if (movie.video_link_1080p) {
      sources.push({
        source: movie.video_link_1080p,
        label: "1080p"
      })
    }

    // Default to 720p if available, otherwise use 1080p
    const defaultSource = movie.video_link_720p || movie.video_link_1080p

    // Player configuration
    const playerConfig = {
      source: defaultSource,
      parentId: playerContainerRef.current,
      poster: movie.thumbnail_url,
      autoPlay: true,
      width: "100%",
      height: 500,
      plugins: sources.length > 1 ? [window.LevelSelector] : [],
      levelSelectorConfig: sources.length > 1 ? {
        title: "Quality",
        labels: sources.reduce((acc, curr) => {
          acc[curr.source] = curr.label
          return acc
        }, {} as Record<string, string>),
        sources: sources.map(s => s.source)
      } : undefined
    }

    try {
      playerInstanceRef.current = new window.Clappr.Player(playerConfig)
    } catch (error) {
      console.error("Failed to initialize Clappr player:", error)
      setError("Failed to initialize video player.")
    }

    // Cleanup function
    return () => {
      if (playerInstanceRef.current) {
        playerInstanceRef.current.destroy()
        playerInstanceRef.current = null
      }
    }
  }, [movie, scriptsLoaded])

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
        ref={playerContainerRef}
        className="w-full max-w-4xl bg-black rounded-lg overflow-hidden"
        style={{ height: "500px" }}
      />
    </div>
  )
}
