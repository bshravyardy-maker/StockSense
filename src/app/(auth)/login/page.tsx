"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AuthCard } from "@/components/ui/AuthCard";
import { Field } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", { loginId, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Incorrect login ID or password.");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <AuthCard title="StockSense" subtitle="Log in to your inventory workspace.">
      <form onSubmit={handleSubmit}>
        <Field
          label="Login ID (email or phone)"
          type="text"
          value={loginId}
          onChange={(e) => setLoginId(e.target.value)}
          required
        />
        <Field
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-sm text-[var(--color-red)] mb-4">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Log in"}
        </Button>
      </form>
      <div className="mt-4 flex justify-between text-sm">
        <Link href="/reset-password" className="text-[var(--color-amber)]">Forgot password?</Link>
        <Link href="/signup" className="text-[var(--color-amber)]">Sign up</Link>
      </div>
      <div className="mt-6 pt-4 border-t border-[var(--color-line)] flex justify-center space-x-4 text-xs text-[var(--color-muted)]">
        <Link href="/privacy" className="hover:text-[var(--color-ink)]">Privacy Policy</Link>
        <Link href="/terms" className="hover:text-[var(--color-ink)]">Terms of Service</Link>
      </div>
    </AuthCard>
  );
}
