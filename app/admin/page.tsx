"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Lock, Eye, EyeOff, Trash2, Search, Plus } from "lucide-react"
import type { Movie } from "@/contexts/MovieContext"

interface AdminSettings {
  latestMovieIds: number[]
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  // Movie management state
  const [movies, setMovies] = useState<Movie[]>([])
  const [loadingMovies, setLoadingMovies] = useState(false)
  const [adminSettings, setAdminSettings] = useState<AdminSettings>({
    latestMovieIds: [],
  })
  const [loadingSettings, setLoadingSettings] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (isAuthenticated) {
      fetchMovies()
      fetchAdminSettings()
    }
  }, [isAuthenticated])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (username === "Venura" && password === "Venura") {
      setIsAuthenticated(true)
      setError("")
    } else {
      setError("Invalid credentials")
    }
  }

  const fetchMovies = async () => {
    setLoadingMovies(true)
    try {
      const response = await fetch("https://web-production-6321.up.railway.app/movies")
      if (!response.ok) throw new Error("Failed to fetch movies from external API")
      const moviesData: Movie[] = await response.json()
      setMovies(moviesData)
    } catch (error) {
      console.error("Failed to fetch movies:", error)
    } finally {
      setLoadingMovies(false)
    }
  }

  const fetchAdminSettings = async () => {
    setLoadingSettings(true)
    try {
      const response = await fetch("/api/admin/settings")
      if (!response.ok) throw new Error("Failed to fetch admin settings")
      const data = await response.json()
      setAdminSettings({ latestMovieIds: data.latestMovieIds || [] })
    } catch (error) {
      console.error("Failed to fetch admin settings:", error)
    } finally {
      setLoadingSettings(false)
    }
  }

  const updateAdminSettings = async (newLatestMovieIds: number[]) => {
    setLoadingSettings(true)
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ latestMovieIds: newLatestMovieIds }),
      })
      if (!response.ok) throw new Error("Failed to update admin settings")
      const data = await response.json()
      setAdminSettings({ latestMovieIds: data.latestMovieIds })
    } catch (error) {
      console.error("Failed to update admin settings:", error)
    } finally {
      setLoadingSettings(false)
    }
  }

  const addToLatest = useCallback(
    (movieId: number) => {
      if (adminSettings.latestMovieIds.length >= 12) {
        alert("You can only add up to 12 latest movies.")
        return
      }
      if (!adminSettings.latestMovieIds.includes(movieId)) {
        const newLatestMovieIds = [...adminSettings.latestMovieIds, movieId]
        updateAdminSettings(newLatestMovieIds)
      }
    },
    [adminSettings.latestMovieIds],
  )

  const removeFromLatest = useCallback(
    (movieId: number) => {
      const newLatestMovieIds = adminSettings.latestMovieIds.filter((id) => id !== movieId)
      updateAdminSettings(newLatestMovieIds)
    },
    [adminSettings.latestMovieIds],
  )

  const getLatestMovies = () => {
    return movies.filter((movie) => adminSettings.latestMovieIds.includes(movie.id))
  }

  const getAvailableMovies = () => {
    let filtered = movies.filter((movie) => !adminSettings.latestMovieIds.includes(movie.id))

    if (searchQuery) {
      filtered = filtered.filter((movie) => movie.title.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    return filtered
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <Lock className="mx-auto h-12 w-12 text-blue-600" />
            <h2 className="mt-6 text-3xl font-bold text-white">Admin Access</h2>
            <p className="mt-2 text-gray-400">Enter your credentials to access the admin panel</p>
          </div>

          <form onSubmit={handleLogin} className="mt-8 space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-2 text-white">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-700 rounded-lg bg-gray-900 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2 text-white">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-700 rounded-lg bg-gray-900 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && <div className="text-red-600 text-sm text-center">{error}</div>}

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (loadingMovies || loadingSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Panel</h1>
            <p className="text-gray-400">Manage movies and site content</p>
          </div>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900 p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2 text-white">Total Movies</h3>
            <p className="text-3xl font-bold text-blue-600">{movies.length}</p>
          </div>
          <div className="bg-gray-900 p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2 text-white">Latest Movies</h3>
            <p className="text-3xl font-bold text-green-600">{adminSettings.latestMovieIds.length}/12</p>
          </div>
          <div className="bg-gray-900 p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-2 text-white">Available</h3>
            <p className="text-3xl font-bold text-orange-600">{movies.length - adminSettings.latestMovieIds.length}</p>
          </div>
        </div>

        {/* Current Latest Movies */}
        <div className="bg-gray-900 p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center text-white">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            Current Latest Movies ({getLatestMovies().length}/12)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 max-h-96 overflow-y-auto">
            {getLatestMovies().map((movie) => (
              <div key={movie.id} className="bg-gray-800 rounded-lg p-3">
                <img
                  src={movie.thumbnail_url || "/placeholder.svg"}
                  alt={movie.title}
                  className="w-full aspect-[2/3] object-cover rounded mb-2"
                />
                <p className="text-xs font-medium line-clamp-2 mb-2 text-white">{movie.title}</p>
                <button
                  onClick={() => removeFromLatest(movie.id)}
                  className="w-full bg-red-500 hover:bg-red-600 text-white text-xs py-1 px-2 rounded transition-colors flex items-center justify-center space-x-1"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Remove</span>
                </button>
              </div>
            ))}
            {getLatestMovies().length === 0 && (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500">No latest movies selected</p>
              </div>
            )}
          </div>
        </div>

        {/* Add Movies Section */}
        <div className="bg-gray-900 p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Add Movies to Latest Section</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search movies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-700 rounded-lg bg-gray-800 text-sm text-white"
              />
            </div>
          </div>

          {/* Movies Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 max-h-96 overflow-y-auto">
            {getAvailableMovies().map((movie) => (
              <div key={movie.id} className="bg-gray-800 rounded-lg p-3">
                <img
                  src={movie.thumbnail_url || "/placeholder.svg"}
                  alt={movie.title}
                  className="w-full aspect-[2/3] object-cover rounded mb-2"
                />
                <p className="text-xs font-medium line-clamp-2 mb-2 text-white">{movie.title}</p>
                <button
                  onClick={() => addToLatest(movie.id)}
                  className="w-full bg-green-500 hover:bg-green-600 text-white text-xs py-1 px-2 rounded transition-colors flex items-center justify-center space-x-1"
                  disabled={adminSettings.latestMovieIds.length >= 12}
                >
                  <Plus className="h-3 w-3" />
                  <span>Add</span>
                </button>
              </div>
            ))}
            {getAvailableMovies().length === 0 && (
              <div className="col-span-full text-center py-8">
                <p className="text-gray-500">No available movies to add</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
