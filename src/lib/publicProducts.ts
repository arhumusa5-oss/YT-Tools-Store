import { db } from './db';
import { Product } from './types';

export function sanitizePublicProduct(p: Product): Product {
  const { costPKR: _cost, vendorName: _vendor, ...publicFields } = p;
  void _cost;
  void _vendor;
  if (publicFields.variants && Array.isArray(publicFields.variants)) {
    publicFields.variants = publicFields.variants.map(({ costPKR: _vCost, ...vRest }) => {
      void _vCost;
      return vRest;
    });
  }
  return publicFields;
}

export async function getPublicProducts(): Promise<Product[]> {
  try {
    const products = await db.getProducts();
    return products
      .map(sanitizePublicProduct)
      .sort((a, b) =>
        (a.title || '').localeCompare(b.title || '', undefined, { sensitivity: 'base' })
      );
  } catch {
    return [];
  }
}
