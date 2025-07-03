"use client"
import { Calendar, Download } from "lucide-react"
import type { Movie } from "@/contexts/MovieContext"

interface MovieCardProps {
  movie: Movie
  className?: string
}

export default function MovieCard({ movie, className = "" }: MovieCardProps) {
  const handleClick = () => {
    window.location.href = `/movie/${movie.id}`
  }

  return (
    <div
      className={`group relative bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer ${className}`}
      onClick={handleClick}
    >
      <div className="aspect-[2/3] relative overflow-hidden">
        <img
          src={movie.thumbnail_url || "/placeholder.svg"}
          alt={movie.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

        {/* Quality Badge */}
        <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">HD</div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center justify-center space-x-2 text-white">
              <Download className="h-4 w-4" />
              <span className="text-sm font-medium">Download Now</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3">
        <h3 className="font-semibold text-sm line-clamp-3 mb-2 text-black group-hover:text-blue-600 transition-colors">
          {movie.title}
        </h3>

        <div className="flex items-center justify-between text-xs text-gray-500">
          {movie.release_date && (
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              {new Date(movie.release_date).getFullYear()}
            </div>
          )}
          <div className="flex items-center space-x-1">
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Free</span>
          </div>
        </div>
      </div>
    </div>
  )
}
