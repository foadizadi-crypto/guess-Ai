/**
 * IAPService — NATIVE build (iOS / Android).
 *
 * Metro resolves this file instead of `IAPService.ts` on native platforms.
 * Uses react-native-iap v15 (Nitro bridge).  Falls back to mock behaviour in
 * Expo Go where the native module is not linked.
 *
 * NOTE: IAP_SKUS is defined inline here (not re-exported from IAPService.ts)
 * to avoid a circular resolution: on native, Metro would resolve ./IAPService
 * back to this file.
 */

import { NativeModules } from 'react-native';

// ─── Product IDs (duplicated from IAPService.ts to avoid circular import) ─
export const IAP_SKUS = {
  COINS_100:  'com.aiblur.quiz.coins_100',
  COINS_500:  'com.aiblur.quiz.coins_500',
  COINS_1200: 'com.aiblur.quiz.coins_1200',
  COINS_2500: 'com.aiblur.quiz.coins_2500',
  COINS_5000: 'com.aiblur.quiz.coins_5000',
  REMOVE_ADS: 'com.aiblur.quiz.remove_ads',
} as const;

export type IAPSku = typeof IAP_SKUS[keyof typeof IAP_SKUS];

export const SKU_COINS: Partial<Record<IAPSku, number>> = {
  [IAP_SKUS.COINS_100]:  100,
  [IAP_SKUS.COINS_500]:  500,
  [IAP_SKUS.COINS_1200]: 1200,
  [IAP_SKUS.COINS_2500]: 2500,
  [IAP_SKUS.COINS_5000]: 5000,
};

export interface IAPProduct {
  sku: string;
  title: string;
  description: string;
  price: string;
  currency: string;
}

// ─── Native availability ──────────────────────────────────────────────────
const IAP_LINKED = !!(NativeModules.RnIap || NativeModules['react-native-iap']);

let _iap: typeof import('react-native-iap') | null = null;
if (IAP_LINKED) {
  try { _iap = require('react-native-iap'); } catch { _iap = null; }
}

// ─── Service ──────────────────────────────────────────────────────────────

class IAPService {
  private static _instance: IAPService;
  static getInstance(): IAPService {
    if (!IAPService._instance) IAPService._instance = new IAPService();
    return IAPService._instance;
  }

  private connected = false;
  private purchaseListener: { remove(): void } | null = null;
  private pending = new Map<string, (ok: boolean) => void>();

  get isMockMode(): boolean { return !IAP_LINKED || !_iap; }

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
      const raw = await _iap!.fetchProducts({ skus, type: 'in-app' } as any);
      if (!raw) return [];
      return (raw as any[]).map((p: any) => ({
        sku: p.productId ?? p.sku ?? '',
        title: p.title ?? '',
        description: p.description ?? '',
        price: p.localizedPrice ?? p.price ?? '',
        currency: p.currency ?? '',
      }));
    } catch {
      return this.mockProducts(skus);
    }
  }

  private grantAdFreePass(): void {
    const { useAdStore } = require('@/store/adStore');
    useAdStore.getState().removeAds();
  }

  async purchase(sku: string): Promise<boolean> {
    if (this.isMockMode) {
      await new Promise<void>((r) => setTimeout(r, 900));
      if (sku === IAP_SKUS.REMOVE_ADS) this.grantAdFreePass();
      return true;
    }
    if (!this.connected) await this.init();
    if (!this.connected) return false;

    return new Promise<boolean>((resolve) => {
      this.pending.set(sku, resolve);
      _iap!.requestPurchase({ sku } as any).catch((err: unknown) => {
        if (__DEV__) console.warn('[IAPService] requestPurchase error:', err);
        this.pending.delete(sku);
        resolve(false);
      });
      setTimeout(() => {
        if (this.pending.has(sku)) { this.pending.delete(sku); resolve(false); }
      }, 90_000);
    });
  }

  async restoreAdsRemoved(): Promise<boolean> {
    if (this.isMockMode) return false;
    try {
      const purchases = await _iap!.getAvailablePurchases();
      const found = (purchases ?? []).some((p: any) => (p.productId ?? p.sku) === IAP_SKUS.REMOVE_ADS);
      if (found) this.grantAdFreePass();
      return found;
    } catch { return false; }
  }

  private setupListener(): void {
    if (!_iap) return;
    this.purchaseListener?.remove();
    this.purchaseListener = _iap.purchaseUpdatedListener(async (purchase: any) => {
      const sku: string = purchase.productId ?? purchase.sku ?? '';
      try {
        await _iap!.finishTransaction({ purchase, isConsumable: sku !== IAP_SKUS.REMOVE_ADS } as any);
      } catch { /* */ }
      const resolver = this.pending.get(sku);
      if (resolver) { this.pending.delete(sku); resolver(true); }
    });
  }

  private mockProducts(skus: string[]): IAPProduct[] {
    const MAP: Record<string, IAPProduct> = {
      [IAP_SKUS.COINS_100]:  { sku: IAP_SKUS.COINS_100,  title: '100 Coins',   description: 'Small pack',   price: '$0.99',  currency: 'USD' },
      [IAP_SKUS.COINS_500]:  { sku: IAP_SKUS.COINS_500,  title: '500 Coins',   description: 'Popular pack', price: '$4.99',  currency: 'USD' },
      [IAP_SKUS.COINS_1200]: { sku: IAP_SKUS.COINS_1200, title: '1 200 Coins', description: 'Great value',  price: '$9.99',  currency: 'USD' },
      [IAP_SKUS.COINS_2500]: { sku: IAP_SKUS.COINS_2500, title: '2 500 Coins', description: 'Pro pack',     price: '$19.99', currency: 'USD' },
      [IAP_SKUS.COINS_5000]: { sku: IAP_SKUS.COINS_5000, title: '5 000 Coins', description: 'Best value',   price: '$39.99', currency: 'USD' },
      [IAP_SKUS.REMOVE_ADS]: { sku: IAP_SKUS.REMOVE_ADS, title: 'Remove Ads',  description: 'Ad-free play', price: '$2.99',  currency: 'USD' },
    };
    return skus.map((s) => MAP[s]).filter(Boolean) as IAPProduct[];
  }
}

export const iapService = IAPService.getInstance();
export default IAPService;
