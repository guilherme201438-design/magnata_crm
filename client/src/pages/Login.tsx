import { useState } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { MagnataLogo } from "@/components/MagnataLogo";

export default function Login() {
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/oauth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });

      if (response.ok) {
        // Redirect to dashboard
        navigate("/");
      } else {
        const data = await response.json();
        setError(data.error || "Erro ao fazer login");
      }
    } catch (err) {
      setError("Erro ao conectar com o servidor");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card com borda neon */}
        <div className="border-2 border-purple-500/50 rounded-lg p-8 bg-slate-900/80 backdrop-blur-sm shadow-2xl shadow-purple-500/20">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <MagnataLogo />
          </div>

          {/* Título */}
          <h1 className="text-3xl font-bold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
            MAGNATA CRM
          </h1>
          <p className="text-center text-gray-400 text-sm mb-8">
            Gerenciador de Pacientes e Agendamentos
          </p>

          {/* Formulário */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Usuário
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Digite seu usuário"
                className="w-full px-4 py-3 bg-slate-800 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                className="w-full px-4 py-3 bg-slate-800 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                disabled={loading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/50 hover:shadow-purple-500/75"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg text-center">
            <p className="text-xs text-gray-400 mb-2">Credenciais de Demonstração:</p>
            <p className="text-sm text-gray-300 font-mono">
              <span className="text-purple-400">Usuário:</span> felipe
            </p>
            <p className="text-sm text-gray-300 font-mono">
              <span className="text-purple-400">Senha:</span> mito22
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-xs mt-8">
          © 2026 Magnata do Marketing Digital. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
