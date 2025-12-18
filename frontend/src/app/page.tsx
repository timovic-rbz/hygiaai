import { redirect } from "next/navigation";

/**
 * Root page - redirects to /dashboard
 * 
 * Primary redirect is handled by next.config.js (faster, HTTP-level)
 * This serves as a fallback for edge cases.
 */
export default function RootPage(): never {
  redirect("/dashboard");
}
