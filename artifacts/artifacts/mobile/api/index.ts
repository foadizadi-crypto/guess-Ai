// ─── API barrel ───────────────────────────────────────────────────────────
// Re-export service singletons for convenient import from @/api.

export { openAIService, default as OpenAIService } from '@/services/OpenAIService';
export { storageService, default as StorageService } from '@/services/StorageService';
