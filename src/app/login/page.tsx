"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { useAuth } from "@/components/AuthContext";
import { Loader2, LogIn } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const login = useMutation(api.users.login);
  const { setUser } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login({ userId: userId.trim(), password });
      setUser(user);
      router.push("/");
    } catch {
      setError("Invalid ID or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-zinc-950">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-[1000px] h-[1000px] rounded-full bg-gradient-to-br from-red-500/20 via-red-500/10 to-transparent animate-[spin_30s_linear_infinite]" />
        <div className="absolute -bottom-1/2 -right-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-tl from-zinc-800/40 via-zinc-700/20 to-transparent animate-[spin_40s_linear_infinite_reverse]" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-red-500/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/3 w-[500px] h-[500px] rounded-full bg-zinc-700/20 blur-3xl animate-pulse" style={{ animationDelay: "2s", animationDuration: "6s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-red-500/5 to-zinc-800/5 blur-2xl animate-pulse" style={{ animationDuration: "8s" }} />
      </div>
      <div className="w-full max-w-sm relative">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          <div className="flex justify-center mb-6">
            <div className="bg-black rounded-full p-3 shadow-lg">
              <Image src="/logo-icon.png" alt="Core829" width={32} height={32} priority />
            </div>
          </div>
          <h1 className="text-xl font-bold text-center mb-1">Core829 CRM</h1>
          <p className="text-sm text-zinc-400 text-center mb-6">Sign in with your credentials</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                placeholder="User ID"
                className="w-full border border-zinc-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                autoComplete="username"
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Password"
                className="w-full border border-zinc-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !userId || !password}
              className="w-full bg-black text-white py-2.5 rounded-lg text-sm font-medium hover:bg-zinc-800 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
