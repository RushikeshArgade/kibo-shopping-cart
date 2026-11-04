import { Route, Routes } from 'react-router'

export function App() {
  return (
    <div className="min-h-dvh bg-white text-slate-900">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded focus:bg-slate-900 focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <header className="border-b border-slate-200">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <h1 className="text-xl font-semibold">Kibo Shop</h1>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-7xl px-4 py-6">
        <Routes>
          <Route path="/" element={<p>Products coming soon.</p>} />
        </Routes>
      </main>
    </div>
  )
}
