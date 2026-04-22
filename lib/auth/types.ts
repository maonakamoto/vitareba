import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/lib/config/auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      emailVerified: Date | null;
    } & DefaultSession["user"];
  }
}
