import { X, Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../contexts/AuthContext";

export function CartDrawer() {
  const { items, isOpen, closeCart, updateItem, removeItem, totalPrice, totalItems } = useCart();
  const { user } = useAuth();

  const shipping = totalPrice >= 150 ? 0 : 19.9;
  const total = totalPrice + shipping;

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={closeCart} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-600" />
            Meu Carrinho
            {totalItems > 0 && (
              <span className="text-sm font-normal text-gray-500">({totalItems} {totalItems === 1 ? "item" : "itens"})</span>
            )}
          </h2>
          <button onClick={closeCart} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400">
              <ShoppingBag className="w-16 h-16 opacity-30" />
              <p className="text-lg font-medium">Carrinho vazio</p>
              <p className="text-sm text-center">Adicione produtos incríveis para seus pets!</p>
              <Link to="/catalogo" onClick={closeCart} className="bg-emerald-600 text-white px-6 py-2 rounded-full hover:bg-emerald-700 text-sm font-medium">
                Ver Produtos
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-3 bg-gray-50 rounded-xl p-3">
                <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                  {item.productImageUrl ? (
                    <img src={item.productImageUrl} alt={item.productName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">🐾</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.productName}</p>
                  <p className="text-emerald-600 font-bold text-sm">
                    R$ {(parseFloat(item.productPrice) * item.quantity).toFixed(2).replace(".", ",")}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={() => item.quantity > 1 ? updateItem(item.id, item.quantity - 1) : removeItem(item.id)}
                      className="w-6 h-6 rounded-full border flex items-center justify-center hover:bg-gray-200"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateItem(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.productStock}
                      className="w-6 h-6 rounded-full border flex items-center justify-center hover:bg-gray-200 disabled:opacity-40"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 self-start">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t p-4 space-y-3">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>R$ {totalPrice.toFixed(2).replace(".", ",")}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Frete</span>
                <span className={shipping === 0 ? "text-emerald-600 font-medium" : ""}>
                  {shipping === 0 ? "Grátis 🎉" : `R$ ${shipping.toFixed(2).replace(".", ",")}`}
                </span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-gray-400">
                  Frete grátis em compras acima de R$ 150,00
                </p>
              )}
              <div className="flex justify-between font-bold text-base pt-1 border-t">
                <span>Total</span>
                <span>R$ {total.toFixed(2).replace(".", ",")}</span>
              </div>
            </div>
            {user ? (
              <Link
                to="/checkout"
                onClick={closeCart}
                className="block w-full bg-emerald-600 text-white text-center py-3 rounded-full font-medium hover:bg-emerald-700"
              >
                Finalizar Compra
              </Link>
            ) : (
              <Link
                to="/login"
                onClick={closeCart}
                className="block w-full bg-emerald-600 text-white text-center py-3 rounded-full font-medium hover:bg-emerald-700"
              >
                Entrar para Finalizar
              </Link>
            )}
          </div>
        )}
      </div>
    </>
  );
}
