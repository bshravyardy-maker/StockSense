"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn, auth } from "@/auth";
import { revalidatePath } from "next/cache";

const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  loginId: z.string().min(3, "Enter a valid email or phone number"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["MANAGER", "STAFF"]).optional().default("MANAGER"),
});

export type ActionResult = { ok: true } | { ok: false; error: string };

export async function signUp(formData: FormData): Promise<ActionResult> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    loginId: formData.get("loginId"),
    password: formData.get("password"),
    role: formData.get("role") || "MANAGER",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { name, loginId, password, role } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { loginId } });
  if (existing) {
    return { ok: false, error: "An account with this login ID already exists" };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { name, loginId, passwordHash, role: role as "MANAGER" | "STAFF" },
  });

  await signIn("credentials", { loginId, password, redirect: false });
  return { ok: true };
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function requestOtp(formData: FormData): Promise<ActionResult> {
  const loginId = String(formData.get("loginId") ?? "");
  const user = await prisma.user.findUnique({ where: { loginId } });

  // Always report success even if the user doesn't exist, to avoid leaking
  // which login IDs are registered. Only actually create a code if the user exists.
  if (user) {
    const code = generateOtp();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await prisma.passwordReset.create({ data: { userId: user.id, code, expiresAt } });
    console.log(`[OTP] Reset code for ${loginId}: ${code} (expires ${expiresAt.toISOString()})`);
  } else {
    console.log(`[OTP] Reset requested for unknown login ID: ${loginId}`);
  }

  return { ok: true };
}

export async function verifyOtp(formData: FormData): Promise<ActionResult & { resetId?: string }> {
  const loginId = String(formData.get("loginId") ?? "");
  const code = String(formData.get("code") ?? "");

  const user = await prisma.user.findUnique({ where: { loginId } });
  if (!user) return { ok: false, error: "Invalid code" };

  const reset = await prisma.passwordReset.findFirst({
    where: { userId: user.id, code, usedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!reset) return { ok: false, error: "Invalid code" };
  if (reset.expiresAt < new Date()) return { ok: false, error: "This code has expired. Request a new one." };

  return { ok: true, resetId: reset.id };
}

export async function resetPassword(formData: FormData): Promise<ActionResult> {
  const resetId = String(formData.get("resetId") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");

  if (newPassword.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters" };
  }

  const reset = await prisma.passwordReset.findUnique({ where: { id: resetId } });
  if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
    return { ok: false, error: "This reset link is no longer valid. Start over." };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.$transaction([
    prisma.user.update({ where: { id: reset.userId }, data: { passwordHash } }),
    prisma.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
  ]);

  return { ok: true };
}

export async function updateDisplayName(formData: FormData): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "Unauthorized" };
  }

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { ok: false, error: "Display name cannot be empty" };
  }

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name },
    });
    revalidatePath("/profile");
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err.message || "Failed to update profile name" };
  }
}

