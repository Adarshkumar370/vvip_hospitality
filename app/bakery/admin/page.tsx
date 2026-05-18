import { verifySession } from "@/app/bakery/actions";
import AdminPageClient from "./AdminPageClient";

export default async function BakeryAdminPage() {
    await verifySession();
    return <AdminPageClient />;
}
