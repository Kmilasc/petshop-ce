import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { ArrowLeft, MapPin } from "lucide-react";

export const Route = createFileRoute("/pedidos/$orderId")({ component: OrderDetailPage });

interface OrderItem {
  id: number; productName: string; productImageUrl?: string | null;
  quantity: number; unitPrice: string; subtotal: string;
}

interface Address {
  street: string; number: string; complement?: string | null;
  neighborhood: string; city: string; state: string; zipCode: string;
}

interface Order {
  id: number; status: string; total: string; subtotal: string;
  shippingCost: string; notes?: string | null; createdAt: string;
  items: OrderItem[]; address?: Address | null;
}

const statusLabel: Record<string, { label: string; color: string; step: number }> = {
  pending: { label: "Aguardando confirmação", color: "text-yellow-600", step: 1 },
  confirmed: { label: "Pedido confirmado", color: "text-blue-600", step: 2 },
  shipped: { label: "Em transporte", color: "text-purple-600", step: 3 },
  delivered: { label: "Entregue", color: "text-emerald-600", step: 4 },
  cancelled: { label: "Cancelado", color: "text-red-600", step: 0 },
};

function OrderDetailPage() {
  const { orderId } = Route.useParams();
  const { token } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/orders/${orderId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { setOrder(d.order); setLoading(false); });
  }, [token, orderId]);

  if (loading) {
    return <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
      {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-2xl animate-pulse" />)}
    </div>;
  }

  if (!order) {
    return <div className="text-center py-20"><p>Pedido não encontrado.</p></div>;
  }

  const st = statusLabel[order.status] || { label: order.status, color: "text-gray-600", step: 0 };
  const steps = ["Aguardando", "Confirmado", "Em transporte", "Entregue"];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <Link to="/pedidos" className="flex items-center gap-1 text-sm text-gray-500 hover:text-emerald-600">
        <ArrowLeft className="w-4 h-4" /> Meus Pedidos
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Pedido #{order.id}</h1>
        <p className="text-sm text-gray-500">
          {new Date(order.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Status tracker */}
      {order.status !== "cancelled" && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            {steps.map((s, i) => (
              <div key={s} className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  i + 1 <= st.step ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-400"
                }`}>
                  {i + 1 <= st.step ? "✓" : i + 1}
                </div>
                <p className={`text-xs mt-1 text-center ${i + 1 <= st.step ? "text-emerald-600 font-medium" : "text-gray-400"}`}>
                  {s}
                </p>
                {i < steps.length - 1 && (
                  <div className={`absolute h-0.5 w-full ${i + 1 < st.step ? "bg-emerald-400" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>
          <p className={`text-sm font-medium text-center ${st.color}`}>{st.label}</p>
        </div>
      )}

      {/* Items */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="font-semibold text-gray-800 mb-4">Itens do pedido</h2>
        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                {item.productImageUrl
                  ? <img src={item.productImageUrl} alt={item.productName} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-xl">🐾</div>
                }
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{item.productName}</p>
                <p className="text-xs text-gray-500">{item.quantity}x R$ {parseFloat(item.unitPrice).toFixed(2).replace(".", ",")}</p>
              </div>
              <p className="font-bold text-sm">R$ {parseFloat(item.subtotal).toFixed(2).replace(".", ",")}</p>
            </div>
          ))}
        </div>
        <div className="border-t mt-4 pt-4 space-y-1 text-sm">
          <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>R$ {parseFloat(order.subtotal).toFixed(2).replace(".", ",")}</span></div>
          <div className="flex justify-between text-gray-600">
            <span>Frete</span>
            <span className={parseFloat(order.shippingCost) === 0 ? "text-emerald-600" : ""}>
              {parseFloat(order.shippingCost) === 0 ? "Grátis" : `R$ ${parseFloat(order.shippingCost).toFixed(2).replace(".", ",")}`}
            </span>
          </div>
          <div className="flex justify-between font-bold text-base border-t pt-2">
            <span>Total</span><span>R$ {parseFloat(order.total).toFixed(2).replace(".", ",")}</span>
          </div>
        </div>
      </div>

      {/* Address */}
      {order.address && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600" /> Endereço de entrega
          </h2>
          <p className="text-sm text-gray-600">
            {order.address.street}, {order.address.number}
            {order.address.complement && ` - ${order.address.complement}`}<br />
            {order.address.neighborhood} — {order.address.city}/{order.address.state}<br />
            CEP: {order.address.zipCode}
          </p>
        </div>
      )}
    </div>
  );
}
