import fs from 'fs';
import path from 'path';
import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import { Product, Order, Review, StoreSettings } from './types';
import bundledStoreData from '../../data/store.json';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'YT Tools Store',
  tagline: 'Digital Tools, Subscriptions & Creator Assets',
  announcementText: '⚡ Welcome to YT Tools Store - Contact us on WhatsApp for orders & inquiries.',
  announcementEnabled: true,
  whatsappNumber: '+92 3343345095',
  supportEmail: 'support@yttoolsstore.pk',
  adminPin: '12388127',
  currencyRateUSDToPKR: 280,
  paymentAccounts: {
    easypaisa: {
      title: 'Your Account Title',
      number: '0300 0000000',
      instructions: 'Send payment via EasyPaisa and enter Transaction ID (TID) below.',
    },
    jazzcash: {
      title: 'Your Account Title',
      number: '0300 0000000',
      instructions: 'Send payment via JazzCash mobile account and enter TID.',
    },
    bank: {
      bankName: 'Meezan Bank / Any Bank',
      accountTitle: 'Your Account Title',
      accountNumber: '000000000000',
      iban: 'PK00XXXX0000000000000000',
      raastId: '03000000000',
    },
    binance: {
      payId: '',
      usdtTrc20: '',
    },
  },
};

interface DatabaseSchema {
  products: Product[];
  orders: Order[];
  reviews: Review[];
  settings: StoreSettings;
}

// Check if running with Cloud Database (e.g. on Vercel)
const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;
let sql: NeonQueryFunction<false, false> | null = null;
let cloudTableInitialized = false;

if (DATABASE_URL) {
  try {
    sql = neon(DATABASE_URL);
  } catch {
    sql = null;
  }
}

async function ensureCloudTable() {
  if (!sql || cloudTableInitialized) return;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS yt_store_state (
        id VARCHAR(50) PRIMARY KEY,
        data JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    cloudTableInitialized = true;
  } catch (err) {
    console.error('Error creating cloud table:', err);
  }
}

async function getCloudData(): Promise<DatabaseSchema | null> {
  if (!sql) return null;
  try {
    await ensureCloudTable();
    const rows = await sql`SELECT data FROM yt_store_state WHERE id = 'main' LIMIT 1`;
    if (rows && rows.length > 0) {
      const parsed = rows[0].data as DatabaseSchema;
      let cloudProducts = parsed.products || [];
      let needsAutoSeed = false;

      // If cloud DB was initialized with 0 products, auto-seed from bundled store.json
      if (
        cloudProducts.length === 0 &&
        Array.isArray(bundledStoreData.products) &&
        bundledStoreData.products.length > 0
      ) {
        console.log(`[AutoSeed] Seeding ${bundledStoreData.products.length} products to cloud database...`);
        cloudProducts = bundledStoreData.products as Product[];
        needsAutoSeed = true;
      }

      const mergedSettings = {
        ...DEFAULT_SETTINGS,
        ...(bundledStoreData.settings || {}),
        ...(parsed.settings || {}),
      };

      // Ensure admin PIN is updated to 12388127 if currently empty or old admin123
      if (!mergedSettings.adminPin || mergedSettings.adminPin === 'admin123') {
        mergedSettings.adminPin = '12388127';
        needsAutoSeed = true;
      }

      // Ensure WhatsApp number is updated to +92 3343345095 if empty or old
      if (!mergedSettings.whatsappNumber || mergedSettings.whatsappNumber.includes('3702260919') || mergedSettings.whatsappNumber.includes('370 226')) {
        mergedSettings.whatsappNumber = '+92 3343345095';
        needsAutoSeed = true;
      }

      const finalData: DatabaseSchema = {
        products: cloudProducts,
        orders: parsed.orders || [],
        reviews: parsed.reviews || [],
        settings: mergedSettings,
      };

      if (needsAutoSeed) {
        await sql`
          INSERT INTO yt_store_state (id, data, updated_at)
          VALUES ('main', ${JSON.stringify(finalData)}::jsonb, CURRENT_TIMESTAMP)
          ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = CURRENT_TIMESTAMP
        `;
      }

      return finalData;
    } else {
      const initial: DatabaseSchema = {
        products: (bundledStoreData.products || []) as Product[],
        orders: [],
        reviews: [],
        settings: {
          ...DEFAULT_SETTINGS,
          ...(bundledStoreData.settings || {}),
        },
      };
      await sql`
        INSERT INTO yt_store_state (id, data, updated_at)
        VALUES ('main', ${JSON.stringify(initial)}::jsonb, CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = CURRENT_TIMESTAMP
      `;
      return initial;
    }
  } catch (err) {
    console.error('Error reading from cloud database:', err);
    return null;
  }
}

