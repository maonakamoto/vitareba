import { redirect } from "next/navigation";
import { ADMIN_ROUTES } from "@/lib/config/routes";

export default function AdminPage() {
  redirect(ADMIN_ROUTES.patients);
}
