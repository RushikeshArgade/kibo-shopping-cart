import { combineReducers, configureStore } from '@reduxjs/toolkit'

// Feature reducers (products API, cart slice) are registered here as they land.
const rootReducer = combineReducers({})

export function makeStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
  })
}

export type RootState = ReturnType<typeof rootReducer>
export type AppStore = ReturnType<typeof makeStore>
export type AppDispatch = AppStore['dispatch']
