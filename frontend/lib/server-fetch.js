import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export async function serverFetch(endpoint, options = {}) {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join("; ");
  
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (allCookies) {
    headers["Cookie"] = allCookies;
  }

  const url = `${BASE_URL}${endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers,
    cache: "no-store", // Ensure real-time dashboard data
  });

  if (!res.ok) {
    if (res.status === 401) {
      // Hard redirect to login if server fetch catches an unauthenticated state
      redirect("/login");
    }
    throw new Error(`Server fetch failed with status ${res.status}`);
  }

  const data = await res.json();
  return data;
}
