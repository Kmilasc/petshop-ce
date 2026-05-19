import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Package, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/pedidos")({ component: OrdersPage });

interface Order {
  id: number; status: string; total: string;
  subtotal: string; shippingCost: string; createdAt: string;
}

const statusLabel: Record<string, { label: string; color: string }> = {
  pending: { label: "Aguardando", color: "bg-yellow-100 text-yellow-700" },
  confirmed: { label: "Confirmado", color: "bg-blue-100 text-blue-700" },
  shipped: { label: "Em transporte", color: "bg-purple-100 text-purple-700" },
  delivered: { label: "Entregue", color: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-700" },
};

function OrdersPage() {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch("/api/orders", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { setOrders(d.orders || []); setLoading(false); });
  }, [token]);

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <p className="text-gray-600">Entre na sua conta para ver seus pedidos.</p>
        <Link to="/login" className="bg-emerald-600 text-white px-6 py-2 rounded-full font-medium">Entrar</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Package className="w-6 h-6 text-emerald-600" /> Meus Pedidos
      </h1>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Package className="w-16 h-16 mx-auto opacity-30 mb-4" />
          <p className="text-lg font-medium">Nenhum pedido ainda</p>
          <Link to="/catalogo" className="mt-4 inline-block text-emerald-600 hover:underline text-sm">
            Começar a comprar
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const st = statusLabel[order.status] || { label: order.status, color: "bg-gray-100 text-gray-600" };
            return (
              <Link
                key={order.id}
                to="/pedidos/$orderId"
                params={{ orderId: String(order.id) }}
                className="flex items-center justify-between bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow"
              >
                <div className="space-y-1">
                  <p className="font-semibold text-gray-900">Pedido #{order.id}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString("pt-BR", {
                      day: "2-digit", month: "long", year: "numeric",
                    })}
                  </p>
                  <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${st.color}`}>
                    {st.label}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-bold text-emerald-600">
                    R$ {parseFloat(order.total).toFixed(2).replace(".", ",")}
                  </p>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
