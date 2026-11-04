import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { makeStore } from '../../app/store'
import { apiCategories, apiProducts } from '../../test/fixtures/products'
import { categoriesUrl, productsUrl } from '../../test/handlers'
import { server } from '../../test/server'
import { productsApi } from './productsApi'

function fetchProducts() {
  return makeStore().dispatch(productsApi.endpoints.getProducts.initiate())
}

function fetchCategories() {
  return makeStore().dispatch(productsApi.endpoints.getCategories.initiate())
}

/** Serves the given responses in order (the last one repeats) and counts requests. */
function serveProducts(...responses: Array<() => Response>) {
  let calls = 0
  server.use(
    http.get(productsUrl, () => {
      const respond = responses[Math.min(calls, responses.length - 1)]!
      calls += 1
      return respond()
    }),
  )
  return { calls: () => calls }
}

describe('getProducts', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns validated products priced in cents with stock', async () => {
    const { data } = await fetchProducts()

    expect(data).toHaveLength(apiProducts.length)
    expect(data?.[0]).toMatchObject({ id: 1, priceCents: 10995, stock: 7 })
  })

  it('skips a malformed product and returns the rest', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    serveProducts(() => HttpResponse.json([...apiProducts, { id: 99, price: 'free' }]))

    const { data } = await fetchProducts()

    expect(data?.map((p) => p.id)).toEqual(apiProducts.map((p) => p.id))
  })

  it('reports a response that is not a list as a normal API error', async () => {
    serveProducts(() => HttpResponse.json({ not: 'a list' }))

    const { isError, error } = await fetchProducts()

    expect(isError).toBe(true)
    expect(error).toEqual({ status: 'CUSTOM_ERROR', error: 'Products response is not a list' })
  })

  it('retries a server error once, then reports it', async () => {
    const server500 = serveProducts(() => new HttpResponse(null, { status: 500 }))

    const { error } = await fetchProducts()

    expect(server500.calls()).toBe(2)
    expect(error).toMatchObject({ status: 500 })
  })

  it('retries a network failure once', async () => {
    const offline = serveProducts(() => HttpResponse.error())

    const { error } = await fetchProducts()

    expect(offline.calls()).toBe(2)
    expect(error).toMatchObject({ status: 'FETCH_ERROR' })
  })

  it('recovers when the retry succeeds', async () => {
    const flaky = serveProducts(
      () => new HttpResponse(null, { status: 503 }),
      () => HttpResponse.json(apiProducts),
    )

    const { data } = await fetchProducts()

    expect(flaky.calls()).toBe(2)
    expect(data).toHaveLength(apiProducts.length)
  })

  it('does not retry a client error', async () => {
    const notFound = serveProducts(() => new HttpResponse(null, { status: 404 }))

    const { error } = await fetchProducts()

    expect(notFound.calls()).toBe(1)
    expect(error).toMatchObject({ status: 404 })
  })
})

describe('getCategories', () => {
  it('returns the category list', async () => {
    const { data } = await fetchCategories()

    expect(data).toEqual(apiCategories)
  })

  it('reports a malformed list as a normal API error', async () => {
    server.use(http.get(categoriesUrl, () => HttpResponse.json(['electronics', 42])))

    const { error } = await fetchCategories()

    expect(error).toEqual({ status: 'CUSTOM_ERROR', error: 'Categories response is invalid' })
  })
})
