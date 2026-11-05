import { createContext, useContext } from 'react'

export const AnnouncerContext = createContext<(message: string) => void>(() => {})

/** Returns a function that reads a message to screen-reader users (politely). */
export function useAnnounce() {
  return useContext(AnnouncerContext)
}
