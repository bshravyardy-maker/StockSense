"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/ui/AuthCard";
import { Field } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { signUp } from "@/app/actions/auth";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError("");
    setLoading(true);
    const result = await signUp(formData);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <AuthCard title="Create account" subtitle="Set up your StockSense workspace.">
      <form action={handleSubmit}>
        <Field label="Full name" name="name" type="text" required />
        <Field label="Login ID (email or phone)" name="loginId" type="text" required />
        <Field label="Password (min 8 characters)" name="password" type="password" minLength={8} required />
        {error && <p className="text-sm text-[var(--color-red)] mb-4">{error}</p>}
        <Button type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </Button>
      </form>
      <div className="mt-4 text-center text-sm">
        Already have an account? <Link href="/login" className="text-[var(--color-amber)]">Log in</Link>
      </div>
      <div className="mt-6 pt-4 border-t border-[var(--color-line)] flex justify-center space-x-4 text-xs text-[var(--color-muted)]">
        <Link href="/privacy" className="hover:text-[var(--color-ink)]">Privacy Policy</Link>
        <Link href="/terms" className="hover:text-[var(--color-ink)]">Terms of Service</Link>
      </div>
    </AuthCard>
  );
}
