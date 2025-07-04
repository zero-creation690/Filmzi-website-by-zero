'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
// import { useMovies } from '../../context/MovieContext' // Update this path to match your project structure

const Watch = () => {
  const { id } = useParams()
  // const { fetchMovie } = useMovies() // Uncomment when MovieContext is available
  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentQuality, setCurrentQuality] = useState('720p')
  const playerRef = useRef(null)
  const clapprPlayerRef = useRef(null)

  // Temporary mock function - replace with your actual fetchMovie function
  const fetchMovie = async (movieId) => {
    // Replace this with your actual API call
    try {
      const response = await fetch(`/api/movies/${movieId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch movie')
      }
      return await response.json()
    } catch (error) {
      throw new Error('Movie not found')
    }
  }

  useEffect(() => {
    const loadMovie = async () => {
      try {
        setLoading(true)
        const movieData = await fetchMovie(id)
        setMovie(movieData)
        
        // Set initial quality based on available options
        if (movieData.video_link_1080p) {
          setCurrentQuality('1080p')
        } else if (movieData.video_link_720p) {
          setCurrentQuality('720p')
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadMovie()
  }, [id, fetchMovie])

  useEffect(() => {
    // Load Clappr dynamically
    const loadClappr = async () => {
      if (typeof window !== 'undefined' && !window.Clappr) {
        // Create script element
        const script = document.createElement('script')
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/clappr/0.4.7/clappr.min.js'
        script.async = true
        
        // Create link element for CSS
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/clappr/0.4.7/clappr.min.css'
        
        // Append to head
        document.head.appendChild(link)
        document.head.appendChild(script)
        
        // Wait for script to load
        script.onload = () => {
          if (movie && playerRef.current) {
            initializeClapprPlayer()
          }
        }
      } else if (movie && playerRef.current && window.Clappr) {
        initializeClapprPlayer()
      }
    }

    if (movie) {
      loadClappr()
    }

    return () => {
      if (clapprPlayerRef.current) {
        clapprPlayerRef.current.destroy()
      }
    }
  }, [movie, currentQuality])

  const initializeClapprPlayer = () => {
    // Destroy existing player if it exists
    if (clapprPlayerRef.current) {
      clapprPlayerRef.current.destroy()
    }

    // Check if Clappr is available
    if (typeof window.Clappr === 'undefined') {
      console.error('Clappr is not loaded')
      return
    }

    const videoSrc = getCurrentVideoSource()
    if (!videoSrc) {
      console.error('No video source available')
      return
    }

    const playerOptions = {
      source: videoSrc,
      poster: movie.thumbnail_url,
      width: '100%',
      height: '100%',
      autoPlay: false,
      plugins: ['MediaControl', 'Poster'],
      mediacontrol: {
        seekbar: '#E50914',
        buttons: '#FFF'
      },
      playbackNotSupportedMessage: 'Your browser does not support the playback of this video.',
      exitFullscreenOnEnd: true,
      persistConfig: false
    }

    try {
      clapprPlayerRef.current = new window.Clappr.Player(playerOptions)
      clapprPlayerRef.current.attachTo(playerRef.current)
    } catch (error) {
      console.error('Error initializing Clappr player:', error)
      setError('Failed to initialize video player')
    }
  }

  const getCurrentVideoSource = () => {
    if (!movie) return null
    
    switch (currentQuality) {
      case '1080p':
        return movie.video_link_1080p
      case '720p':
        return movie.video_link_720p
      default:
        return movie.video_link_720p || movie.video_link_1080p
    }
  }

  const handleQualityChange = (quality) => {
    setCurrentQuality(quality)
  }

  const getAvailableQualities = () => {
    if (!movie) return []
    
    const qualities = []
    if (movie.video_link_1080p) qualities.push('1080p')
    if (movie.video_link_720p) qualities.push('720p')
    return qualities
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-filmzi-accent"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-filmzi-accent mb-4">Error</h2>
          <p className="text-gray-400">{error}</p>
          <Link href="/" className="text-filmzi-accent hover:text-filmzi-hover mt-4 inline-block">
            Return to Home
          </Link>
        </div>
      </div>
    )
  }

  if (!movie) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-filmzi-accent mb-4">Movie Not Found</h2>
          <Link href="/" className="text-filmzi-accent hover:text-filmzi-hover">
            Return to Home
          </Link>
        </div>
      </div>
    )
  }

  const availableQualities = getAvailableQualities()

  return (
    <div className="min-h-screen bg-filmzi-bg">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link 
            href={`/movie/${movie.id}`}
            className="inline-flex items-center text-filmzi-accent hover:text-filmzi-hover transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Movie Details
          </Link>
        </div>

        {/* Movie Title */}
        <h1 className="text-3xl font-bold text-filmzi-text mb-4">{movie.title}</h1>

        {/* Quality Selector */}
        {availableQualities.length > 1 && (
          <div className="mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-gray-300 text-sm">Quality:</span>
              {availableQualities.map((quality) => (
                <button
                  key={quality}
                  onClick={() => handleQualityChange(quality)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    currentQuality === quality
                      ? 'bg-filmzi-accent text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {quality}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Video Player */}
        <div className="mb-8">
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <div 
              ref={playerRef}
              className="w-full h-full"
              style={{ minHeight: '400px' }}
            />
          </div>
        </div>

        {/* Movie Info */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-filmzi-text mb-4">About This Movie</h2>
          <p className="text-gray-300 text-lg leading-relaxed mb-6">{movie.details}</p>
          
          <div className="flex items-center space-x-4">
            {movie.is_hero && (
              <span className="bg-filmzi-accent text-white px-3 py-1 rounded-full text-sm">
                Featured
              </span>
            )}
            {movie.is_latest && (
              <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm">
                Latest
              </span>
            )}
          </div>
        </div>

        {/* Quality Information */}
        <div className="mt-8 bg-gray-900 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-filmzi-text mb-4">Available Quality Options</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {movie.video_link_720p && (
              <div className={`bg-gray-800 p-4 rounded-lg text-center transition-colors ${
                currentQuality === '720p' ? 'border-2 border-filmzi-accent' : ''
              }`}>
                <h4 className={`font-semibold mb-2 ${
                  currentQuality === '720p' ? 'text-filmzi-accent' : 'text-filmzi-text'
                }`}>
                  720p HD
                </h4>
                <p className="text-gray-400 text-sm">
                  High Definition Quality
                  {currentQuality === '720p' && ' (Currently Playing)'}
                </p>
              </div>
            )}
            {movie.video_link_1080p && (
              <div className={`bg-gray-800 p-4 rounded-lg text-center transition-colors ${
                currentQuality === '1080p' ? 'border-2 border-filmzi-accent' : ''
              }`}>
                <h4 className={`font-semibold mb-2 ${
                  currentQuality === '1080p' ? 'text-filmzi-accent' : 'text-filmzi-text'
                }`}>
                  1080p Full HD
                </h4>
                <p className="text-gray-400 text-sm">
                  Full High Definition Quality
                  {currentQuality === '1080p' && ' (Currently Playing)'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Watch
