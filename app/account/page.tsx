import { headers } from "next/headers";
import AccountClient from "./AccountClient";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const isAdmin = headers().get("x-is-admin") === "1";
  return <AccountClient isAdmin={isAdmin} />;
}
