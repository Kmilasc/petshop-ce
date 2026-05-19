import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { LayoutDashboard, Package, ShoppingBag, Plus, Pencil, Trash2, X, Check } from "lucide-react";

export const Route = createFileRoute("/admin")({ component: AdminPage });

interface AdminOrder {
  id: number; status: string; total: string; createdAt: string;
  userName: string; userEmail: string;
}

interface Product {
  id: number; name: string; slug: string; description?: string;
  price: string; originalPrice?: string; stock: number; imageUrl?: string;
  categoryId: number; petType: string; brand?: string; weight?: string;
  featured: boolean; active: boolean;
}

interface Category { id: number; name: string; slug: string; }

const statuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
const statusLabel: Record<string, string> = {
  pending: "Aguardando", confirmed: "Confirmado", shipped: "Em transporte",
  delivered: "Entregue", cancelled: "Cancelado",
};

const petTypes = ["dog", "cat", "bird", "fish", "rabbit", "hamster", "reptile", "other"];
const petTypeLabel: Record<string, string> = {
  dog: "Cachorro", cat: "Gato", bird: "Pássaro", fish: "Peixe",
  rabbit: "Coelho", hamster: "Hamster", reptile: "Réptil", other: "Outro",
};

const emptyForm = {
  name: "", slug: "", description: "", price: "", originalPrice: "",
  stock: 0, imageUrl: "", categoryId: 0, petType: "dog",
  brand: "", weight: "", featured: false, active: true,
};

