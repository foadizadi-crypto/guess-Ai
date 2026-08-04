/**
 * IAPService — NATIVE build (iOS / Android).
 *
 * Metro resolves this file instead of `IAPService.ts` on native platforms.
 * Uses react-native-iap v15 (Nitro bridge).  Falls back to mock behaviour in
 * Expo Go where the native module is not linked.
 *
 * Phase 2: Gem packs, dual ad-free pass (7-day / lifetime), starter pack.
 *
 * NOTE: IAP_SKUS is defined inline here (not re-exported from IAPService.ts)
 * to avoid a circular resolution: on native, Metro would resolve ./IAPService
 * back to this file.
 */

import { NativeModules } from 'react-native';

// ─── Product IDs ──────────────────────────────────────────────────────────────
export const IAP_SKUS = {
  // Coin packs (legacy)
  COINS_100:  'com.aiblur.quiz.coins_100',
  COINS_500:  'com.aiblur.quiz.coins_500',
  COINS_1200: 'com.aiblur.quiz.coins_1200',
  COINS_2500: 'com.aiblur.quiz.coins_2500',
  COINS_5000: 'com.aiblur.quiz.coins_5000',

  // Gem packs (Phase 2)
  GEMS_100:   'com.aiblur.quiz.gems_100',
  GEMS_500:   'com.aiblur.quiz.gems_500',
  GEMS_1200:  'com.aiblur.quiz.gems_1200',

  // Ad-Free Passes
  REMOVE_ADS:          'com.aiblur.quiz.remove_ads',
  ADFREE_7DAY:         'com.aiblur.quiz.adfree_7day',
  ADFREE_LIFETIME:     'com.aiblur.quiz.adfree_lifetime',

  // Bundles
  STARTER_PACK:        'com.aiblur.quiz.starter_pack',
  SEASON_PASS:         'com.aiblur.quiz.season_pass',
} as const;

export type IAPSku = typeof IAP_SKUS[keyof typeof IAP_SKUS];

export const SKU_COINS: Partial<Record<IAPSku, number>> = {
  [IAP_SKUS.COINS_100]:  100,
  [IAP_SKUS.COINS_500]:  500,
  [IAP_SKUS.COINS_1200]: 1200,
  [IAP_SKUS.COINS_2500]: 2500,
  [IAP_SKUS.COINS_5000]: 5000,
};

export const SKU_GEMS: Partial<Record<IAPSku, number>> = {
  [IAP_SKUS.GEMS_100]:  100,
  [IAP_SKUS.GEMS_500]:  500,
  [IAP_SKUS.GEMS_1200]: 1200,
};

export interface IAPProduct {
  sku: string;
  title: string;
  description: string;
  price: string;
  currency: string;
}

export type PurchaseResult = { success: boolean; transactionId: string | null };

// ─── Native availability ──────────────────────────────────────────────────────
const IAP_LINKED = !!(NativeModules.RnIap || NativeModules['react-native-iap']);

let _iap: typeof import('react-native-iap') | null = null;
if (IAP_LINKED) {
  try { _iap = require('react-native-iap'); } catch { _iap = null; }
}

// ─── Service ──────────────────────────────────────────────────────────────────

class IAPService {
  private static _instance: IAPService;
  static getInstance(): IAPService {
    if (!IAPService._instance) IAPService._instance = new IAPService();
    return IAPService._instance;
  }

  private connected = false;
  private purchaseListener: { remove(): void } | null = null;
  private pending = new Map<string, (result: PurchaseResult) => void>();

  get isMockMode(): boolean { return !IAP_LINKED || !_iap; }

  generateMockTxId(sku: string): string {
    return `MOCK_${sku}_${Date.now()}`;
  }

  async init(): Promise<void> {
    if (this.isMockMode || this.connected) return;
    try {
      await _iap!.initConnection();
      this.connected = true;
      this.setupListener();
    } catch (err) {
      if (__DEV__) console.warn('[IAPService] initConnection failed:', err);
    }
  }

  async dispose(): Promise<void> {
    this.purchaseListener?.remove();
    this.purchaseListener = null;
    this.connected = false;
  }

  async getProducts(skus: string[] = Object.values(IAP_SKUS)): Promise<IAPProduct[]> {
    if (this.isMockMode) return this.mockProducts(skus);
    try {
      const raw = await _iap!.fetchProducts({ skus, type: 'in-app' } as never);
      if (!raw) return [];
      return (raw as never[]).map((p: never) => ({
        sku: (p as { productId?: string; sku?: string }).productId ?? (p as { sku?: string }).sku ?? '',
        title: (p as { title?: string }).title ?? '',
        description: (p as { description?: string }).description ?? '',
        price: (p as { localizedPrice?: string; price?: string }).localizedPrice ?? (p as { price?: string }).price ?? '',
        currency: (p as { currency?: string }).currency ?? '',
      }));
    } catch {
      return this.mockProducts(skus);
    }
  }

  private grantAdFreePass(sku: string): void {
    const { useAdStore } = require('@/store/adStore');
    const store = useAdStore.getState();
    if (sku === IAP_SKUS.ADFREE_7DAY) {
      // 7-day pass: set expiry 7 days from now
      const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
      store.removeAds(expiry);
    } else {
      store.removeAds();
    }
  }

