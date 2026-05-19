import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShoppingCart, ArrowLeft, Package, Tag, Weight, Star } from "lucide-react";
import { useCart } from "../../contexts/CartContext";
import { useAuth } from "../../contexts/AuthContext";

export const Route = createFileRoute("/produto/$slug")({ component: ProductPage });

interface Product {
  id: number; name: string; slug: string; description?: string | null;
  price: string; originalPrice?: string | null; stock: number;
  imageUrl?: string | null; petType: string; brand?: string | null;
  weight?: string | null; featured: boolean; categoryName?: string | null;
  categorySlug?: string | null;
}

interface Review {
  id: number; rating: number; comment?: string | null;
  createdAt: string; userName: string;
}

const petLabel: Record<string, string> = {
  dog: "🐶 Cachorro", cat: "🐱 Gato", bird: "🐦 Pássaro",
  fish: "🐠 Peixe", rabbit: "🐰 Coelho", hamster: "🐹 Hamster",
  reptile: "🦎 Réptil", other: "🐾 Outros",
};

function StarRating({ value, onChange, size = "md" }: {
  value: number; onChange?: (v: number) => void; size?: "sm" | "md";
}) {
  const [hover, setHover] = useState(0);
  const sz = size === "sm" ? "w-4 h-4" : "w-6 h-6";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange?.(s)}
          onMouseEnter={() => onChange && setHover(s)}
          onMouseLeave={() => onChange && setHover(0)}
          className={onChange ? "cursor-pointer" : "cursor-default"}
          disabled={!onChange}
        >
          <Star
            className={`${sz} transition-colors ${
              s <= (hover || value)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewsSection({ productId }: { productId: number }) {
  const { user, token } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avg, setAvg] = useState<number | null>(null);
  const [total, setTotal] = useState(0);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    fetch(`/api/reviews?productId=${productId}`)
      .then((r) => r.json())
      .then((d) => {
        setReviews(d.reviews || []);
        setAvg(d.avg);
        setTotal(d.total);
      });
  };

  useEffect(() => { load(); }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) { setError("Selecione uma nota"); return; }
    setError(""); setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId, rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erro ao enviar avaliação");
      setSubmitted(true);
      setComment(""); setRating(0);
      load();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-8 bg-white rounded-2xl shadow-sm p-6 space-y-6">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-bold text-gray-900">Avaliações</h2>
        {avg !== null && (
          <div className="flex items-center gap-2">
            <StarRating value={Math.round(avg)} size="sm" />
            <span className="text-sm font-semibold text-gray-700">{avg.toFixed(1)}</span>
            <span className="text-sm text-gray-400">({total} {total === 1 ? "avaliação" : "avaliações"})</span>
          </div>
        )}
        {avg === null && total === 0 && (
          <span className="text-sm text-gray-400">Sem avaliações ainda</span>
        )}
      </div>

      {/* Form */}
      {user ? (
        submitted ? (
          <p className="text-emerald-600 text-sm font-medium bg-emerald-50 px-4 py-3 rounded-xl">
            ✓ Obrigado pela sua avaliação!
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3 border-t pt-4">
            <p className="text-sm font-medium text-gray-700">Deixe sua avaliação</p>
            <StarRating value={rating} onChange={setRating} />
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Comentário (opcional)"
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="bg-emerald-600 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-emerald-700 disabled:opacity-60 transition"
            >
              {submitting ? "Enviando..." : "Enviar avaliação"}
            </button>
          </form>
        )
      ) : (
        <p className="text-sm text-gray-500 border-t pt-4">
          <Link to="/login" className="text-emerald-600 font-medium hover:underline">Faça login</Link> para avaliar este produto.
        </p>
      )}

      {/* List */}
      {reviews.length > 0 && (
        <div className="space-y-4 border-t pt-4">
          {reviews.map((r) => (
            <div key={r.id} className="space-y-1">
              <div className="flex items-center gap-3">
                <StarRating value={r.rating} size="sm" />
                <span className="text-sm font-medium text-gray-800">{r.userName}</span>
                <span className="text-xs text-gray-400">
                  {new Date(r.createdAt).toLocaleDateString("pt-BR")}
                </span>
              </div>
              {r.comment && <p className="text-sm text-gray-600 pl-0.5">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductPage() {
  const { slug } = Route.useParams();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/products/${slug}`).then((r) => {
      if (r.status === 404) { setNotFound(true); setLoading(false); return null; }
      return r.json();
    }).then((d) => {
      if (d) setProduct(d.product);
      setLoading(false);
    });
  }, [slug]);

  const handleAdd = async () => {
    if (!product) return;
    setAdding(true);
    setError("");
    try {
      await addItem(product.id, qty);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid md:grid-cols-2 gap-10 animate-pulse">
          <div className="h-96 bg-gray-200 rounded-2xl" />
          <div className="space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-6 bg-gray-200 rounded w-1/4" />
            <div className="h-24 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="text-center py-20">
        <p className="text-5xl mb-4">🔍</p>
        <h1 className="text-2xl font-bold text-gray-800">Produto não encontrado</h1>
        <Link to="/catalogo" className="mt-4 inline-block text-emerald-600 hover:underline">
          Voltar ao catálogo
        </Link>
      </div>
    );
  }

  const discount = product.originalPrice
    ? Math.round((1 - parseFloat(product.price) / parseFloat(product.originalPrice)) * 100)
    : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link to="/catalogo" className="flex items-center gap-1 text-sm text-gray-500 hover:text-emerald-600 mb-6">
        <ArrowLeft className="w-4 h-4" /> Voltar ao catálogo
      </Link>

      <div className="grid md:grid-cols-2 gap-10 bg-white rounded-2xl shadow-sm p-6 md:p-10">
        {/* Image */}
        <div className="relative">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full rounded-xl object-cover aspect-square" />
          ) : (
            <div className="w-full aspect-square bg-gray-100 rounded-xl flex items-center justify-center text-8xl">
              {product.petType ? (petLabel[product.petType]?.[0] || "🐾") : "🐾"}
            </div>
          )}
          {discount && (
            <span className="absolute top-3 left-3 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
              -{discount}%
            </span>
          )}
        </div>

        {/* Info */}
        <div className="space-y-4">
          <div>
            {product.brand && <p className="text-sm text-gray-400 uppercase tracking-wide">{product.brand}</p>}
            <h1 className="text-2xl font-bold text-gray-900 mt-1">{product.name}</h1>
          </div>

          <div className="flex items-center gap-3">
            {product.originalPrice && (
              <p className="text-gray-400 line-through text-lg">
                R$ {parseFloat(product.originalPrice).toFixed(2).replace(".", ",")}
              </p>
            )}
            <p className="text-3xl font-bold text-emerald-600">
              R$ {parseFloat(product.price).toFixed(2).replace(".", ",")}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
              <Tag className="w-3 h-3" /> {petLabel[product.petType] || product.petType}
            </span>
            {product.categoryName && (
              <span className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                <Package className="w-3 h-3" /> {product.categoryName}
              </span>
            )}
            {product.weight && (
              <span className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                <Weight className="w-3 h-3" /> {product.weight}
              </span>
            )}
          </div>

          {product.description && (
            <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
          )}

          <div className="border-t pt-4">
            <p className={`text-sm font-medium mb-3 ${product.stock > 0 ? "text-emerald-600" : "text-red-500"}`}>
              {product.stock > 0 ? `✓ ${product.stock} em estoque` : "✗ Produto esgotado"}
            </p>

            {product.stock > 0 && (
              <div className="flex items-center gap-3 mb-4">
                <label className="text-sm text-gray-600">Quantidade:</label>
                <div className="flex items-center border rounded-full overflow-hidden">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="px-3 py-1.5 hover:bg-gray-100 text-lg leading-none"
                  >−</button>
                  <span className="px-4 py-1.5 text-sm font-medium border-x">{qty}</span>
                  <button
                    onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
                    className="px-3 py-1.5 hover:bg-gray-100 text-lg leading-none"
                  >+</button>
                </div>
              </div>
            )}

            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

            <button
              onClick={handleAdd}
              disabled={adding || product.stock === 0}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-full font-semibold text-sm transition-all ${
                added
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              } disabled:opacity-50`}
            >
              <ShoppingCart className="w-4 h-4" />
              {added ? "Adicionado ao carrinho! ✓" : product.stock === 0 ? "Esgotado" : "Adicionar ao Carrinho"}
            </button>
          </div>

          <div className="bg-emerald-50 rounded-xl p-4 text-sm text-emerald-700 space-y-1">
            <p>🚚 Frete grátis em compras acima de R$ 150</p>
            <p>🔒 Compra 100% segura</p>
          </div>
        </div>
      </div>

      <ReviewsSection productId={product.id} />
    </div>
  );
}
