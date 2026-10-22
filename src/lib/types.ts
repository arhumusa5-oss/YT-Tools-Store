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
  allowQuantity?: boolean;
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
  isDirectInvoice?: boolean;
  paymentStatus?: 'unpaid' | 'paid';
  createdAt: string;

  // Order Financial Accounting Fields
  costPKR?: number; // Cost of goods / supplier cost
  profitPKR?: number; // Net profit (totalPKR - costPKR)
  vendorName?: string; // Supplier / Vendor name
  vendorPaymentStatus?: 'paid' | 'unpaid'; // Whether admin paid the vendor
  vendorNotes?: string;

  // Subscription Expiry & Renewal Tracking Fields
  subscriptionDurationDays?: number; // e.g. 30, 90, 365
  subscriptionExpiryDate?: string; // YYYY-MM-DD
  renewalStatus?: 'active' | 'expiring_soon' | 'expired' | 'renewed';
  renewalNotes?: string;
  lastRenewalEmailSentAt?: string; // ISO date string when renewal reminder email was sent
}

export interface Review {
  id: string;
  customerName: string;
  productTitle: string;
  rating: number; // 1 to 5
  comment: string;
  imageUrl?: string;
  isVerifiedPurchase: boolean;
  date: string;
  createdAt: string;
  status?: 'pending' | 'approved' | 'rejected';
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
  nextOrderNumber?: number;
  showReviewsSection?: boolean;
  paymentAccounts: {
    easypaisa: {
      enabled?: boolean;
      title: string;
      number: string;
      instructions: string;
    };
    jazzcash: {
      enabled?: boolean;
      title: string;
      number: string;
      instructions: string;
    };
    bank: {
      enabled?: boolean;
      bankName: string;
      accountTitle: string;
      accountNumber: string;
      iban: string;
      raastId: string;
      instructions?: string;
    };
    binance: {
      enabled?: boolean;
      payId: string;
      usdtTrc20: string;
      instructions?: string;
    };
  };
  emailAlerts?: {
    enabled?: boolean;
    recipientEmail?: string;
    notifyOnOrder?: boolean;
    notifyOnAddToCart?: boolean;
    service?: 'gmail' | 'resend' | string;
    gmailUser?: string;
    gmailAppPassword?: string;
    resendApiKey?: string;
  };
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  description?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  whatsappNumber: string;
  passwordHash: string;
  cart?: OrderItem[];
  resetToken?: string;
  resetTokenExpiry?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  whatsappNumber: string;
  cart?: OrderItem[];
  token?: string;
}
