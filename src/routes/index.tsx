import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ProductCard } from "../components/ProductCard";
import { ArrowRight, Shield, Truck, Heart, Star } from "lucide-react";

export const Route = createFileRoute("/")({ component: HomePage });

interface Product {
  id: number; name: string; slug: string; price: string;
  originalPrice?: string | null; imageUrl?: string | null;
  brand?: string | null; petType: string; stock: number; featured: boolean;
}

interface Category {
  id: number; name: string; slug: string; imageUrl?: string | null;
  emoji?: string | null; petType?: string | null; productCount: number;
}

const petEmoji: Record<string, string> = {
  dog: "🐶", cat: "🐱", bird: "🐦", fish: "🐠",
  rabbit: "🐰", hamster: "🐹", reptile: "🦎", other: "🐾",
};

const petLabel: Record<string, string> = {
  dog: "Cachorros", cat: "Gatos", bird: "Pássaros", fish: "Peixes",
  rabbit: "Coelhos", hamster: "Hamsters", reptile: "Répteis", other: "Outros",
};

function HomePage() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/products?featured=true&limit=8").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ]).then(([prod, cats]) => {
      setFeatured(prod.products || []);
      setCategories(cats.categories || []);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="bg-linear-to-br from-emerald-600 to-teal-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 flex flex-col md:flex-row items-center gap-10">
          <div className="flex-1 space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold leading-tight">
              Tudo para o bem-estar do seu <span className="text-yellow-300">animal de estimação</span>
            </h1>
            <p className="text-emerald-100 text-lg max-w-lg">
              Ração, brinquedos, acessórios e muito mais. Entrega rápida e frete grátis acima de R$ 150.
            </p>
            <div className="flex gap-3">
              <Link to="/catalogo" className="bg-white text-emerald-700 font-bold px-6 py-3 rounded-full hover:bg-emerald-50 flex items-center gap-2">
                Ver Produtos <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/registro" className="border-2 border-white text-white font-medium px-6 py-3 rounded-full hover:bg-white/10">
                Criar Conta
              </Link>
            </div>
          </div>
          <div className="text-9xl select-none">🐾</div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { icon: <Truck className="w-6 h-6 text-emerald-600" />, title: "Frete Grátis", desc: "Em compras acima de R$ 150" },
            { icon: <Shield className="w-6 h-6 text-emerald-600" />, title: "Compra Segura", desc: "Seus dados protegidos" },
            { icon: <Heart className="w-6 h-6 text-emerald-600" />, title: "Produtos Selecionados", desc: "Qualidade garantida para seu pet" },
          ].map((b) => (
            <div key={b.title} className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center">{b.icon}</div>
              <div>
                <p className="font-semibold text-gray-900">{b.title}</p>
                <p className="text-sm text-gray-500">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Categorias</h2>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to="/catalogo"
                search={{ category: String(cat.id) } as any}
                className="bg-white rounded-2xl p-4 border border-gray-100 hover:border-emerald-300 hover:shadow-md transition-all text-center group"
              >
                <div className="text-4xl mb-2">{cat.emoji ?? (cat.petType ? petEmoji[cat.petType] : "🐾")}</div>
                <p className="font-semibold text-gray-800 text-sm">{cat.name}</p>
                <p className="text-xs text-gray-400">{cat.productCount} produtos</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Pet type quick filters */}
      <section className="bg-emerald-50 py-10">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Comprar por pet</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(petLabel).map(([type, label]) => (
              <Link
                key={type}
                to="/catalogo"
                search={{ petType: type } as any}
                className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-200 hover:border-emerald-400 hover:bg-emerald-50 text-sm font-medium text-gray-700 transition-all"
              >
                <span>{petEmoji[type]}</span> {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
            Produtos em Destaque
          </h2>
          <Link to="/catalogo" className="text-emerald-600 font-medium text-sm hover:underline flex items-center gap-1">
            Ver todos <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-72 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : featured.length === 0 ? (
          <p className="text-gray-500 text-center py-10">Nenhum produto em destaque no momento.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>
    </div>
  );
}
