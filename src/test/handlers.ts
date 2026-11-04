import { http, HttpResponse } from 'msw'
import { API_BASE_URL } from '../features/products/productsApi'
import { apiCategories, apiProducts } from './fixtures/products'

export const productsUrl = `${API_BASE_URL}/products`
export const categoriesUrl = `${API_BASE_URL}/products/categories`

// Happy-path responses. Tests override these with server.use(...) for failures.
export const handlers = [
  http.get(productsUrl, () => HttpResponse.json(apiProducts)),
  http.get(categoriesUrl, () => HttpResponse.json(apiCategories)),
]
