"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/ui/AuthCard";
import { Field } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { requestOtp, verifyOtp, resetPassword } from "@/app/actions/auth";
import Link from "next/link";

type Stage = "request" | "verify" | "reset";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("request");
  const [loginId, setLoginId] = useState("");
  const [resetId, setResetId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRequest(formData: FormData) {
    setError(""); setLoading(true);
    const id = String(formData.get("loginId") ?? "");
    setLoginId(id);
    await requestOtp(formData);
    setLoading(false);
    setStage("verify");
  }

  async function handleVerify(formData: FormData) {
    setError(""); setLoading(true);
    formData.set("loginId", loginId);
    const result = await verifyOtp(formData);
    setLoading(false);
    if (!result.ok) { setError(result.error); return; }
    setResetId(result.resetId!);
    setStage("reset");
  }

  async function handleReset(formData: FormData) {
    setError(""); setLoading(true);
    formData.set("resetId", resetId);
    const result = await resetPassword(formData);
    setLoading(false);
    if (!result.ok) { setError(result.error); return; }
    router.push("/login");
  }

  if (stage === "request") {
    return (
      <AuthCard title="Reset password" subtitle="We'll send a one-time code to your login ID.">
        <form action={handleRequest}>
          <Field label="Login ID (email or phone)" name="loginId" type="text" required />
          <Button type="submit" disabled={loading}>{loading ? "Sending..." : "Send code"}</Button>
        </form>
        <div className="mt-4 text-center text-sm">
          <Link href="/login" className="text-[var(--color-amber)]">Back to login</Link>
        </div>
      </AuthCard>
    );
  }

  if (stage === "verify") {
    return (
      <AuthCard title="Enter code" subtitle={`A 6-digit code was sent for ${loginId}. Check the server console.`}>
        <form action={handleVerify}>
          <Field label="6-digit code" name="code" type="text" maxLength={6} required />
          {error && <p className="text-sm text-[var(--color-red)] mb-4">{error}</p>}
          <Button type="submit" disabled={loading}>{loading ? "Verifying..." : "Verify code"}</Button>
        </form>
        <button
          onClick={() => setStage("request")}
          className="mt-4 text-sm text-[var(--color-amber)] block mx-auto"
        >
          Request a new code
        </button>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Set new password" subtitle="Choose a new password for your account.">
      <form action={handleReset}>
        <Field label="New password (min 8 characters)" name="newPassword" type="password" minLength={8} required />
        {error && <p className="text-sm text-[var(--color-red)] mb-4">{error}</p>}
        <Button type="submit" disabled={loading}>{loading ? "Updating..." : "Update password & log in"}</Button>
      </form>
    </AuthCard>
  );
}
