import { setupServer } from 'msw/node'
import { handlers } from './handlers'

// Individual tests override the default handlers with server.use(...) for error, empty
// and malformed responses; resetHandlers() in setup.ts restores the defaults.
export const server = setupServer(...handlers)
