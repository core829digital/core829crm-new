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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-950">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-xl p-8">
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
