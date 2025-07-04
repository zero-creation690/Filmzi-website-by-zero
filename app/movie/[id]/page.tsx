"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Calendar, Star, ArrowLeft } from "lucide-react"
import type { Movie } from "@/contexts/MovieContext"
import DownloadLinks from "@/components/DownloadLinks"
import MovieCard from "@/components/MovieCard"

export default function MoviePage() {
  const params = useParams()
  const id = params.id as string
  const [movie, setMovie] = useState<Movie | null>(null)
  const [relatedMovies, setRelatedMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchMovie(id)
      fetchRelatedMovies()
    }
  }, [id])

  const fetchMovie = async (movieId: string) => {
    try {
      const response = await fetch(`https://web-production-6321.up.railway.app/movies/${movieId}`)
      if (!response.ok) throw new Error("Movie not found")
      const movieData: Movie = await response.json()
      setMovie(movieData)
    } catch (error) {
      setError("Failed to fetch movie details")
    } finally {
      setLoading(false)
    }
  }

  const fetchRelatedMovies = async () => {
    try {
      const response = await fetch("https://web-production-6321.up.railway.app/movies")
      const movies: Movie[] = await response.json()
      // Get random 6 movies for "You May Also Like"
      const shuffled = movies.sort(() => 0.5 - Math.random())
      setRelatedMovies(shuffled.slice(0, 6))
    } catch (error) {
      console.error("Failed to fetch related movies")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Movie Not Found</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            href="/"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Link
          href="/home"
          className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-500 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Home</span>
        </Link>
      </div>

      {/* Movie Hero */}
      <section className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Movie Poster */}
            <div className="lg:col-span-1">
              <div className="aspect-[2/3] relative overflow-hidden rounded-lg shadow-lg">
                <img
                  src={movie.thumbnail_url || "/placeholder.svg"}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Movie Details */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-4 text-black">{movie.title}</h1>

                <div className="flex flex-wrap items-center gap-4 mb-4">
                  {movie.release_date && (
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-5 w-5 mr-2" />
                      <span>{new Date(movie.release_date).getFullYear()}</span>
                    </div>
                  )}
                  <div className="flex items-center text-gray-600">
                    <Star className="h-5 w-5 mr-2 text-yellow-500" />
                    <span>HD Quality</span>
                  </div>
                </div>

                <p className="text-gray-700 text-lg leading-relaxed">{movie.details}</p>
              </div>

              {/* Download Section */}
              <div className="bg-gray-50 rounded-lg p-6">
                <DownloadLinks
                  video_link_720p={movie.video_link_720p}
                  video_link_1080p={movie.video_link_1080p}
                  title={movie.title}
                  movieId={movie.id}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* You May Also Like */}
      {relatedMovies.length > 0 && (
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold mb-8 text-black">You May Also Like</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {relatedMovies.map((relatedMovie) => (
                <MovieCard key={relatedMovie.id} movie={relatedMovie} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
