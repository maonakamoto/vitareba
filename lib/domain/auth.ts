import { z } from "zod";
import { getAdminEmails } from "@/lib/config/company";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export function resolveRole(email: string): "patient" | "admin" {
  const adminEmails = getAdminEmails().map((e) => e.toLowerCase());
  return adminEmails.includes(email.toLowerCase()) ? "admin" : "patient";
}
