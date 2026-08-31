/**
 * IAPService — WEB / FALLBACK build (no native requires).
 *
 * Metro resolves `IAPService.native.ts` on iOS/Android and this file on web.
 * All purchases are mock-granted immediately so the UI works in any environment.
 *
 * IAP_SKUS is exported from here so screen files have a single safe import path.
 *
 * Phase 2: Gem packs, dual ad-free pass (7-day / lifetime), starter pack.
 */

// ─── Product IDs ──────────────────────────────────────────────────────────────
export const IAP_SKUS = {
  // Coin packs (legacy — retained for coin-shop IAP section)
  COINS_100:  'com.aiblur.quiz.coins_100',
  COINS_500:  'com.aiblur.quiz.coins_500',
  COINS_1200: 'com.aiblur.quiz.coins_1200',
  COINS_2500: 'com.aiblur.quiz.coins_2500',
  COINS_5000: 'com.aiblur.quiz.coins_5000',

  // Gem packs — spec v1.0.0: 100 / 500 / 1200 gems
  GEMS_100:   'com.aiblur.quiz.gems_100',
  GEMS_500:   'com.aiblur.quiz.gems_500',
  GEMS_1200:  'com.aiblur.quiz.gems_1200',

  // Ad-Free Passes
  REMOVE_ADS:          'com.aiblur.quiz.remove_ads',          // legacy lifetime alias
  ADFREE_7DAY:         'com.aiblur.quiz.adfree_7day',
  ADFREE_LIFETIME:     'com.aiblur.quiz.adfree_lifetime',

  // Bundles
  STARTER_PACK:        'com.aiblur.quiz.starter_pack',
  SEASON_PASS:         'com.aiblur.quiz.season_pass',         // future
} as const;

export type IAPSku = typeof IAP_SKUS[keyof typeof IAP_SKUS];

/** Coin amount granted per coin-pack SKU (used by shop for mock grants). */
export const SKU_COINS: Partial<Record<IAPSku, number>> = {
  [IAP_SKUS.COINS_100]:  100,
  [IAP_SKUS.COINS_500]:  500,
  [IAP_SKUS.COINS_1200]: 1200,
  [IAP_SKUS.COINS_2500]: 2500,
  [IAP_SKUS.COINS_5000]: 5000,
};

/** Gem amount granted per gem-pack SKU. */
export const SKU_GEMS: Partial<Record<IAPSku, number>> = {
  [IAP_SKUS.GEMS_100]:   100,
  [IAP_SKUS.GEMS_500]:   500,
  [IAP_SKUS.GEMS_1200]: 1200,
};

export interface IAPProduct {
  sku: string;
  title: string;
  description: string;
  price: string;
  currency: string;
}

const MOCK_PRODUCTS: Record<string, IAPProduct> = {
  // Coin packs
  [IAP_SKUS.COINS_100]:  { sku: IAP_SKUS.COINS_100,  title: '100 Coins',        description: 'A small coin pack',                    price: '$0.99',  currency: 'USD' },
  [IAP_SKUS.COINS_500]:  { sku: IAP_SKUS.COINS_500,  title: '500 Coins',        description: 'The popular pack',                     price: '$4.99',  currency: 'USD' },
  [IAP_SKUS.COINS_1200]: { sku: IAP_SKUS.COINS_1200, title: '1 200 Coins',      description: 'Great value',                          price: '$9.99',  currency: 'USD' },
  [IAP_SKUS.COINS_2500]: { sku: IAP_SKUS.COINS_2500, title: '2 500 Coins',      description: 'Power player pack',                    price: '$19.99', currency: 'USD' },
  [IAP_SKUS.COINS_5000]: { sku: IAP_SKUS.COINS_5000, title: '5 000 Coins',      description: 'Best value',                           price: '$39.99', currency: 'USD' },
  // Gem packs — spec v1.0.0
  [IAP_SKUS.GEMS_100]:   { sku: IAP_SKUS.GEMS_100,   title: '100 Gems',         description: 'Starter gem pack',                     price: '$1.99',  currency: 'USD' },
  [IAP_SKUS.GEMS_500]:   { sku: IAP_SKUS.GEMS_500,   title: '500 Gems',         description: 'Popular gem pack',                     price: '$4.99',  currency: 'USD' },
  [IAP_SKUS.GEMS_1200]:  { sku: IAP_SKUS.GEMS_1200,  title: '1 200 Gems',       description: 'Best gem value',                       price: '$9.99',  currency: 'USD' },
  // Ad-Free
  [IAP_SKUS.REMOVE_ADS]:      { sku: IAP_SKUS.REMOVE_ADS,      title: 'Remove Ads (Lifetime)', description: 'Play without interruptions forever', price: '$4.99', currency: 'USD' },
  [IAP_SKUS.ADFREE_7DAY]:     { sku: IAP_SKUS.ADFREE_7DAY,     title: 'Ad-Free 7 Days',        description: 'No ads for a full week',             price: '$0.99', currency: 'USD' },
  [IAP_SKUS.ADFREE_LIFETIME]: { sku: IAP_SKUS.ADFREE_LIFETIME, title: 'Ad-Free Lifetime',      description: 'Never see an ad again',              price: '$4.99', currency: 'USD' },
  // Bundles
  [IAP_SKUS.STARTER_PACK]:    { sku: IAP_SKUS.STARTER_PACK, title: 'Starter Pack',   description: '5 Combo Shields + 3 Clarity Bombs + Silver Frame', price: '$2.00', currency: 'USD' },
  [IAP_SKUS.SEASON_PASS]:     { sku: IAP_SKUS.SEASON_PASS,  title: 'Season Pass',    description: 'Exclusive season rewards — coming soon', price: '$5.00', currency: 'USD' },
};

class IAPService {
  private static _instance: IAPService;
  static getInstance(): IAPService {
    if (!IAPService._instance) IAPService._instance = new IAPService();
    return IAPService._instance;
  }

  get isMockMode(): boolean { return true; }

  async init(): Promise<void> {}
  async dispose(): Promise<void> {}

  async getProducts(skus: string[] = Object.values(IAP_SKUS)): Promise<IAPProduct[]> {
    return skus.map((s) => MOCK_PRODUCTS[s]).filter(Boolean) as IAPProduct[];
  }

  /** Returns a mock transaction ID for purchase history recording. */
  generateMockTxId(sku: string): string {
    return `MOCK_${sku}_${Date.now()}`;
  }

  async purchase(sku: string): Promise<{ success: boolean; transactionId: string | null }> {
    const { isGoogleUser } = await import('./authService');
    if (!isGoogleUser()) {
      return { success: false, transactionId: null };
    }
    await new Promise<void>((r) => setTimeout(r, 900));
    if (sku === IAP_SKUS.REMOVE_ADS || sku === IAP_SKUS.ADFREE_LIFETIME) {
      const { useAdStore } = require('@/store/adStore');
      useAdStore.getState().removeAds();
    }
    return { success: true, transactionId: this.generateMockTxId(sku) };
  }

  async restoreAdsRemoved(): Promise<boolean> {
    const { isGoogleUser } = await import('./authService');
    if (!isGoogleUser()) return false;
    return false;
  }
}

export const iapService = IAPService.getInstance();
export default IAPService;
