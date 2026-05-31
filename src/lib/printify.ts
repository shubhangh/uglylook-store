/**
 * Printify API client for UglyLook automated fulfillment.
 *
 * Supports both product-based and blueprint-direct (lineItemWithBlueprint) orders.
 * Blueprint-direct is preferred — no Printify product creation needed.
 *
 * Docs: https://developers.printify.com/
 */

const PRINTIFY_API_BASE = 'https://api.printify.com/v1'

function getHeaders(): HeadersInit {
  const token = process.env.PRINTIFY_API_TOKEN
  if (!token) throw new Error('PRINTIFY_API_TOKEN is not set')
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

function getShopId(): string {
  const shopId = process.env.PRINTIFY_SHOP_ID
  if (!shopId) throw new Error('PRINTIFY_SHOP_ID is not set')
  return shopId
}

async function printifyFetch<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${PRINTIFY_API_BASE}${path}`
  const res = await fetch(url, {
    ...options,
    headers: { ...getHeaders(), ...(options.headers || {}) },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Printify API error ${res.status}: ${body}`)
  }

  const text = await res.text()
  return text ? JSON.parse(text) : ({} as T)
}

// ── Types ──────────────────────────────────────────────────────────

/** PrintifyConfig stored on each Payload product — single source of truth */
export interface PrintifyConfig {
  blueprintId: number
  providerId: number
  designUrl: string
  placement: {
    position: string // "front", "back", etc.
    x: number // 0-1 float
    y: number // 0-1 float
    scale: number // 0-1 float
    angle: number // radians
  }
  variantMap: Record<string, number> // e.g. { "Black_S": 45231, "Black_M": 45232 }
}

/** Blueprint-direct line item — no Printify product needed */
export interface BlueprintLineItem {
  blueprint_id: number
  print_provider_id: number
  variant_id: number
  quantity: number
  print_areas: Record<string, string | PrintAreaImage[]>
}

/** Advanced print area image with positioning */
export interface PrintAreaImage {
  src: string
  x?: number
  y?: number
  scale?: number
  angle?: number
}

/** Legacy: product-based line item */
export interface ProductLineItem {
  product_id: string
  variant_id: number
  quantity: number
}

export interface PrintifyAddress {
  first_name: string
  last_name: string
  email: string
  phone?: string
  country: string
  region: string
  address1: string
  address2?: string
  city: string
  zip: string
}

/** Order payload — supports both line item formats */
export interface PrintifyOrderPayload {
  external_id: string
  label?: string
  line_items: (BlueprintLineItem | ProductLineItem)[]
  shipping_method: number
  is_printify_express: boolean
  send_shipping_notification: boolean
  address_to: PrintifyAddress
}

export interface PrintifyOrder {
  id: string
  status: string
  created_at: string
  shipments: PrintifyShipment[]
  line_items: any[]
  metadata: {
    order_type: string
    shop_fulfilled_at?: string
  }
}

export interface PrintifyShipment {
  carrier: string
  number: string
  url: string
  delivered_at?: string
}

export interface PrintifyWebhookEvent {
  id: string
  type: string
  created_at: string
  resource: {
    id: string
    data: {
      status?: string
      shipments?: PrintifyShipment[]
    } & Record<string, any>
  }
}

export interface PrintifyBlueprint {
  id: number
  title: string
  description: string
  brand: string
  model: string
  images: string[]
}

export interface PrintifyProvider {
  id: number
  title: string
  decoration_methods?: { id: number; title: string }[]
}

export interface PrintifyVariant {
  id: number
  title: string
  options: Record<string, any>
  placeholders: {
    position: string
    width: number
    height: number
  }[]
  cost: number
  is_enabled: boolean
  is_available: boolean
}

// ── Shop ───────────────────────────────────────────────────────────

export async function listShops() {
  return printifyFetch<{ id: number; title: string; sales_channel: string }[]>(
    '/shops.json',
  )
}

// ── Catalog ────────────────────────────────────────────────────────

/** List all blueprints in the Printify catalog */
export async function listBlueprints() {
  return printifyFetch<PrintifyBlueprint[]>('/catalog/blueprints.json')
}

/** Get a specific blueprint */
export async function getBlueprint(blueprintId: number) {
  return printifyFetch<PrintifyBlueprint>(
    `/catalog/blueprints/${blueprintId}.json`,
  )
}