async function saveCloudData(data: DatabaseSchema): Promise<boolean> {
  if (!sql) return false;
  try {
    await ensureCloudTable();
    await sql`
      INSERT INTO yt_store_state (id, data, updated_at)
      VALUES ('main', ${JSON.stringify(data)}::jsonb, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = CURRENT_TIMESTAMP
    `;
    return true;
  } catch (err) {
    console.error('Error saving to cloud database:', err);
    return false;
  }
}

// Local File Helper (for development on your computer)
function getLocalData(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    const initial: DatabaseSchema = {
      products: (bundledStoreData.products || []) as Product[],
      orders: [],
      reviews: [],
      settings: {
        ...DEFAULT_SETTINGS,
        ...(bundledStoreData.settings || {}),
      },
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }

  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      products: parsed.products || (bundledStoreData.products as Product[]) || [],
      orders: parsed.orders || [],
      reviews: parsed.reviews || [],
      settings: parsed.settings ? { ...DEFAULT_SETTINGS, ...parsed.settings } : DEFAULT_SETTINGS,
    };
  } catch {
    const fallback: DatabaseSchema = {
      products: (bundledStoreData.products || []) as Product[],
      orders: [],
      reviews: [],
      settings: {
        ...DEFAULT_SETTINGS,
        ...(bundledStoreData.settings || {}),
      },
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(fallback, null, 2), 'utf-8');
    return fallback;
  }
}

function saveLocalData(data: DatabaseSchema): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

async function getData(): Promise<DatabaseSchema> {
  if (sql) {
    const cloud = await getCloudData();
    if (cloud) return cloud;
  }
  return getLocalData();
}

async function saveData(data: DatabaseSchema): Promise<void> {
  if (sql) {
    const ok = await saveCloudData(data);
    if (ok) return;
  }
  saveLocalData(data);
}

