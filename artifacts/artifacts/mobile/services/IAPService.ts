/**
 * IAPService — WEB / FALLBACK build (no native requires).
 *
 * Metro resolves `IAPService.native.ts` on iOS/Android and this file on web.
 * All purchases are mock-granted immediately so the UI works in any environment.
 *
 * IAP_SKUS is exported from here so screen files have a single safe import path.
 */

// ─── Product IDs ──────────────────────────────────────────────────────────
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

const MOCK_PRODUCTS: Record<string, IAPProduct> = {
  [IAP_SKUS.COINS_100]:  { sku: IAP_SKUS.COINS_100,  title: '100 Coins',   description: 'A small coin pack',          price: '$0.99',  currency: 'USD' },
  [IAP_SKUS.COINS_500]:  { sku: IAP_SKUS.COINS_500,  title: '500 Coins',   description: 'The popular pack',           price: '$4.99',  currency: 'USD' },
  [IAP_SKUS.COINS_1200]: { sku: IAP_SKUS.COINS_1200, title: '1 200 Coins', description: 'Great value',                price: '$9.99',  currency: 'USD' },
  [IAP_SKUS.COINS_2500]: { sku: IAP_SKUS.COINS_2500, title: '2 500 Coins', description: 'Power player pack',          price: '$19.99', currency: 'USD' },
  [IAP_SKUS.COINS_5000]: { sku: IAP_SKUS.COINS_5000, title: '5 000 Coins', description: 'Best value',                 price: '$39.99', currency: 'USD' },
  [IAP_SKUS.REMOVE_ADS]: { sku: IAP_SKUS.REMOVE_ADS, title: 'Remove Ads',  description: 'Play without interruptions', price: '$2.99',  currency: 'USD' },
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

  async purchase(_sku: string): Promise<boolean> {
    await new Promise<void>((r) => setTimeout(r, 900));
    return true;
  }

  async restoreAdsRemoved(): Promise<boolean> {
    return false;
  }
}

export const iapService = IAPService.getInstance();
export default IAPService;
