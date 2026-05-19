import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";
import { CheckCircle, ArrowLeft, CreditCard, MapPin, ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/checkout")({ component: CheckoutPage });

// Formata CEP: 00000-000
function formatZip(v: string) {
  return v.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");
}

// Formata número do cartão: 0000 0000 0000 0000
function formatCard(v: string) {
  return v.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

// Formata validade: MM/AA
function formatExpiry(v: string) {
  return v.replace(/\D/g, "").slice(0, 4).replace(/(\d{2})(\d)/, "$1/$2");
}

function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const { token, user } = useAuth();

  // 3 passos: endereço → pagamento → confirmado
  const [step, setStep] = useState<"address" | "payment" | "done">("address");
  const [orderId, setOrderId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [error, setError] = useState("");

  const [address, setAddress] = useState({
    zipCode: "", street: "", number: "", complement: "",
    neighborhood: "", city: "", state: "",
  });
  const [savedAddress, setSavedAddress] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch("/api/auth/addresses", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        const defaultAddr = d.addresses?.[0];
        if (defaultAddr?.street) {
          setAddress({
            zipCode: defaultAddr.zipCode || "",
            street: defaultAddr.street || "",
            number: defaultAddr.number || "",
            complement: defaultAddr.complement || "",
            neighborhood: defaultAddr.neighborhood || "",
            city: defaultAddr.city || "",
            state: defaultAddr.state || "",
          });
          setSavedAddress(true);
        }
      })
      .catch(() => {});
  }, [token]);

  const [payment, setPayment] = useState({
    cardName: "", cardNumber: "", expiry: "", cvv: "",
    method: "credit" as "credit" | "debit" | "pix",
  });

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <p className="text-gray-600">Você precisa estar logado para finalizar a compra.</p>
        <Link to="/login" className="bg-emerald-600 text-white px-6 py-2 rounded-full font-medium">Entrar</Link>
      </div>
    );
  }

  if (items.length === 0 && step !== "done") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <p className="text-5xl">🛒</p>
        <p className="text-gray-600 text-lg">Seu carrinho está vazio</p>
        <Link to="/catalogo" className="text-emerald-600 hover:underline">Ver produtos</Link>
      </div>
    );
  }

  const shipping = totalPrice >= 150 ? 0 : 19.9;
  const total = totalPrice + shipping;

  // Busca endereço pelo CEP via ViaCEP
  const fetchCEP = async () => {
    const zip = address.zipCode.replace(/\D/g, "");
    if (zip.length !== 8) return;
    setLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${zip}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setAddress((a) => ({
          ...a,
          street: data.logradouro || a.street,
          neighborhood: data.bairro || a.neighborhood,
          city: data.localidade || a.city,
          state: data.uf || a.state,
        }));
      }
    } catch { /* ignora */ } finally {
      setLoadingCep(false);
    }
  };

  const setAddr = (k: keyof typeof address) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value;
    if (k === "zipCode") v = formatZip(v);
    setAddress((a) => ({ ...a, [k]: v }));
  };

  const setPay = (k: keyof typeof payment) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    let v = e.target.value;
    if (k === "cardNumber") v = formatCard(v);
    if (k === "expiry") v = formatExpiry(v);
    if (k === "cvv") v = v.replace(/\D/g, "").slice(0, 4);
    setPayment((p) => ({ ...p, [k]: v }));
  };

  const handleOrder = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newAddress: address }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOrderId(data.order.id);
      await clearCart();
      setStep("done");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Resumo lateral reutilizável
  const Summary = () => (
    <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
      <h2 className="font-semibold text-gray-800 flex items-center gap-2">
        <ShoppingBag className="w-4 h-4 text-emerald-600" /> Resumo
      </h2>
      <div className="space-y-2 max-h-44 overflow-y-auto">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="text-gray-600 truncate mr-2">{item.productName} x{item.quantity}</span>
            <span className="font-medium shrink-0">
              R$ {(parseFloat(item.productPrice) * item.quantity).toFixed(2).replace(".", ",")}
            </span>
          </div>
        ))}
      </div>
      <div className="border-t pt-3 space-y-1 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span><span>R$ {totalPrice.toFixed(2).replace(".", ",")}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Frete</span>
          <span className={shipping === 0 ? "text-emerald-600" : ""}>
            {shipping === 0 ? "Grátis" : `R$ ${shipping.toFixed(2).replace(".", ",")}`}
          </span>
        </div>
        <div className="flex justify-between font-bold text-base border-t pt-2">
          <span>Total</span><span>R$ {total.toFixed(2).replace(".", ",")}</span>
        </div>
      </div>
    </div>
  );

  // Tela de sucesso
  if (step === "done") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-4 text-center">
        <CheckCircle className="w-20 h-20 text-emerald-500" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pedido realizado!</h1>
          <p className="text-gray-500 mt-2">Pedido #{orderId} confirmado com sucesso.</p>
          <p className="text-gray-400 text-sm mt-1">Você receberá atualizações do status do seu pedido.</p>
        </div>
        <div className="flex gap-3 flex-wrap justify-center">
          <Link to="/pedidos" className="bg-emerald-600 text-white px-6 py-3 rounded-full font-medium">
            Ver Meus Pedidos
          </Link>
          <Link to="/" className="border border-gray-300 px-6 py-3 rounded-full font-medium text-gray-700 hover:border-emerald-400">
            Continuar Comprando
          </Link>
        </div>
      </div>
    );
  }

  // Steps indicator
  const steps = [
    { key: "address", label: "Endereço", icon: <MapPin className="w-4 h-4" /> },
    { key: "payment", label: "Pagamento", icon: <CreditCard className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link to="/catalogo" className="flex items-center gap-1 text-sm text-gray-500 hover:text-emerald-600 mb-6">
        <ArrowLeft className="w-4 h-4" /> Continuar comprando
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Finalizar Compra</h1>

      {/* Steps */}
      <div className="flex items-center gap-2 mb-6">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center flex-1">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
              step === s.key ? "bg-emerald-600 text-white" :
              (step === "payment" && i === 0) ? "bg-emerald-100 text-emerald-700" :
              "bg-gray-100 text-gray-400"
            }`}>
              {s.icon} {s.label}
            </div>
            {i < steps.length - 1 && <div className="flex-1 h-px bg-gray-200 mx-2" />}
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">

        {/* PASSO 1: Endereço */}
        {step === "address" && (
          <div className="md:col-span-2 bg-white rounded-2xl shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" /> Endereço de entrega
            </h2>
            {savedAddress && (
              <p className="text-xs text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">
                ✓ Endereço do cadastro pré-preenchido — edite se necessário
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">CEP</label>
                <input value={address.zipCode} onChange={setAddr("zipCode")} onBlur={fetchCEP}
                  placeholder="00000-000" inputMode="numeric"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                {loadingCep && <p className="text-xs text-gray-400 mt-1">Buscando...</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Número</label>
                <input value={address.number} onChange={setAddr("number")} placeholder="123"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Rua / Avenida</label>
                <input value={address.street} onChange={setAddr("street")} placeholder="Rua das Flores"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Complemento</label>
                <input value={address.complement} onChange={setAddr("complement")} placeholder="Apto 4B"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Bairro</label>
                <input value={address.neighborhood} onChange={setAddr("neighborhood")} placeholder="Centro"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Cidade</label>
                <input value={address.city} onChange={setAddr("city")} placeholder="São Paulo"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Estado (UF)</label>
                <input value={address.state} onChange={setAddr("state")} placeholder="SP" maxLength={2}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
            </div>
            <button
              onClick={() => setStep("payment")}
              disabled={!address.street || !address.city || !address.zipCode || !address.number}
              className="w-full bg-emerald-600 text-white py-3 rounded-full font-semibold hover:bg-emerald-700 disabled:opacity-50 transition flex items-center justify-center gap-2">
              Ir para pagamento <CreditCard className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* PASSO 2: Pagamento */}
        {step === "payment" && (
          <div className="md:col-span-2 bg-white rounded-2xl shadow-sm p-6 space-y-5">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" /> Forma de pagamento
            </h2>

            {/* Método de pagamento */}
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: "credit", label: "Crédito" },
                { value: "debit", label: "Débito" },
                { value: "pix", label: "PIX" },
              ] as const).map((m) => (
                <button key={m.value} type="button"
                  onClick={() => setPayment((p) => ({ ...p, method: m.value }))}
                  className={`py-2 px-3 rounded-xl border text-sm font-medium transition ${
                    payment.method === m.value
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-gray-200 text-gray-600 hover:border-emerald-300"
                  }`}>
                  {m.value === "pix" ? "🔑 " : "💳 "}{m.label}
                </button>
              ))}
            </div>

            {/* Campos de cartão (não aparecem para PIX) */}
            {payment.method !== "pix" ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nome no cartão</label>
                  <input value={payment.cardName}
                    onChange={(e) => setPayment((p) => ({ ...p, cardName: e.target.value.toUpperCase() }))}
                    placeholder="JOÃO SILVA" autoComplete="cc-name"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Número do cartão</label>
                  <input value={payment.cardNumber} onChange={setPay("cardNumber")}
                    placeholder="0000 0000 0000 0000" inputMode="numeric" autoComplete="cc-number"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Validade</label>
                    <input value={payment.expiry} onChange={setPay("expiry")}
                      placeholder="MM/AA" inputMode="numeric" autoComplete="cc-exp"
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">CVV</label>
                    <input value={payment.cvv} onChange={setPay("cvv")}
                      placeholder="123" inputMode="numeric" autoComplete="cc-csc"
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                  </div>
                </div>
                <p className="text-xs text-gray-400">🔒 Ambiente simulado — nenhum dado real é processado</p>
              </div>
            ) : (
              <div className="bg-emerald-50 rounded-xl p-5 text-center space-y-3">
                <p className="text-4xl">📱</p>
                <p className="font-semibold text-gray-800">Chave PIX</p>
                <p className="text-sm font-mono bg-white border border-emerald-200 rounded-lg px-4 py-2 text-emerald-700 select-all">
                  petshop@pagamento.com
                </p>
                <p className="text-xs text-gray-400">Pagamento simulado — MVP de demonstração</p>
              </div>
            )}

            {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</p>}

            <div className="flex gap-3">
              <button onClick={() => setStep("address")}
                className="flex-1 border border-gray-300 py-3 rounded-full font-medium text-gray-700 hover:border-emerald-400 transition">
                ← Voltar
              </button>
              <button onClick={handleOrder} disabled={loading || (payment.method !== "pix" && (!payment.cardName || !payment.cardNumber || !payment.expiry || !payment.cvv))}
                className="flex-1 bg-emerald-600 text-white py-3 rounded-full font-semibold hover:bg-emerald-700 disabled:opacity-50 transition">
                {loading ? "Processando..." : "Confirmar Pedido"}
              </button>
            </div>
          </div>
        )}

        {/* Resumo lateral */}
        <div className="space-y-4">
          <Summary />
          {step === "payment" && (
            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-500 space-y-1">
              <p className="font-medium text-gray-700">Entrega em:</p>
              <p>{address.street}, {address.number}{address.complement ? ` — ${address.complement}` : ""}</p>
              <p>{address.neighborhood} — {address.city}/{address.state}</p>
              <p>CEP: {address.zipCode}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
