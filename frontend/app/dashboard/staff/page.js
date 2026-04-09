import { redirect } from "next/navigation";

// Redirect /dashboard/staff → /dashboard/staff/dashboard
export default function StaffIndexPage() {
  redirect("/dashboard/staff/dashboard");
}
