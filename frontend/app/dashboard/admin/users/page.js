import UsersTable from "@/components/admin/UsersTable";
import { serverFetch } from "@/lib/serverApi";

export default async function AdminUsersPage() {
  const [usersResponse, hospitalsResponse] = await Promise.all([
    serverFetch("/users/?limit=10").catch(() => null),
    serverFetch("/hospitals/").catch(() => null),
  ]);

  const initialUsers = usersResponse?.data?.data || [];
  const initialHospitals = Array.isArray(hospitalsResponse?.data) ? hospitalsResponse.data : hospitalsResponse?.data?.data || [];

  return <UsersTable initialUsers={initialUsers} initialHospitals={initialHospitals} />;
}
