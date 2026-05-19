import { Link } from "@tanstack/react-router";
import { ShoppingCart, Star } from "lucide-react";
import { useCart } from "../contexts/CartContext";
import { useState, useEffect } from "react";

interface Product {
  id: number;
  name: string;
  slug: string;
  price: string;
  originalPrice?: string | null;
  imageUrl?: string | null;
  brand?: string | null;
  petType: string;
  stock: number;
  featured: boolean;
}

const petTypeEmoji: Record<string, string> = {
  dog: "🐶",
  cat: "🐱",
  bird: "🐦",
  fish: "🐠",
  rabbit: "🐰",
  hamster: "🐹",
  reptile: "🦎",
  other: "🐾",
};

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    fetch(`/api/reviews?productId=${product.id}`)
      .then((r) => r.json())
      .then((d) => { setAvgRating(d.avg); setTotalReviews(d.total); })
      .catch(() => {});
  }, [product.id]);

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAdding(true);
    try {
      await addItem(product.id);
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    } catch {
      // silently handle auth redirect from cart context
    } finally {
      setAdding(false);
    }
  };

  const discount = product.originalPrice
    ? Math.round((1 - parseFloat(product.price) / parseFloat(product.originalPrice)) * 100)
    : null;

  return (
    <Link to="/produto/$slug" params={{ slug: product.slug }} className="group block">
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100">
        {/* Image */}
        <div className="relative h-48 bg-gray-100 overflow-hidden">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">
              {petTypeEmoji[product.petType] || "🐾"}
            </div>
          )}
          {discount && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              -{discount}%
            </span>
          )}
          {product.featured && (
            <span className="absolute top-2 right-2 bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <Star className="w-3 h-3" /> Destaque
            </span>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-bold">Esgotado</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          {product.brand && (
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{product.brand}</p>
          )}
          <h3 className="font-medium text-gray-900 text-sm leading-tight line-clamp-2 mb-1">
            {product.name}
          </h3>
          {totalReviews > 0 && avgRating !== null && (
            <div className="flex items-center gap-1 mb-2">
              {[1,2,3,4,5].map((s) => (
                <Star key={s} className={`w-3 h-3 ${s <= Math.round(avgRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
              ))}
              <span className="text-xs text-gray-400 ml-0.5">({totalReviews})</span>
            </div>
          )}
          <div className="flex items-end justify-between">
            <div>
              {product.originalPrice && (
                <p className="text-xs text-gray-400 line-through">
                  R$ {parseFloat(product.originalPrice).toFixed(2).replace(".", ",")}
                </p>
              )}
              <p className="text-lg font-bold text-emerald-600">
                R$ {parseFloat(product.price).toFixed(2).replace(".", ",")}
              </p>
            </div>
            <button
              onClick={handleAdd}
              disabled={adding || product.stock === 0}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                added
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              } disabled:opacity-50`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              {added ? "Adicionado!" : "Comprar"}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
