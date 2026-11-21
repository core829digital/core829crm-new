"use client";

import { GlassScene, GLASS } from "@/components/ui/LiquidGlass";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { Loader2, LogIn } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await signIn(userId.trim(), password);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.push("/");
    } catch {
      setError("Invalid ID or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-zinc-950">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-center mb-6">
            <Image src="/brand/app-icon.svg" alt="Core829" width={64} height={64} priority unoptimized className="h-16 w-16 rounded-[22%]" />
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

            <GlassScene className="overflow-hidden rounded-full p-1.5">
              <button
                {...GLASS}
                type="submit"
                disabled={loading || !userId || !password}
                className="w-full py-2.5 rounded-full text-sm font-medium text-[#141416] disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </GlassScene>
          </form>

        </div>
      </div>
    </main>
  );
}
