import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router'
import { makeStore, type AppStore, type RootState } from '../app/store'
import { AnnouncerProvider } from '../shared/ui/Announcer'

interface Options extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: Partial<RootState>
  store?: AppStore
  route?: string
}

// Renders with the same providers as main.tsx (store, router, announcer), so tests exercise
// the same wiring as the app.
export function renderWithProviders(
  ui: ReactElement,
  { preloadedState, store = makeStore(preloadedState), route = '/', ...options }: Options = {},
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <Provider store={store}>
        {/* Same as the app (main.tsx): synchronous URL updates. */}
        <MemoryRouter initialEntries={[route]} useTransitions={false}>
          <AnnouncerProvider>{children}</AnnouncerProvider>
        </MemoryRouter>
      </Provider>
    )
  }
  return { store, ...render(ui, { wrapper: Wrapper, ...options }) }
}
