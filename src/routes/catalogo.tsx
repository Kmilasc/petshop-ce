import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ProductCard } from "../components/ProductCard";
import { SlidersHorizontal, ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/catalogo")({
  validateSearch: (s: Record<string, unknown>) => ({
    q: (s.q as string) || "",
    category: (s.category as string) || "",
    petType: (s.petType as string) || "",
    featured: (s.featured as string) || "",
    page: Number(s.page) || 1,
  }),
  component: CatalogoPage,
});

interface Product {
  id: number; name: string; slug: string; price: string;
  originalPrice?: string | null; imageUrl?: string | null;
  brand?: string | null; petType: string; stock: number; featured: boolean;
  categoryName?: string;
}

interface Category {
  id: number; name: string; slug: string; emoji?: string | null; petType?: string | null;
}

const petLabel: Record<string, string> = {
  dog: "🐶 Cachorros", cat: "🐱 Gatos", bird: "🐦 Pássaros",
  fish: "🐠 Peixes", rabbit: "🐰 Coelhos", hamster: "🐹 Hamsters",
  reptile: "🦎 Répteis", other: "🐾 Outros",
};

function CatalogoPage() {
  const search = useSearch({ from: "/catalogo" });
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search.q) params.set("search", search.q);
    if (search.category) params.set("category", search.category);
    if (search.petType) params.set("petType", search.petType);
    if (search.featured) params.set("featured", search.featured);
    params.set("page", String(search.page));
    params.set("limit", "12");

    setLoading(true);
    fetch(`/api/products?${params}`).then((r) => r.json()).then((d) => {
      setProducts(d.products || []);
      setPagination(d.pagination || { page: 1, pages: 1, total: 0 });
      setLoading(false);
    });
  }, [search.q, search.category, search.petType, search.featured, search.page]);

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((d) => setCategories(d.categories || []));
  }, []);

  const navigate = Route.useNavigate();

  const setFilter = (key: string, value: string | number) => {
    navigate({ search: (prev: Record<string, unknown>) => ({
      ...prev,
      [key]: value,
      ...(key !== "page" ? { page: 1 } : {}),
    }) } as any);
  };

  const clearFilters = () => {
    navigate({ search: {} } as any);
  };

  const hasFilters = search.q || search.category || search.petType || search.featured;

  const pageTitle = search.q
    ? `Resultados para "${search.q}"`
    : search.featured
    ? "Produtos em Destaque"
    : search.petType
    ? petLabel[search.petType]
    : "Catálogo";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{pageTitle}</h1>
          {!loading && (
            <p className="text-sm text-gray-500 mt-1">{pagination.total} produto{pagination.total !== 1 ? "s" : ""} encontrado{pagination.total !== 1 ? "s" : ""}</p>
          )}
        </div>
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="flex items-center gap-2 border border-gray-300 rounded-full px-4 py-2 text-sm hover:border-emerald-400 md:hidden"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filtros
        </button>
      </div>

      <div className="flex gap-6">
        {/* Sidebar filters */}
        <aside className={`${filtersOpen ? "block" : "hidden"} md:block w-full md:w-56 flex-shrink-0 space-y-6`}>
          {hasFilters && (
            <button onClick={clearFilters} className="text-sm text-red-500 hover:underline">
              Limpar filtros
            </button>
          )}

          {/* Pet type */}
          <div>
            <h3 className="font-semibold text-gray-800 text-sm mb-3">Tipo de Pet</h3>
            <div className="space-y-1">
              {Object.entries(petLabel).map(([type, label]) => (
                <button
                  key={type}
                  onClick={() => setFilter("petType", search.petType === type ? "" : type)}
                  className={`block w-full text-left text-sm px-3 py-1.5 rounded-lg ${
                    search.petType === type
                      ? "bg-emerald-100 text-emerald-700 font-medium"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold text-gray-800 text-sm mb-3">Categorias</h3>
            <div className="space-y-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setFilter("category", search.category === String(cat.id) ? "" : String(cat.id))}
                  className={`block w-full text-left text-sm px-3 py-1.5 rounded-lg ${
                    search.category === String(cat.id)
                      ? "bg-emerald-100 text-emerald-700 font-medium"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {cat.emoji ? `${cat.emoji} ${cat.name}` : cat.name}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Products grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="h-72 bg-gray-200 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-5xl mb-4">🔍</p>
              <p className="text-lg font-medium">Nenhum produto encontrado</p>
              <button onClick={clearFilters} className="mt-4 text-emerald-600 hover:underline text-sm">
                Limpar filtros
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    disabled={pagination.page <= 1}
                    onClick={() => setFilter("page", String(pagination.page - 1))}
                    className="p-2 rounded-full border hover:border-emerald-400 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-gray-600">
                    Página {pagination.page} de {pagination.pages}
                  </span>
                  <button
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => setFilter("page", String(pagination.page + 1))}
                    className="p-2 rounded-full border hover:border-emerald-400 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
