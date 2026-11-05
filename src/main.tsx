import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router'
import { App } from './app/App'
import { makeStore } from './app/store'
import { AnnouncerProvider } from './shared/ui/Announcer'
import './index.css'

const store = makeStore()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      {/* Synchronous URL updates: the search input's value comes from the URL, and an input
          updated inside a transition loses its cursor position while typing. No Suspense-based
          routes here, so transitions bring no benefit. */}
      <BrowserRouter useTransitions={false}>
        <AnnouncerProvider>
          <App />
        </AnnouncerProvider>
      </BrowserRouter>
    </Provider>
  </StrictMode>,
)