function slugify(str: string) {
  return str.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function ProductModal({ product, categories, token, onClose, onSaved }: {
  product: Product | null; categories: Category[]; token: string;
  onClose: () => void; onSaved: (p: Product) => void;
}) {
  const isEdit = !!product;
  const [form, setForm] = useState(product ? {
    name: product.name, slug: product.slug, description: product.description || "",
    price: product.price, originalPrice: product.originalPrice || "",
    stock: product.stock, imageUrl: product.imageUrl || "",
    categoryId: product.categoryId, petType: product.petType,
    brand: product.brand || "", weight: product.weight || "",
    featured: product.featured, active: product.active,
  } : { ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const val = e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked
      : e.target.type === "number" ? parseInt(e.target.value) || 0
      : e.target.value;
    setForm((f) => {
      const updated = { ...f, [k]: val };
      if (k === "name" && !isEdit) updated.slug = slugify(e.target.value as string);
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSaving(true);
    try {
      const url = isEdit ? `/api/admin/products?id=${product!.id}` : "/api/admin/products";
      const method = isEdit ? "PATCH" : "POST";
      const body = {
        ...form,
        stock: Number(form.stock),
        categoryId: Number(form.categoryId),
        originalPrice: form.originalPrice || undefined,
        description: form.description || undefined,
        imageUrl: form.imageUrl || undefined,
        brand: form.brand || undefined,
        weight: form.weight || undefined,
      };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erro ao salvar produto");
      onSaved(data.product);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center overflow-y-auto py-8 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-4 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold text-gray-900">{isEdit ? "Editar produto" : "Novo produto"}</h2>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Nome *</label>
              <input value={form.name} onChange={set("name")} required
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Slug *</label>
              <input value={form.slug} onChange={set("slug")} required
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Marca</label>
              <input value={form.brand} onChange={set("brand")}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Preço (R$) *</label>
              <input value={form.price} onChange={set("price")} required placeholder="0.00"
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Preço original</label>
              <input value={form.originalPrice} onChange={set("originalPrice")} placeholder="0.00"
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Estoque *</label>
              <input type="number" min={0} value={form.stock} onChange={set("stock")} required
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Peso</label>
              <input value={form.weight} onChange={set("weight")} placeholder="1kg"
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Categoria *</label>
              <select value={form.categoryId} onChange={set("categoryId")} required
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
                <option value={0}>Selecionar...</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de pet *</label>
              <select value={form.petType} onChange={set("petType")}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
                {petTypes.map((t) => <option key={t} value={t}>{petTypeLabel[t]}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">URL da imagem</label>
              <input value={form.imageUrl} onChange={set("imageUrl")} placeholder="https://..."
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Descrição</label>
              <textarea value={form.description} onChange={set("description")} rows={3}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none" />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.featured} onChange={set("featured")} className="accent-emerald-600" />
                Destaque
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.active} onChange={set("active")} className="accent-emerald-600" />
                Ativo
              </label>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</p>}

          <button type="submit" disabled={saving}
            className="w-full bg-emerald-600 text-white py-2.5 rounded-full font-semibold hover:bg-emerald-700 disabled:opacity-60 transition flex items-center justify-center gap-2">
            <Check className="w-4 h-4" /> {saving ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar produto"}
          </button>
        </form>
      </div>
    </div>
  );
}

function AdminPage() {
  const { user, token } = useAuth();
  const [tab, setTab] = useState<"orders" | "products">("orders");

  // Orders state
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [modalProduct, setModalProduct] = useState<Product | null | "new">(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch("/api/admin/orders", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { setOrders(d.orders || []); setLoadingOrders(false); });
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []));
  }, [token]);

  useEffect(() => {
    if (tab !== "products" || !token) return;
    setLoadingProducts(true);
    fetch("/api/products?limit=100", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { setProducts(d.products || []); setLoadingProducts(false); });
  }, [tab, token]);

  const updateStatus = async (id: number, status: string) => {
    setUpdating(id);
    await fetch(`/api/admin/orders?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
    setUpdating(null);
  };

  const handleProductSaved = (saved: Product) => {
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === saved.id);
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next; }
      return [saved, ...prev];
    });
    setModalProduct(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Desativar este produto?")) return;
    setDeletingId(id);
    await fetch(`/api/admin/products?id=${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setProducts((prev) => prev.map((p) => p.id === id ? { ...p, active: false } : p));
    setDeletingId(null);
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <p className="text-gray-600 text-lg">Acesso restrito a administradores.</p>
        <Link to="/" className="text-emerald-600 hover:underline">Voltar ao início</Link>
      </div>
    );
  }

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    revenue: orders
      .filter((o) => o.status !== "cancelled")
      .reduce((acc, o) => acc + parseFloat(o.total), 0),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <LayoutDashboard className="w-6 h-6 text-emerald-600" /> Painel Administrativo
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total de Pedidos", value: stats.total, icon: <ShoppingBag className="w-5 h-5" />, color: "text-blue-600" },
          { label: "Aguardando", value: stats.pending, icon: <Package className="w-5 h-5" />, color: "text-yellow-600" },
          { label: "Receita Total", value: `R$ ${stats.revenue.toFixed(2).replace(".", ",")}`, icon: <LayoutDashboard className="w-5 h-5" />, color: "text-emerald-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4">
            <div className={`${s.color} bg-gray-50 p-3 rounded-xl`}>{s.icon}</div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(["orders", "products"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${tab === t ? "bg-emerald-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"}`}>
            {t === "orders" ? "Pedidos" : "Produtos"}
          </button>
        ))}
      </div>

      {/* Orders tab */}
      {tab === "orders" && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b">
            <h2 className="font-semibold text-gray-800">Gerenciar Pedidos</h2>
          </div>
          {loadingOrders ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : orders.length === 0 ? (
            <p className="text-gray-400 text-center py-12">Nenhum pedido ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-5 py-3 text-left">Pedido</th>
                    <th className="px-5 py-3 text-left">Cliente</th>
                    <th className="px-5 py-3 text-left">Data</th>
                    <th className="px-5 py-3 text-left">Total</th>
                    <th className="px-5 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50/50">
                      <td className="px-5 py-3 font-medium">#{order.id}</td>
                      <td className="px-5 py-3">
                        <p className="font-medium">{order.userName}</p>
                        <p className="text-gray-400 text-xs">{order.userEmail}</p>
                      </td>
                      <td className="px-5 py-3 text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-5 py-3 font-bold text-emerald-600">
                        R$ {parseFloat(order.total).toFixed(2).replace(".", ",")}
                      </td>
                      <td className="px-5 py-3">
                        <select
                          value={order.status}
                          onChange={(e) => updateStatus(order.id, e.target.value)}
                          disabled={updating === order.id}
                          className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400 disabled:opacity-50"
                        >
                          {statuses.map((s) => (
                            <option key={s} value={s}>{statusLabel[s]}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Products tab */}
      {tab === "products" && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Gerenciar Produtos</h2>
            <button onClick={() => setModalProduct("new")}
              className="flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-emerald-700 transition">
              <Plus className="w-4 h-4" /> Novo produto
            </button>
          </div>
          {loadingProducts ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : products.length === 0 ? (
            <p className="text-gray-400 text-center py-12">Nenhum produto cadastrado.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-5 py-3 text-left">Produto</th>
                    <th className="px-5 py-3 text-left">Preço</th>
                    <th className="px-5 py-3 text-left">Estoque</th>
                    <th className="px-5 py-3 text-left">Pet</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-left">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map((p) => (
                    <tr key={p.id} className={`hover:bg-gray-50/50 ${!p.active ? "opacity-50" : ""}`}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          {p.imageUrl && (
                            <img src={p.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                          )}
                          <div>
                            <p className="font-medium">{p.name}</p>
                            <p className="text-gray-400 text-xs">{p.brand || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-semibold text-emerald-600">
                        R$ {parseFloat(p.price).toFixed(2).replace(".", ",")}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`font-medium ${p.stock === 0 ? "text-red-500" : "text-gray-700"}`}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-500">{petTypeLabel[p.petType] || p.petType}</td>
                      <td className="px-5 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                          {p.active ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setModalProduct(p)}
                            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(p.id)} disabled={deletingId === p.id}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Product modal */}
      {modalProduct !== null && (
        <ProductModal
          product={modalProduct === "new" ? null : modalProduct}
          categories={categories}
          token={token!}
          onClose={() => setModalProduct(null)}
          onSaved={handleProductSaved}
        />
      )}
    </div>
  );
}
