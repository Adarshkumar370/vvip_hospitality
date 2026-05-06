import { getUserSession, getProductsForUser, getCategories } from "@/app/bakery/actions";
import { redirect } from "next/navigation";
import OrderClient from "./OrderClient";

export const dynamic = "force-dynamic";

export default async function BakeryOrderPage() {
    // 1. Authenticate on server via cookies
    const user = await getUserSession();
    
    if (!user) {
        redirect("/bakery");
    }

    // 2. Fetch data (cached for 300s / 5 min in actions.ts)
    const [prodRes, catRes] = await Promise.all([
        getProductsForUser(user.id),
        getCategories()
    ]);

    if (!prodRes.success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-soft-gray">
                <p className="text-brand-olive-dark font-black">Failed to load catalog. Please try again later.</p>
            </div>
        );
    }

    const products = prodRes.products || [];
    const categories = ["All", ...(catRes.categories?.map((c: any) => c.name) || [])];

    // 3. Render client component with pre-fetched, cached data
    return (
        <OrderClient 
            initialProducts={products} 
            initialCategories={categories} 
            user={user} 
        />
    );
}
