"use client"

import type React from "react"

import { createContext, useContext, useReducer, type ReactNode } from "react"

interface Movie {
  id: number
  title: string
  details: string
  release_date: string
  thumbnail_url: string
  video_link_480p: string
  video_link_720p: string
  video_link_1080p: string
  is_hero?: boolean
  is_latest?: boolean
}

interface MovieState {
  movies: Movie[]
  loading: boolean
  error: string | null
  heroMovies: Movie[]
  latestMovies: Movie[]
}

type MovieAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_MOVIES"; payload: Movie[] }
  | { type: "SET_ERROR"; payload: string }
  | { type: "SET_HERO_MOVIES"; payload: Movie[] }
  | { type: "SET_LATEST_MOVIES"; payload: Movie[] }

const initialState: MovieState = {
  movies: [],
  loading: false,
  error: null,
  heroMovies: [],
  latestMovies: [],
}

const movieReducer = (state: MovieState, action: MovieAction): MovieState => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, loading: action.payload }
    case "SET_MOVIES":
      return { ...state, movies: action.payload, loading: false }
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false }
    case "SET_HERO_MOVIES":
      return { ...state, heroMovies: action.payload }
    case "SET_LATEST_MOVIES":
      return { ...state, latestMovies: action.payload }
    default:
      return state
  }
}

const MovieContext = createContext<{
  state: MovieState
  dispatch: React.Dispatch<MovieAction>
} | null>(null)

export const MovieProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(movieReducer, initialState)

  return <MovieContext.Provider value={{ state, dispatch }}>{children}</MovieContext.Provider>
}

export const useMovies = () => {
  const context = useContext(MovieContext)
  if (!context) {
    throw new Error("useMovies must be used within a MovieProvider")
  }
  return context
}

export type { Movie }
