import { redirect } from "next/navigation";

// The proxy sends unauthenticated visitors to /login before this runs.
export default function RootPage() {
  redirect("/dashboard");
}
