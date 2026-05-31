/**
 * Bulk Upload orchestrator.
 * Ties together file parsing, AI analysis, and product building.
 */

export { parseUploadedFiles } from './parse-files'
export type { UploadedFile, ParsedProduct, ParsedImage } from './parse-files'

export { analyzeProducts, analyzeProductImage, getCachedVersions, hashImage } from './analyze'
export type { AIAnalysis, CachedVersion } from './analyze'

export { buildProductPreviews, richText } from './product-builder'
export type { ProductPreviewData } from './product-builder'

export { getProductPricing, slugify, titleCase } from './pricing'
export type { PricingResult } from './pricing'
