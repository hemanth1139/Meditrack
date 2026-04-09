import { cookies } from "next/headers";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export async function serverFetch(endpoint, options = {}) {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll().map((c) => `${c.name}=${c.value}`).join("; ");

  const defaultHeaders = {
    "Content-Type": "application/json",
    ...(allCookies ? { Cookie: allCookies } : {}),
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    // We can use next: { revalidate: X } for Next.js 15 cache
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${endpoint} (Status: ${res.status})`);
  }

  return res.json();
}
