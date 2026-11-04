import {
  createApi,
  fetchBaseQuery,
  retry,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react'
import { parseCategories, parseProducts } from './schemas'
import type { Product } from './types'

export const API_BASE_URL = 'https://fakestoreapi.com'

const MAX_RETRIES = 1

const baseQuery = retry(fetchBaseQuery({ baseUrl: API_BASE_URL, timeout: 10_000 }), {
  // Retry once, and only when trying again could help: network failures, timeouts and
  // 5xx. A 4xx or bad data would just fail the same way again.
  // (RTK's retryCondition replaces maxRetries, so the attempt count is checked here.)
  retryCondition: (error, _args, { attempt }) => {
    if (attempt > MAX_RETRIES) return false
    const { status } = error as FetchBaseQueryError
    return (
      status === 'FETCH_ERROR' ||
      status === 'TIMEOUT_ERROR' ||
      (typeof status === 'number' && status >= 500)
    )
  },
}) as BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError>

/**
 * Fetches a path and validates the body. Validation runs here rather than in
 * transformResponse: a throw there is treated by RTK Query as an unhandled error (console
 * noise, stack trace in the store). Here a bad response becomes a normal CUSTOM_ERROR, the
 * same shape as network and HTTP errors, so the UI has one error path.
 */
function validatedQuery<T>(path: string, parse: (raw: unknown) => T) {
  return async (
    _arg: void,
    _api: unknown,
    _extraOptions: unknown,
    fetch: (path: string) => ReturnType<typeof baseQuery>,
  ): Promise<{ data: T } | { error: FetchBaseQueryError }> => {
    const result = await fetch(path)
    if (result.error) return { error: result.error }
    try {
      return { data: parse(result.data) }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid response'
      return { error: { status: 'CUSTOM_ERROR', error: message } }
    }
  }
}

export const productsApi = createApi({
  reducerPath: 'productsApi',
  baseQuery,
  endpoints: (build) => ({
    getProducts: build.query<Product[], void>({
      queryFn: validatedQuery('/products', parseProducts),
    }),
    getCategories: build.query<string[], void>({
      queryFn: validatedQuery('/products/categories', parseCategories),
    }),
  }),
})

export const { useGetProductsQuery, useGetCategoriesQuery } = productsApi
