export interface Product {
  id: string;
  title: string;
  slug: string;
  category: string;
  shortDescription: string;
  fullDescription: string;
  keyFeatures: string[];
  pricePKR: number;
  originalPricePKR: number;
  priceUSD: number;
  originalPriceUSD: number;
  isSoldOut: boolean;
  badge: 'HOT' | 'BEST SELLER' | 'SALE' | 'INSTANT' | 'TRENDING' | 'POPULAR' | '';
  buttonText?: string;
  deliveryType: string;
  deliveryNotes: string;
  images: string[];
  rating: number;
  reviewsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  title: string;
  pricePKR: number;
  priceUSD: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerWhatsApp: string;
  channelOrDeliveryNote: string;
  items: OrderItem[];
  totalPKR: number;
  totalUSD: number;
  currency: 'PKR' | 'USD';
  paymentMethod: 'easypaisa' | 'jazzcash' | 'bank' | 'binance' | 'whatsapp';
  transactionId: string;
  paymentProofUrl?: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  adminNotes?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  customerName: string;
  productTitle: string;
  rating: number; // 1 to 5
  comment: string;
  isVerifiedPurchase: boolean;
  date: string;
  createdAt: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  announcementText: string;
  announcementEnabled: boolean;
  whatsappNumber: string;
  supportEmail: string;
  adminPin: string;
  currencyRateUSDToPKR: number;
  paymentAccounts: {
    easypaisa: {
      title: string;
      number: string;
      instructions: string;
    };
    jazzcash: {
      title: string;
      number: string;
      instructions: string;
    };
    bank: {
      bankName: string;
      accountTitle: string;
      accountNumber: string;
      iban: string;
      raastId: string;
    };
    binance: {
      payId: string;
      usdtTrc20: string;
    };
  };
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  description?: string;
}
