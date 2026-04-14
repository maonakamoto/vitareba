import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "patient" | "admin";
      emailVerified: Date | null;
    } & DefaultSession["user"];
  }
}
