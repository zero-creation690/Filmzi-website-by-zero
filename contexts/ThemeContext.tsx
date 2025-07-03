"use client"

import type React from "react"

import { createContext, useContext, useReducer, type ReactNode } from "react"

type Theme = "light" | "dark"

interface ThemeState {
  theme: Theme
}

type ThemeAction = { type: "TOGGLE_THEME" }

const initialState: ThemeState = {
  theme: "light",
}

const themeReducer = (state: ThemeState, action: ThemeAction): ThemeState => {
  switch (action.type) {
    case "TOGGLE_THEME":
      return { theme: state.theme === "light" ? "dark" : "light" }
    default:
      return state
  }
}

const ThemeContext = createContext<{
  state: ThemeState
  dispatch: React.Dispatch<ThemeAction>
} | null>(null)

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(themeReducer, initialState)

  return (
    <ThemeContext.Provider value={{ state, dispatch }}>
      <div className={state.theme}>{children}</div>
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
