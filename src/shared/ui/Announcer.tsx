import { useCallback, useState, type ReactNode } from 'react'
import { AnnouncerContext } from './announcerContext'

const NBSP = String.fromCharCode(0xa0) // non-breaking space, spelled out so it's visible in source

/**
 * One live region for the whole app, always in the DOM (a region only announces changes if it
 * already exists). Screen readers ignore an update to identical text, so a repeated message
 * alternates a trailing non-breaking space to count as a change.
 */
export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('')

  const announce = useCallback((next: string) => {
    setMessage((current) => (current === next ? next + NBSP : next))
  }, [])

  return (
    <AnnouncerContext value={announce}>
      {children}
      <p aria-live="polite" className="sr-only" data-testid="announcer">
        {message}
      </p>
    </AnnouncerContext>
  )
}