/** List print providers for a blueprint */
export async function getProviders(blueprintId: number) {
  return printifyFetch<PrintifyProvider[]>(
    `/catalog/blueprints/${blueprintId}/print_providers.json`,
  )
}

/** Get variants (sizes/colors + print areas) for a blueprint × provider */
export async function getVariants(blueprintId: number, providerId: number) {
  return printifyFetch<{ id: number; title: string; variants: PrintifyVariant[] }>(
    `/catalog/blueprints/${blueprintId}/print_providers/${providerId}/variants.json`,
  )
}

/**
 * Probe variant costs by creating a temp product, reading costs, then deleting.
 * Printify only exposes variant `cost` on Product objects, not in the Catalog API.
 * Returns a map of variantId → cost (in cents).
 */
export async function probeVariantCosts(
  blueprintId: number,
  providerId: number,
  sampleVariantId: number,
  imageId?: string,
): Promise<Map<number, number>> {
  const shopId = getShopId()
  const costMap = new Map<number, number>()

  // Use a known uploaded image, or a placeholder
  const imgId = imageId || await getOrCreateProbeImage()

  try {
    // Create temp product with 1 variant — response includes ALL variants with costs
    const product = await printifyFetch<{
      id: string
      variants: { id: number; cost: number; price: number; title: string }[]
    }>(`/shops/${shopId}/products.json`, {
      method: 'POST',
      body: JSON.stringify({
        title: '__cost_probe__',
        blueprint_id: blueprintId,
        print_provider_id: providerId,
        variants: [{ id: sampleVariantId, price: 100, is_enabled: true }],
        print_areas: [{
          variant_ids: [sampleVariantId],
          placeholders: [{
            position: 'front',
            images: [{ id: imgId, x: 0.5, y: 0.5, scale: 1, angle: 0 }],
          }],
        }],
      }),
    })

    // Extract all variant costs
    for (const v of product.variants || []) {
      if (v.cost > 0) {
        costMap.set(v.id, v.cost)
      }
    }

    // Delete temp product (fire and forget)
    printifyFetch(`/shops/${shopId}/products/${product.id}.json`, {
      method: 'DELETE',
    }).catch(() => {})
  } catch (err: any) {
    // Non-fatal — we just won't have costs
    console.error(`[probeVariantCosts] Failed for bp=${blueprintId} prov=${providerId}: ${err.message}`)
  }

  return costMap
}

// Cache the probe image ID so we only look it up once per process
let _probeImageId: string | null = null

async function getOrCreateProbeImage(): Promise<string> {
  if (_probeImageId) return _probeImageId

  // Check for existing uploads
  const uploads = await printifyFetch<{ data: { id: string }[] }>('/uploads.json?limit=1')
  if (uploads.data?.length > 0) {
    _probeImageId = uploads.data[0].id
    return _probeImageId
  }

  // Upload a minimal 1x1 white PNG
  const result = await printifyFetch<{ id: string }>('/uploads/images.json', {
    method: 'POST',
    body: JSON.stringify({
      file_name: 'probe.png',
      url: 'https://via.placeholder.com/100x100/FFFFFF/FFFFFF.png',
    }),
  })
  _probeImageId = result.id
  return _probeImageId
}

/** Get shipping costs for a blueprint × provider */
export async function getShipping(blueprintId: number, providerId: number) {
  return printifyFetch<{
    handling_time: { value: number; unit: string }
    profiles: {
      variant_ids: number[]
      first_item: { currency: string; cost: number }
      additional_items: { currency: string; cost: number }
      countries: string[]
    }[]
  }>(`/catalog/blueprints/${blueprintId}/print_providers/${providerId}/shipping.json`)
}

// ── Uploads ────────────────────────────────────────────────────────

/** Upload an image to Printify by URL (preferred — no base64 needed) */
export async function uploadImageByUrl(fileName: string, url: string) {
  return printifyFetch<{
    id: string
    file_name: string
    height: number
    width: number
    size: number
    mime_type: string
    preview_url: string
    upload_time: string
  }>('/uploads/images.json', {
    method: 'POST',
    body: JSON.stringify({ file_name: fileName, url }),
  })
}

