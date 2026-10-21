'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, OrderItem, Order, StoreSettings } from '@/lib/types';
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
  addToCart: (product: Product, quantity?: number) => void;
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
  openCheckoutWithProduct: (product: Product) => void;
  activeProductModal: Product | null;
  setActiveProductModal: (product: Product | null) => void;
  orderSuccess: Order | null;
  setOrderSuccess: (order: Order | null) => void;
  settings: StoreSettings | null;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  refreshSettings: () => Promise<void>;
  formatPrice: (pkr: number, usd: number) => string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [initialCartLoaded, setInitialCartLoaded] = useState(false);
  const [currency, setCurrency] = useState<'PKR' | 'USD'>('PKR');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartNotification, setCartNotification] = useState<CartNotification | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<OrderItem[]>([]);
  const [activeProductModal, setActiveProductModal] = useState<Product | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<Order | null>(null);
  const [settings, setSettings] = useState<StoreSettings | null>(null);

  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  // Load initial cart, currency, and theme from localStorage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('yt_cart');
      if (savedCart) setCart(JSON.parse(savedCart));

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

  // Bi-directional Server Cart Sync: Sync cart with user's Gmail account across all devices
  useEffect(() => {
    let active = true;

    async function syncUserCartFromServer() {
      if (!user?.email) {
        setInitialCartLoaded(true);
        return;
      }

      try {
        const res = await fetch(`/api/user/cart?email=${encodeURIComponent(user.email)}`);
        const data = await res.json();
        if (active && data.success && Array.isArray(data.cart)) {
          if (data.cart.length > 0) {
            setCart((localCart) => {
              // Merge any existing local items with server items
              const merged = [...data.cart];
              for (const item of localCart) {
                const idx = merged.findIndex((m) => m.productId === item.productId);
                if (idx !== -1) {
                  merged[idx].quantity = Math.max(merged[idx].quantity, item.quantity);
                } else {
                  merged.push(item);
                }
              }
              return merged;
            });
          } else {
            // If user's account had 0 items on server but current local has items, sync them to server!
            setCart((currentLocalCart) => {
              if (currentLocalCart.length > 0) {
                fetch('/api/user/cart', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: user.email, cart: currentLocalCart }),
                }).catch(() => {});
              }
              return currentLocalCart;
            });
          }
        }
      } catch {
        // ignore
      } finally {
        if (active) setInitialCartLoaded(true);
      }
    }

    syncUserCartFromServer();

    return () => {
      active = false;
    };
  }, [user?.email]);

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

  // Save cart to localStorage AND sync to database when cart updates
  useEffect(() => {
    try {
      localStorage.setItem('yt_cart', JSON.stringify(cart));
      // If user is signed in, sync cart to their Gmail account on the server
      if (user?.email && initialCartLoaded) {
        fetch('/api/user/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: user.email, cart }),
        }).catch(() => {});
      }
    } catch {
      // ignore
    }
  }, [cart, user?.email, initialCartLoaded]);

  // Save currency
  const handleSetCurrency = (c: 'PKR' | 'USD') => {
    setCurrency(c);
    try {
      localStorage.setItem('yt_currency', c);
    } catch {
      // ignore
    }
  };

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

  const clearCartNotification = () => {
    setCartNotification(null);
  };

  const addToCart = (product: Product, quantity = 1) => {
    if (product.isSoldOut) return;
    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          title: product.title,
          pricePKR: product.pricePKR,
          priceUSD: product.priceUSD,
          quantity,
          image: product.images[0] || '',
        },
      ];
    });

    // Show non-intrusive toast notification without opening drawer
    setCartNotification({
      id: Date.now().toString(),
      title: product.title,
      image: product.images[0] || '',
      quantity,
    });

    // Silent background email alert trigger
    try {
      let currentUser: { name?: string; email?: string; whatsappNumber?: string } | null = null;
      try {
        const saved = localStorage.getItem('yt_user_session');
        if (saved) currentUser = JSON.parse(saved);
      } catch {}

      fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'add_to_cart',
          items: [
            {
              title: product.title,
              quantity,
              pricePKR: product.pricePKR,
              priceUSD: product.priceUSD,
              image: product.images[0] || '',
            },
          ],
          totalPKR: product.pricePKR * quantity,
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
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const openCheckoutWithItems = (items: OrderItem[]) => {
    setCheckoutItems(items);
    setIsCheckoutOpen(true);
  };

  const openCheckoutWithProduct = (product: Product) => {
    if (product.isSoldOut) return;
    const item: OrderItem = {
      productId: product.id,
      title: product.title,
      pricePKR: product.pricePKR,
      priceUSD: product.priceUSD,
      quantity: 1,
      image: product.images[0] || '',
    };
    setCheckoutItems([item]);
    setIsCheckoutOpen(true);
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotalPKR = cart.reduce((sum, item) => sum + item.pricePKR * item.quantity, 0);
  const cartTotalUSD = cart.reduce((sum, item) => sum + item.priceUSD * item.quantity, 0);

  const formatPrice = (pkr: number, _usd?: number) => {
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
        setActiveProductModal,
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