  async purchase(sku: string): Promise<PurchaseResult> {
    if (this.isMockMode) {
      await new Promise<void>((r) => setTimeout(r, 900));
      if (sku === IAP_SKUS.REMOVE_ADS || sku === IAP_SKUS.ADFREE_LIFETIME || sku === IAP_SKUS.ADFREE_7DAY) {
        this.grantAdFreePass(sku);
      }
      return { success: true, transactionId: this.generateMockTxId(sku) };
    }
    if (!this.connected) await this.init();
    if (!this.connected) return { success: false, transactionId: null };

    return new Promise<PurchaseResult>((resolve) => {
      this.pending.set(sku, resolve);
      _iap!.requestPurchase({ sku } as never).catch((err: unknown) => {
        if (__DEV__) console.warn('[IAPService] requestPurchase error:', err);
        this.pending.delete(sku);
        resolve({ success: false, transactionId: null });
      });
      setTimeout(() => {
        if (this.pending.has(sku)) { this.pending.delete(sku); resolve({ success: false, transactionId: null }); }
      }, 90_000);
    });
  }

  async restoreAdsRemoved(): Promise<boolean> {
    if (this.isMockMode) return false;
    try {
      const purchases = await _iap!.getAvailablePurchases();
      const adFreeSkus = [IAP_SKUS.REMOVE_ADS, IAP_SKUS.ADFREE_LIFETIME];
      const found = (purchases ?? []).some((p: never) => {
        const id = (p as { productId?: string; sku?: string }).productId ?? (p as { sku?: string }).sku ?? '';
        return adFreeSkus.includes(id as never);
      });
      if (found) this.grantAdFreePass(IAP_SKUS.ADFREE_LIFETIME);
      return found;
    } catch { return false; }
  }

  private setupListener(): void {
    if (!_iap) return;
    this.purchaseListener?.remove();
    this.purchaseListener = _iap.purchaseUpdatedListener(async (purchase: never) => {
      const sku: string = (purchase as { productId?: string; sku?: string }).productId ?? (purchase as { sku?: string }).sku ?? '';
      const txId: string = (purchase as { transactionId?: string }).transactionId ?? this.generateMockTxId(sku);
      const isConsumable = sku !== IAP_SKUS.REMOVE_ADS && sku !== IAP_SKUS.ADFREE_LIFETIME;
      try {
        await _iap!.finishTransaction({ purchase, isConsumable } as never);
      } catch { /* */ }
      const resolver = this.pending.get(sku);
      if (resolver) { this.pending.delete(sku); resolver({ success: true, transactionId: txId }); }
    });
  }

  private mockProducts(skus: string[]): IAPProduct[] {
    const MAP: Record<string, IAPProduct> = {
      [IAP_SKUS.COINS_100]:  { sku: IAP_SKUS.COINS_100,  title: '100 Coins',              description: 'Small pack',              price: '$0.99',  currency: 'USD' },
      [IAP_SKUS.COINS_500]:  { sku: IAP_SKUS.COINS_500,  title: '500 Coins',              description: 'Popular pack',            price: '$4.99',  currency: 'USD' },
      [IAP_SKUS.COINS_1200]: { sku: IAP_SKUS.COINS_1200, title: '1 200 Coins',            description: 'Great value',             price: '$9.99',  currency: 'USD' },
      [IAP_SKUS.COINS_2500]: { sku: IAP_SKUS.COINS_2500, title: '2 500 Coins',            description: 'Pro pack',                price: '$19.99', currency: 'USD' },
      [IAP_SKUS.COINS_5000]: { sku: IAP_SKUS.COINS_5000, title: '5 000 Coins',            description: 'Best value',              price: '$39.99', currency: 'USD' },
      [IAP_SKUS.GEMS_100]:   { sku: IAP_SKUS.GEMS_100,   title: '100 Gems',               description: 'Starter gem pack',        price: '$1.99',  currency: 'USD' },
      [IAP_SKUS.GEMS_500]:   { sku: IAP_SKUS.GEMS_500,   title: '500 Gems',               description: 'Popular gem pack',        price: '$4.99',  currency: 'USD' },
      [IAP_SKUS.GEMS_1200]:  { sku: IAP_SKUS.GEMS_1200,  title: '1 200 Gems',             description: 'Best gem value',          price: '$9.99',  currency: 'USD' },
      [IAP_SKUS.REMOVE_ADS]:      { sku: IAP_SKUS.REMOVE_ADS,      title: 'Remove Ads',           description: 'Ad-free forever',        price: '$4.99',  currency: 'USD' },
      [IAP_SKUS.ADFREE_7DAY]:     { sku: IAP_SKUS.ADFREE_7DAY,     title: 'Ad-Free 7 Days',       description: 'No ads for a week',       price: '$0.99',  currency: 'USD' },
      [IAP_SKUS.ADFREE_LIFETIME]: { sku: IAP_SKUS.ADFREE_LIFETIME, title: 'Ad-Free Lifetime',     description: 'Never see an ad again',   price: '$4.99',  currency: 'USD' },
      [IAP_SKUS.STARTER_PACK]:    { sku: IAP_SKUS.STARTER_PACK,    title: 'Starter Pack',         description: '500 Coins + 100 Gems',    price: '$2.00',  currency: 'USD' },
      [IAP_SKUS.SEASON_PASS]:     { sku: IAP_SKUS.SEASON_PASS,     title: 'Season Pass',          description: 'Exclusive season rewards',price: '$5.00',  currency: 'USD' },
    };
    return skus.map((s) => MAP[s]).filter(Boolean) as IAPProduct[];
  }
}

export const iapService = IAPService.getInstance();
export default IAPService;