/** Upload an image to Printify by base64 content */
export async function uploadImageByBase64(fileName: string, contents: string) {
  return printifyFetch<{
    id: string
    file_name: string
    height: number
    width: number
    preview_url: string
  }>('/uploads/images.json', {
    method: 'POST',
    body: JSON.stringify({ file_name: fileName, contents }),
  })
}

// ── Orders ─────────────────────────────────────────────────────────

/** Create an order (supports both product-based and blueprint-direct line items) */
export async function createOrder(
  payload: PrintifyOrderPayload,
): Promise<PrintifyOrder> {
  const shopId = getShopId()
  return printifyFetch<PrintifyOrder>(
    `/shops/${shopId}/orders.json`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )
}

/** Send an existing order to production */
export async function sendToProduction(
  printifyOrderId: string,
): Promise<PrintifyOrder> {
  const shopId = getShopId()
  return printifyFetch<PrintifyOrder>(
    `/shops/${shopId}/orders/${printifyOrderId}/send_to_production.json`,
    { method: 'POST' },
  )
}

/** Get order details */
export async function getOrder(
  printifyOrderId: string,
): Promise<PrintifyOrder> {
  const shopId = getShopId()
  return printifyFetch<PrintifyOrder>(
    `/shops/${shopId}/orders/${printifyOrderId}.json`,
  )
}

/** Cancel an order */
export async function cancelOrder(
  printifyOrderId: string,
): Promise<PrintifyOrder> {
  const shopId = getShopId()
  return printifyFetch<PrintifyOrder>(
    `/shops/${shopId}/orders/${printifyOrderId}/cancel.json`,
    { method: 'POST' },
  )
}

/** Calculate shipping cost */
export async function calculateShipping(
  lineItems: (BlueprintLineItem | ProductLineItem)[],
  addressTo: PrintifyAddress,
) {
  const shopId = getShopId()
  return printifyFetch<{
    standard: number
    express: number
    priority?: number
    economy?: number
  }>(`/shops/${shopId}/orders/shipping.json`, {
    method: 'POST',
    body: JSON.stringify({ line_items: lineItems, address_to: addressTo }),
  })
}

// ── Products ───────────────────────────────────────────────────────

export async function listProducts(page = 1, limit = 50) {
  const shopId = getShopId()
  return printifyFetch<{ current_page: number; data: any[]; total: number }>(
    `/shops/${shopId}/products.json?page=${page}&limit=${limit}`,
  )
}

export async function getProduct(printifyProductId: string) {
  const shopId = getShopId()
  return printifyFetch(`/shops/${shopId}/products/${printifyProductId}.json`)
}

// ── Webhooks ───────────────────────────────────────────────────────

export async function registerWebhook(
  topic: string,
  url: string,
): Promise<{ id: string; topic: string; url: string }> {
  const shopId = getShopId()
  return printifyFetch(`/shops/${shopId}/webhooks.json`, {
    method: 'POST',
    body: JSON.stringify({ topic, url }),
  })
}

export async function listWebhooks() {
  const shopId = getShopId()
  return printifyFetch<{ id: string; topic: string; url: string }[]>(
    `/shops/${shopId}/webhooks.json`,
  )
}

// ── Helpers ────────────────────────────────────────────────────────

/**
 * Build a blueprint-direct line item from a PrintifyConfig and variant key.
 *
 * The print_areas use the simple format (URL string) by default.
 * For advanced placement, pass useAdvancedPlacement: true.
 */
export function buildBlueprintLineItem(
  config: PrintifyConfig,
  variantKey: string,
  quantity: number,
  useAdvancedPlacement = false,
): BlueprintLineItem | null {
  const variantId = config.variantMap[variantKey]
  if (!variantId) return null

  const position = config.placement.position || 'front'

  let printAreas: Record<string, string | PrintAreaImage[]>

  if (useAdvancedPlacement) {
    printAreas = {
      [position]: [
        {
          src: config.designUrl,
          x: config.placement.x,
          y: config.placement.y,
          scale: config.placement.scale,
          angle: config.placement.angle,
        },
      ],
    }
  } else {
    // Simple format — Printify auto-centers and auto-scales
    printAreas = {
      [position]: config.designUrl,
    }
  }

  return {
    blueprint_id: config.blueprintId,
    print_provider_id: config.providerId,
    variant_id: variantId,
    quantity,
    print_areas: printAreas,
  }
}
