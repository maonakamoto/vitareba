import { redirect } from "next/navigation";

// Middleware handles /→/de redirect for locale routing.
// This is a safety-net fallback only.
export default function Root() {
  redirect("/de");
}