export const db = {
  // Products
  async getProducts(): Promise<Product[]> {
    const data = await getData();
    return data.products;
  },

  async getProductById(id: string): Promise<Product | undefined> {
    const data = await getData();
    return data.products.find((p) => p.id === id || p.slug === id);
  },

  async createProduct(
    productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Product> {
    const data = await getData();
    const id = `prod-${Date.now()}`;
    const newProduct: Product = {
      ...productData,
      id,
      slug:
        productData.slug ||
        productData.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, ''),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    data.products.unshift(newProduct);
    await saveData(data);
    return newProduct;
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    const data = await getData();
    const index = data.products.findIndex((p) => p.id === id);
    if (index === -1) return null;

    data.products[index] = {
      ...data.products[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await saveData(data);
    return data.products[index];
  },

  async deleteProduct(id: string): Promise<boolean> {
    const data = await getData();
    const prevLen = data.products.length;
    data.products = data.products.filter((p) => p.id !== id);
    if (data.products.length !== prevLen) {
      await saveData(data);
      return true;
    }
    return false;
  },

  async toggleSoldOut(id: string): Promise<Product | null> {
    const data = await getData();
    const index = data.products.findIndex((p) => p.id === id);
    if (index === -1) return null;

    data.products[index].isSoldOut = !data.products[index].isSoldOut;
    data.products[index].updatedAt = new Date().toISOString();
    await saveData(data);
    return data.products[index];
  },

  // Orders
  async getOrders(): Promise<Order[]> {
    const data = await getData();
    return data.orders.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async getOrderById(id: string): Promise<Order | undefined> {
    const data = await getData();
    return data.orders.find((o) => o.id === id || o.customerWhatsApp === id);
  },

  async createOrder(orderData: Omit<Order, 'id' | 'createdAt'>): Promise<Order> {
    const data = await getData();
    const randomSuffix = Math.floor(10000 + Math.random() * 90000);
    const id = `YT-${randomSuffix}`;
    const newOrder: Order = {
      ...orderData,
      id,
      createdAt: new Date().toISOString(),
    };
    data.orders.unshift(newOrder);
    await saveData(data);
    return newOrder;
  },

  async updateOrderStatus(
    id: string,
    status: Order['status'],
    adminNotes?: string
  ): Promise<Order | null> {
    const data = await getData();
    const index = data.orders.findIndex((o) => o.id === id);
    if (index === -1) return null;

    data.orders[index].status = status;
    if (adminNotes !== undefined) {
      data.orders[index].adminNotes = adminNotes;
    }
    await saveData(data);
    return data.orders[index];
  },

  // Reviews
  async getReviews(): Promise<Review[]> {
    const data = await getData();
    return (data.reviews || []).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async createReview(reviewData: Omit<Review, 'id' | 'createdAt'>): Promise<Review> {
    const data = await getData();
    if (!data.reviews) data.reviews = [];
    const id = `rev-${Date.now()}`;
    const newReview: Review = {
      ...reviewData,
      id,
      createdAt: new Date().toISOString(),
    };
    data.reviews.unshift(newReview);
    await saveData(data);
    return newReview;
  },

  async updateReview(id: string, updates: Partial<Review>): Promise<Review | null> {
    const data = await getData();
    if (!data.reviews) data.reviews = [];
    const index = data.reviews.findIndex((r) => r.id === id);
    if (index === -1) return null;

    data.reviews[index] = {
      ...data.reviews[index],
      ...updates,
    };
    await saveData(data);
    return data.reviews[index];
  },

  async deleteReview(id: string): Promise<boolean> {
    const data = await getData();
    if (!data.reviews) return false;
    const prevLen = data.reviews.length;
    data.reviews = data.reviews.filter((r) => r.id !== id);
    if (data.reviews.length !== prevLen) {
      await saveData(data);
      return true;
    }
    return false;
  },

  // Settings
  async getSettings(): Promise<StoreSettings> {
    const data = await getData();
    return data.settings;
  },

  async updateSettings(updates: Partial<StoreSettings>): Promise<StoreSettings> {
    const data = await getData();
    data.settings = {
      ...data.settings,
      ...updates,
      paymentAccounts: {
        ...data.settings.paymentAccounts,
        ...(updates.paymentAccounts || {}),
      },
    };
    await saveData(data);
    return data.settings;
  },

  // Seed / Sync Data from bundled store.json
  async seedInitialData(force: boolean = false): Promise<DatabaseSchema> {
    const current = await getData();
    const bundledProducts = (bundledStoreData.products || []) as Product[];

    if (!force && current.products && current.products.length > 0) {
      return current;
    }

    const mergedProducts = [...current.products];
    for (const bp of bundledProducts) {
      const idx = mergedProducts.findIndex((p) => p.id === bp.id);
      if (idx !== -1) {
        if (force) {
          mergedProducts[idx] = bp;
        }
      } else {
        mergedProducts.push(bp);
      }
    }

    const finalData: DatabaseSchema = {
      ...current,
      products: mergedProducts.length > 0 ? mergedProducts : bundledProducts,
      settings: {
        ...DEFAULT_SETTINGS,
        ...(bundledStoreData.settings || {}),
        ...(current.settings || {}),
        adminPin:
          current.settings?.adminPin && current.settings.adminPin !== 'admin123'
            ? current.settings.adminPin
            : '12388127',
      },
    };

    await saveData(finalData);
    return finalData;
  },
};
