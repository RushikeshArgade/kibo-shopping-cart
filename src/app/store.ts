import { combineReducers, configureStore } from '@reduxjs/toolkit'
import { productsApi } from '../features/products'

const rootReducer = combineReducers({
  [productsApi.reducerPath]: productsApi.reducer,
})

export function makeStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: rootReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(productsApi.middleware),
  })
}

export type RootState = ReturnType<typeof rootReducer>
export type AppStore = ReturnType<typeof makeStore>
export type AppDispatch = AppStore['dispatch']
