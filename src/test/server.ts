import { setupServer } from 'msw/node'

// Default handlers for the happy path are added per feature (e.g. products) as they land.
// Individual tests override them with server.use(...) for error, empty and malformed responses.
export const server = setupServer()
