'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Product, ProductVariant, OrderItem, Order, StoreSettings } from '@/lib/types';
import { useAuth } from './AuthContext';

export interface CartNotification {
  id: string;
  title: string;
  image?: string;
  quantity: number;
}

interface CartContextType {
  cart: OrderItem[];
  cartCount: number;
  cartTotalPKR: number;
  cartTotalUSD: number;
  currency: 'PKR' | 'USD';
  setCurrency: (c: 'PKR' | 'USD') => void;
  addToCart: (product: Product, quantity?: number, selectedVariant?: ProductVariant) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  cartNotification: CartNotification | null;
  clearCartNotification: () => void;
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  checkoutItems: OrderItem[];
  openCheckoutWithItems: (items: OrderItem[]) => void;
  openCheckoutWithProduct: (product: Product, quantity?: number, selectedVariant?: ProductVariant) => void;
  activeProductModal: Product | null;
  activeModalVariantId: string | null;
  setActiveProductModal: (product: Product | null, initialVariantId?: string | null) => void;
  orderSuccess: Order | null;
  setOrderSuccess: (order: Order | null) => void;
  settings: StoreSettings | null;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  refreshSettings: () => Promise<void>;
  formatPrice: (pkr: number, usd: number) => string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'yt_cart';
const CART_UPDATED_AT_KEY = 'yt_cart_updated_at';
const CART_SERVER_SYNC_AT_KEY = 'yt_cart_synced_at';
const CART_SYNCED_SESSION_KEY = 'yt_cart_synced_email';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<OrderItem[]>([]);
  const cartRef = useRef<OrderItem[]>([]);
  const [currency, setCurrency] = useState<'PKR' | 'USD'>('PKR');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartNotification, setCartNotification] = useState<CartNotification | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<OrderItem[]>([]);
  const [activeProductModal, setActiveProductModal] = useState<Product | null>(null);
  const [activeModalVariantId, setActiveModalVariantId] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<Order | null>(null);

  const handleSetActiveProductModal = useCallback(
    (product: Product | null, initialVariantId?: string | null) => {
      setActiveProductModal(product);
      setActiveModalVariantId(initialVariantId || null);
    },
    []
  );
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  const getActiveEmail = useCallback((): string | null => {
    if (user?.email) return user.email;
    try {
      const saved = localStorage.getItem('yt_user_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.email) return String(parsed.email);
      }
    } catch {
      // ignore
    }
    return null;
  }, [user?.email]);

  const syncCartToServer = useCallback(
    (email: string, nextCart: OrderItem[]) => {
      fetch('/api/user/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({ email, cart: nextCart }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data?.success && data?.updatedAt) {
            try {
              localStorage.setItem(
                CART_SERVER_SYNC_AT_KEY,
                String(new Date(data.updatedAt).getTime())
              );
            } catch {
              // ignore
            }
          }
        })
        .catch(() => {});
    },
    []
  );

  // Immediately persist cart synchronously to localStorage AND sync with server using keepalive
  const commitCartChange = useCallback(
    (nextCart: OrderItem[]) => {
      cartRef.current = nextCart;
      setCart(nextCart);

      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(nextCart));
        localStorage.setItem(CART_UPDATED_AT_KEY, String(Date.now()));
      } catch {
        // ignore storage quota errors
      }

      const activeEmail = getActiveEmail();
      if (activeEmail) {
        syncCartToServer(activeEmail, nextCart);
      }
    },
    [getActiveEmail, syncCartToServer]
  );

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
      }
    } catch {
      // fallback
    }
  };

  // Load initial cart, currency, and theme from localStorage ONCE on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed)) {
          cartRef.current = parsed;
          setCart(parsed);
        }
      }

      const savedCurr = localStorage.getItem('yt_currency');
      if (savedCurr === 'PKR' || savedCurr === 'USD') setCurrency(savedCurr);

      const savedTheme = localStorage.getItem('yt_theme') as 'dark' | 'light' | null;
      if (savedTheme === 'dark') {
        setTheme('dark');
        document.documentElement.classList.add('dark');
      } else {
        setTheme('light');
        document.documentElement.classList.remove('dark');
      }
    } catch {
      // ignore
    }
    fetchSettings();
  }, []);

  // Safe Server Cart Sync: Never resurrects locally deleted items upon page refresh
  useEffect(() => {
    if (!user?.email) return;
    let active = true;

    async function syncUserCartFromServer() {
      const email = user!.email;
      try {
        let localCart: OrderItem[] = [];
        try {
          const saved = localStorage.getItem(CART_STORAGE_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) localCart = parsed;
          }
        } catch {
          localCart = cartRef.current;
        }

        const localUpdatedAt = Number(localStorage.getItem(CART_UPDATED_AT_KEY) || '0');
        const lastServerSyncAt = Number(localStorage.getItem(CART_SERVER_SYNC_AT_KEY) || '0');
        const alreadySyncedThisSession =
          sessionStorage.getItem(CART_SYNCED_SESSION_KEY) === email;

        const res = await fetch(
          `/api/user/cart?email=${encodeURIComponent(email)}&_t=${Date.now()}`,
          { cache: 'no-store' }
        );
        const data = await res.json();
        if (!active || !data.success || !Array.isArray(data.cart)) return;

        const serverCart = data.cart as OrderItem[];
        const serverUpdatedAt = data.updatedAt ? new Date(data.updatedAt).getTime() : 0;

        sessionStorage.setItem(CART_SYNCED_SESSION_KEY, email);

        if (alreadySyncedThisSession) {
          // Same active session refresh: localStorage holds latest user edits/deletions
          if (JSON.stringify(serverCart) !== JSON.stringify(localCart)) {
            syncCartToServer(email, localCart);
          }
          return;
        }

        // Fresh login or new tab/device
        if (localUpdatedAt === 0 && localCart.length === 0) {
          // Completely fresh device with empty local cart -> pull saved server cart
          if (serverCart.length > 0) {
            cartRef.current = serverCart;
            setCart(serverCart);
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(serverCart));
            if (serverUpdatedAt) {
              localStorage.setItem(CART_SERVER_SYNC_AT_KEY, String(serverUpdatedAt));
            }
          }
          return;
        }

        // If another device genuinely updated the server MORE recently than any local action here
        if (
          serverUpdatedAt > lastServerSyncAt + 1000 &&
          serverUpdatedAt > localUpdatedAt &&
          serverCart.length > 0
        ) {
          cartRef.current = serverCart;
          setCart(serverCart);
          localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(serverCart));
          localStorage.setItem(CART_SERVER_SYNC_AT_KEY, String(serverUpdatedAt));
          return;
        }

        // Otherwise local changes (including deletions or empty cart) take priority -> update server
        if (JSON.stringify(serverCart) !== JSON.stringify(localCart)) {
          syncCartToServer(email, localCart);
        }
      } catch {
        // ignore network issues cleanly
      }
    }

    syncUserCartFromServer();

    return () => {
      active = false;
    };
  }, [user?.email, syncCartToServer]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('yt_theme', nextTheme);
    } catch {
      // ignore
    }
  };

  const handleSetCurrency = (c: 'PKR' | 'USD') => {
    setCurrency(c);
    try {
      localStorage.setItem('yt_currency', c);
    } catch {
      // ignore
    }
  };

  const clearCartNotification = () => {
    setCartNotification(null);
  };

  const addToCart = (product: Product, quantity = 1, selectedVariant?: ProductVariant) => {
    if (product.isSoldOut) return;
    if (selectedVariant && selectedVariant.isSoldOut) return;

    const variantId = selectedVariant?.id;
    const variantName = selectedVariant?.name;
    const pricePKR = selectedVariant ? selectedVariant.pricePKR : product.pricePKR;
    const priceUSD = selectedVariant
      ? (selectedVariant.priceUSD ?? selectedVariant.pricePKR / 280)
      : product.priceUSD;
    const itemTitle = variantName ? `${product.title} (${variantName})` : product.title;
    const cartItemId = variantId ? `${product.id}__${variantId}` : product.id;

    const prev = cartRef.current;
    const existing = prev.find((item) => item.productId === cartItemId);
    const next = existing
      ? prev.map((item) =>
          item.productId === cartItemId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      : [
          ...prev,
          {
            productId: cartItemId,
            title: itemTitle,
            pricePKR,
            priceUSD,
            quantity,
            image: product.images[0] || '',
            variantId,
            variantName,
          },
        ];

    commitCartChange(next);

    setCartNotification({
      id: Date.now().toString(),
      title: itemTitle,
      image: product.images[0] || '',
      quantity,
    });

    // Silent background email alert trigger
    try {
      let currentUser: { name?: string; email?: string; whatsappNumber?: string } | null = null;
      try {
        const saved = localStorage.getItem('yt_user_session');
        if (saved) currentUser = JSON.parse(saved);
      } catch {
        // ignore
      }

      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'add_to_cart',
          items: [
            {
              title: itemTitle,
              quantity,
              pricePKR,
              priceUSD,
              image: product.images[0] || '',
              variantId,
              variantName,
            },
          ],
          totalPKR: pricePKR * quantity,
          customerName: currentUser?.name,
          customerWhatsApp: currentUser?.whatsappNumber,
          customerEmail: currentUser?.email,
          isRegisteredUser: Boolean(currentUser),
        }),
      }).catch(() => {});
    } catch {
      // ignore
    }
  };

  const removeFromCart = (productId: string) => {
    const next = cartRef.current.filter((item) => item.productId !== productId);
    commitCartChange(next);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const next = cartRef.current.map((item) =>
      item.productId === productId ? { ...item, quantity } : item
    );
    commitCartChange(next);
  };

  const clearCart = () => {
    commitCartChange([]);
  };

  const openCheckoutWithItems = (items: OrderItem[]) => {
    setCheckoutItems(items);
    setIsCheckoutOpen(true);
  };

  const openCheckoutWithProduct = (product: Product, quantity = 1, selectedVariant?: ProductVariant) => {
    if (product.isSoldOut) return;
    if (selectedVariant && selectedVariant.isSoldOut) return;
    const finalQty = typeof quantity === 'number' && quantity > 0 ? quantity : 1;
    const variantId = selectedVariant?.id;
    const variantName = selectedVariant?.name;
    const pricePKR = selectedVariant ? selectedVariant.pricePKR : product.pricePKR;
    const priceUSD = selectedVariant
      ? (selectedVariant.priceUSD ?? selectedVariant.pricePKR / 280)
      : product.priceUSD;
    const itemTitle = variantName ? `${product.title} (${variantName})` : product.title;
    const cartItemId = variantId ? `${product.id}__${variantId}` : product.id;

    const item: OrderItem = {
      productId: cartItemId,
      title: itemTitle,
      pricePKR,
      priceUSD,
      quantity: finalQty,
      image: product.images[0] || '',
      variantId,
      variantName,
    };
    setCheckoutItems([item]);
    setIsCheckoutOpen(true);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotalPKR = cart.reduce((sum, item) => sum + item.pricePKR * item.quantity, 0);
  const cartTotalUSD = cart.reduce((sum, item) => sum + item.priceUSD * item.quantity, 0);

  const formatPrice = (pkr: number, _usd?: number) => {
    void _usd;
    return `Rs ${pkr.toLocaleString()}`;
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        cartTotalPKR,
        cartTotalUSD,
        currency,
        setCurrency: handleSetCurrency,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        cartNotification,
        clearCartNotification,
        isCheckoutOpen,
        setIsCheckoutOpen,
        checkoutItems,
        openCheckoutWithItems,
        openCheckoutWithProduct,
        activeProductModal,
        activeModalVariantId,
        setActiveProductModal: handleSetActiveProductModal,
        orderSuccess,
        setOrderSuccess,
        settings,
        theme,
        toggleTheme,
        refreshSettings: fetchSettings,
        formatPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
