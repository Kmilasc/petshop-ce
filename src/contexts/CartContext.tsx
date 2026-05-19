import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";

export interface CartItem {
  id: number;
  quantity: number;
  productId: number;
  productName: string;
  productSlug: string;
  productPrice: string;
  productImageUrl: string | null;
  productStock: number;
}

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  isOpen: boolean;
  isLoading: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (productId: number, quantity?: number) => Promise<void>;
  updateItem: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refetch: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const authHeaders = useCallback(
    () => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" }),
    [token]
  );

  const fetchCart = useCallback(async () => {
    if (!token) { setItems([]); return; }
    try {
      const res = await fetch("/api/cart", { headers: authHeaders() });
      const data = await res.json();
      if (res.ok) setItems(data.items);
    } catch {
      // ignore
    }
  }, [token, authHeaders]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addItem = async (productId: number, quantity = 1) => {
    if (!token) throw new Error("Faça login para adicionar ao carrinho");
    setIsLoading(true);
    try {
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ productId, quantity }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error);
      }
      await fetchCart();
      setIsOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const updateItem = async (itemId: number, quantity: number) => {
    setIsLoading(true);
    try {
      await fetch(`/api/cart/${itemId}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ quantity }),
      });
      await fetchCart();
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (itemId: number) => {
    setIsLoading(true);
    try {
      await fetch(`/api/cart/${itemId}`, { method: "DELETE", headers: authHeaders() });
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    await fetch("/api/cart", { method: "DELETE", headers: authHeaders() });
    setItems([]);
  };

  const totalItems = items.reduce((acc, i) => acc + i.quantity, 0);
  const totalPrice = items.reduce(
    (acc, i) => acc + parseFloat(i.productPrice) * i.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        totalPrice,
        isOpen,
        isLoading,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
        addItem,
        updateItem,
        removeItem,
        clearCart,
        refetch: fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be inside CartProvider");
  return ctx;
}
