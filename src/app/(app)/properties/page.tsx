import { redirect } from "next/navigation";

// The dashboard already lists properties; keep this route as a friendly alias.
export default function PropertiesIndexPage() {
  redirect("/");
}
