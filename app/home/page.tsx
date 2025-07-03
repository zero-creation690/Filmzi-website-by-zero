"use client"

import { useEffect, useState, useCallback } from "react"
import { Flame, Clock, Star, Download, ChevronLeft, ChevronRight } from "lucide-react"
import { useMovies, type Movie } from "@/contexts/MovieContext"
import MovieCard from "@/components/MovieCard"
import SearchBar from "@/components/SearchBar"

interface AdminSettings {
  latestMovieIds: number[]
}

export default function HomePage() {
  const { state, dispatch } = useMovies()
  const [latestMovies, setLatestMovies] = useState<Movie[]>([])
  const [adminSettings, setAdminSettings] = useState<AdminSettings>({
    latestMovieIds: [],
  })
  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false)

  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Movie[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)

  // State for "All Movies" pagination
  const [allMoviesCurrentPage, setAllMoviesCurrentPage] = useState(1)
  const MOVIES_PER_PAGE = 24 // Number of movies to display per page in "All Movies" section

  const fetchMovies = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true })
    try {
      const response = await fetch("https://web-production-6321.up.railway.app/movies")
      if (!response.ok) throw new Error("Failed to fetch")
      const movies: Movie[] = await response.json()
      dispatch({ type: "SET_MOVIES", payload: movies })
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: "Failed to fetch movies" })
    }
  }, [dispatch])

  const fetchAdminSettings = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/settings")
      if (!response.ok) throw new Error("Failed to fetch admin settings")
      const data = await response.json()
      setAdminSettings({ latestMovieIds: data.latestMovieIds || [] })
    } catch (error) {
      console.error("Failed to fetch admin settings:", error)
      setAdminSettings({ latestMovieIds: [] }) // Fallback to empty array if settings fail to load
    }
  }, [])

  // Combined effect for initial data loading
  useEffect(() => {
    const loadInitialData = async () => {
      dispatch({ type: "SET_LOADING", payload: true })
      await Promise.all([fetchMovies(), fetchAdminSettings()])
      dispatch({ type: "SET_LOADING", payload: false })
      setIsInitialDataLoaded(true)
    }
    loadInitialData()
  }, [dispatch, fetchMovies, fetchAdminSettings])

  // Effect to update latestMovies based on fetched data and admin settings
  useEffect(() => {
    if (isInitialDataLoaded && state.movies.length > 0) {
      const selectedLatestMovies = state.movies.filter((movie) => adminSettings.latestMovieIds.includes(movie.id))
      setLatestMovies(selectedLatestMovies)
      dispatch({ type: "SET_LATEST_MOVIES", payload: selectedLatestMovies })
    } else if (isInitialDataLoaded && state.movies.length === 0) {
      // If no movies are fetched at all, ensure latestMovies is empty
      setLatestMovies([])
      dispatch({ type: "SET_LATEST_MOVIES", payload: [] })
    }
  }, [isInitialDataLoaded, state.movies, adminSettings.latestMovieIds, dispatch])

  const handleSearch = (query: string) => {
    setSearchQuery(query)

    if (query.trim()) {
      const filtered = state.movies.filter(
        (movie) =>
          movie.title.toLowerCase().includes(query.toLowerCase()) ||
          movie.details.toLowerCase().includes(query.toLowerCase()),
      )
      setSearchResults(filtered.slice(0, 8))
      setShowSearchResults(true)
    } else {
      setSearchResults([])
      setShowSearchResults(false)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest(".search-container")) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Create a set of IDs for all movies displayed in "Latest Releases"
  const featuredMovieIds = new Set(latestMovies.map((movie) => movie.id))

  // Filter out movies that are already featured in "Latest Releases" for "All Movies"
  const allMoviesForPagination = state.movies.filter((movie) => !featuredMovieIds.has(movie.id))

  // Calculate indices for the "All Movies" section pagination
  const startIndex = (allMoviesCurrentPage - 1) * MOVIES_PER_PAGE
  const endIndex = startIndex + MOVIES_PER_PAGE

  const displayedAllMovies = allMoviesForPagination.slice(startIndex, endIndex)

  // Check if there are more movies to load in the filtered list
  const hasPreviousPage = allMoviesCurrentPage > 1
  const hasNextPage = allMoviesForPagination.length > endIndex

  const handleLoadMoreAllMovies = () => {
    setAllMoviesCurrentPage((prev) => prev + 1)
    window.scrollTo({ top: 0, behavior: "smooth" }) // Scroll to top on page change
  }

  const handleLoadPreviousAllMovies = () => {
    setAllMoviesCurrentPage((prev) => Math.max(1, prev - 1))
    window.scrollTo({ top: 0, behavior: "smooth" }) // Scroll to top on page change
  }

  if (state.loading && !isInitialDataLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Search Section - Optimized */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Find Your Movie</h1>
          <p className="text-blue-100 mb-6">Search from 150+ HD movies</p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-6 relative search-container">
            <SearchBar onSearch={handleSearch} placeholder="Search movies..." className="w-full" />

            {/* Live Search Results */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                <div className="p-4">
                  <p className="text-sm text-gray-600 mb-3">
                    {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for "{searchQuery}"
                  </p>
                  <div className="space-y-2">
                    {searchResults.map((movie) => (
                      <div
                        key={movie.id}
                        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                        onClick={() => {
                          window.location.href = `/movie/${movie.id}`
                          setShowSearchResults(false)
                        }}
                      >
                        <img
                          src={movie.thumbnail_url || "/placeholder.svg"}
                          alt={movie.title}
                          className="w-10 h-14 object-cover rounded"
                          loading="lazy"
                        />
                        <div className="flex-1 text-left">
                          <h4 className="font-medium text-gray-900 line-clamp-1 text-sm">{movie.title}</h4>
                          <p className="text-xs text-gray-500 line-clamp-1">
                            {movie.release_date && new Date(movie.release_date).getFullYear()}
                          </p>
                        </div>
                        <Download className="h-4 w-4 text-blue-600" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* No Results */}
            {showSearchResults && searchQuery && searchResults.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                <div className="p-4 text-center">
                  <p className="text-gray-600 text-sm">No movies found for "{searchQuery}"</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 text-yellow-400" />
              <span>HD Quality</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4 text-green-400" />
              <span>Instant</span>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Releases - Only on the first page of All Movies */}
      {allMoviesCurrentPage === 1 && (
        <section className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-3 mb-6">
              <Flame className="h-6 w-6 text-red-500" />
              <h2 className="text-2xl font-bold text-black">Latest Releases</h2>
            </div>

            {latestMovies.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                {latestMovies.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-600">
                No latest movies selected yet. Add them from the admin panel!
              </div>
            )}
          </div>
        </section>
      )}

      {/* All Movies (now continuous on homepage) */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-black">All Movies</h2>
          </div>

          {displayedAllMovies.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {displayedAllMovies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600">No more movies to display.</div>
          )}

          {/* Pagination Controls */}
          <div className="flex justify-center items-center gap-4 mt-8">
            {hasPreviousPage && (
              <button
                onClick={handleLoadPreviousAllMovies}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <ChevronLeft className="h-5 w-5" />
                <span>Back</span>
              </button>
            )}

            {hasNextPage && (
              <button
                onClick={handleLoadMoreAllMovies}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
              >
                <span>Next Page</span>
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
