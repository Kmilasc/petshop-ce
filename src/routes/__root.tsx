import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router";
import { Header } from "../components/Header";
import { CartDrawer } from "../components/CartDrawer";
import { AuthProvider } from "../contexts/AuthContext";
import { CartProvider } from "../contexts/CartContext";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "PetShop — Tudo para o seu pet" },
      { name: "description", content: "O melhor pet shop online. Produtos de qualidade para cães, gatos, pássaros e muito mais." },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body className="bg-gray-50 font-sans antialiased">
        <AuthProvider>
          <CartProvider>
            <Header />
            <CartDrawer />
            <main>{children}</main>
            <footer className="mt-16 bg-gray-900 text-gray-400 py-10">
              <div className="max-w-7xl mx-auto px-4 text-center space-y-2">
                <p className="text-white font-bold text-lg">🐾 PetShop</p>
                <p className="text-sm">Tudo para o bem-estar do seu animal de estimação</p>
                <p className="text-xs mt-4">© {new Date().getFullYear()} PetShop. Todos os direitos reservados.</p>
              </div>
            </footer>
          </CartProvider>
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}
