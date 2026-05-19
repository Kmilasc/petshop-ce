import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PawPrint, ChevronRight, ChevronLeft } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export const Route = createFileRoute("/registro")({ component: RegisterPage });

// Formata CPF enquanto o usuário digita: 000.000.000-00
function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}

// Formata CEP enquanto o usuário digita: 00000-000
function formatZip(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  return digits.replace(/(\d{5})(\d)/, "$1-$2");
}

function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<"account" | "address">("account");
  const [loading, setLoading] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [error, setError] = useState("");

  const [account, setAccount] = useState({
    name: "", email: "", cpf: "", phone: "", password: "", confirm: "",
  });

  const [address, setAddress] = useState({
    zipCode: "", street: "", number: "", complement: "",
    neighborhood: "", city: "", state: "",
  });

  const setAcc = (k: keyof typeof account) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value;
    if (k === "cpf") v = formatCPF(v);
    setAccount((f) => ({ ...f, [k]: v }));
  };

  const setAddr = (k: keyof typeof address) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value;
    if (k === "zipCode") v = formatZip(v);
    setAddress((a) => ({ ...a, [k]: v }));
  };

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
    } catch {
      // ignora erros de rede no CEP
    } finally {
      setLoadingCep(false);
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (account.password !== account.confirm) { setError("Senhas não coincidem"); return; }
    if (account.password.length < 6) { setError("Senha deve ter pelo menos 6 caracteres"); return; }
    setError("");
    setStep("address");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const hasAddress = address.street && address.city && address.zipCode;
      await register(account.name, account.email, account.password, account.cpf, account.phone, hasAddress ? address : undefined);
      navigate({ to: "/" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm p-8 space-y-6">
        <div className="text-center">
          <PawPrint className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
          <h1 className="text-2xl font-bold text-gray-900">Criar conta</h1>
          <p className="text-gray-500 text-sm mt-1">Junte-se à família PetShop</p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2">
          {["Dados pessoais", "Endereço"].map((label, i) => (
            <div key={label} className="flex items-center flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                (i === 0 && step === "account") || (i === 1 && step === "address")
                  ? "bg-emerald-600 text-white"
                  : i === 0 && step === "address"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-gray-100 text-gray-400"
              }`}>{i + 1}</div>
              <span className="ml-2 text-xs text-gray-500 truncate">{label}</span>
              {i === 0 && <div className="flex-1 h-px bg-gray-200 mx-2" />}
            </div>
          ))}
        </div>

        {/* Step 1: Dados pessoais */}
        {step === "account" && (
          <form onSubmit={handleNextStep} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo *</label>
              <input type="text" value={account.name} onChange={setAcc("name")} required placeholder="João Silva"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail *</label>
                <input type="email" value={account.email} onChange={setAcc("email")} required placeholder="seu@email.com"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CPF *</label>
                <input type="text" value={account.cpf} onChange={setAcc("cpf")} required placeholder="000.000.000-00" inputMode="numeric"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input type="tel" value={account.phone} onChange={setAcc("phone")} placeholder="(11) 99999-9999"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha *</label>
                <input type="password" value={account.password} onChange={setAcc("password")} required placeholder="Mín. 6 caracteres"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar senha *</label>
                <input type="password" value={account.confirm} onChange={setAcc("confirm")} required placeholder="Repita a senha"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</p>}

            <button type="submit"
              className="w-full bg-emerald-600 text-white py-3 rounded-full font-semibold hover:bg-emerald-700 transition flex items-center justify-center gap-2">
              Próximo <ChevronRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Step 2: Endereço */}
        {step === "address" && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-gray-500">Endereço de entrega (opcional — pode preencher no checkout)</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                <input type="text" value={address.zipCode} onChange={setAddr("zipCode")} onBlur={fetchCEP}
                  placeholder="00000-000" inputMode="numeric"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                {loadingCep && <p className="text-xs text-gray-400 mt-1">Buscando endereço...</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                <input type="text" value={address.number} onChange={setAddr("number")} placeholder="123"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Rua / Avenida</label>
                <input type="text" value={address.street} onChange={setAddr("street")} placeholder="Rua das Flores"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
                <input type="text" value={address.complement} onChange={setAddr("complement")} placeholder="Apto 4B"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                <input type="text" value={address.neighborhood} onChange={setAddr("neighborhood")} placeholder="Centro"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                <input type="text" value={address.city} onChange={setAddr("city")} placeholder="São Paulo"
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado (UF)</label>
                <input type="text" value={address.state} onChange={setAddr("state")} placeholder="SP" maxLength={2}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</p>}

            <div className="flex gap-3">
              <button type="button" onClick={() => setStep("account")}
                className="flex-1 border border-gray-300 py-3 rounded-full font-medium text-gray-700 hover:border-emerald-400 transition flex items-center justify-center gap-2">
                <ChevronLeft className="w-4 h-4" /> Voltar
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 bg-emerald-600 text-white py-3 rounded-full font-semibold hover:bg-emerald-700 disabled:opacity-60 transition">
                {loading ? "Criando conta..." : "Criar conta"}
              </button>
            </div>

            <button type="button" onClick={handleSubmit} disabled={loading}
              className="w-full text-sm text-gray-400 hover:text-gray-600 text-center">
              Pular endereço e criar conta
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500">
          Já tem conta?{" "}
          <Link to="/login" className="text-emerald-600 font-medium hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
