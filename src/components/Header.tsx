import { Link, useNavigate } from "@tanstack/react-router";
import { ShoppingCart, PawPrint, User, LogOut, Menu, X, Search } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";

export function Header() {
  const { user, logout } = useAuth();
  const { totalItems, openCart } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate({ to: "/catalogo", search: { q: searchQuery } as any });
      setSearchQuery("");
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 text-emerald-600 font-bold text-xl">
            <PawPrint className="w-7 h-7" />
            <span>PetShop</span>
          </Link>

          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar produtos para pets..."
                className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="hidden md:flex items-center gap-3">
                {user.role === "admin" && (
                  <Link to="/admin" className="text-sm text-emerald-600 font-medium hover:underline">
                    Admin
                  </Link>
                )}
                <Link to="/pedidos" className="flex items-center gap-1 text-sm text-gray-700 hover:text-emerald-600">
                  <User className="w-4 h-4" />
                  <span className="max-w-24 truncate">{user.name.split(" ")[0]}</span>
                </Link>
                <button onClick={logout} className="text-gray-500 hover:text-red-500" title="Sair">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login" className="text-sm text-gray-700 hover:text-emerald-600 font-medium">
                  Entrar
                </Link>
                <Link to="/registro" className="text-sm bg-emerald-600 text-white px-3 py-1.5 rounded-full hover:bg-emerald-700 font-medium">
                  Cadastrar
                </Link>
              </div>
            )}

            <button
              onClick={openCart}
              className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100"
            >
              <ShoppingCart className="w-5 h-5 text-gray-700" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {totalItems > 9 ? "9+" : totalItems}
                </span>
              )}
            </button>

            <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <nav className="hidden md:flex gap-6 pb-2 text-sm">
          <Link to="/catalogo" className="text-gray-600 hover:text-emerald-600 font-medium">Todos os Produtos</Link>
          <Link to="/catalogo" search={{ petType: "dog" } as any} className="text-gray-600 hover:text-emerald-600">Cachorros</Link>
          <Link to="/catalogo" search={{ petType: "cat" } as any} className="text-gray-600 hover:text-emerald-600">Gatos</Link>
          <Link to="/catalogo" search={{ petType: "bird" } as any} className="text-gray-600 hover:text-emerald-600">Pássaros</Link>
          <Link to="/catalogo" search={{ petType: "fish" } as any} className="text-gray-600 hover:text-emerald-600">Peixes</Link>
          <Link to="/catalogo" search={{ featured: "true" } as any} className="text-emerald-600 font-medium">Destaques</Link>
        </nav>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t bg-white px-4 py-3 space-y-3">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar produtos..."
              className="w-full pl-4 pr-10 py-2 border rounded-full text-sm focus:outline-none"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Search className="w-4 h-4" />
            </button>
          </form>
          {user ? (
            <>
              <Link to="/pedidos" className="block text-gray-700 py-1" onClick={() => setMenuOpen(false)}>Meus Pedidos</Link>
              {user.role === "admin" && (
                <Link to="/admin" className="block text-emerald-600 py-1" onClick={() => setMenuOpen(false)}>Painel Admin</Link>
              )}
              <button onClick={() => { logout(); setMenuOpen(false); }} className="block text-red-500 py-1">Sair</button>
            </>
          ) : (
            <>
              <Link to="/login" className="block text-gray-700 py-1" onClick={() => setMenuOpen(false)}>Entrar</Link>
              <Link to="/registro" className="block text-emerald-600 py-1 font-medium" onClick={() => setMenuOpen(false)}>Criar conta</Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
