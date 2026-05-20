import { getUserSession, getProductsForUser, getCategories, getUserBillingSummary } from "@/app/bakery/actions";
import { redirect } from "next/navigation";
import OrderClient from "./OrderClient";

export const dynamic = "force-dynamic";

export default async function BakeryOrderPage() {
    // 1. Authenticate on server via cookies
    const user = await getUserSession();
    
    if (!user) {
        redirect("/bakery?login=1&next=/bakery/order");
    }

    // 2. Fetch data (cached for 300s / 5 min in actions.ts)
    const [prodRes, catRes, billingRes] = await Promise.all([
        getProductsForUser(user.id),
        getCategories(),
        getUserBillingSummary(user.id),
    ]);

    if (!prodRes.success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-brand-soft-gray">
                <p className="text-brand-olive-dark font-black">Failed to load catalog. Please try again later.</p>
            </div>
        );
    }

    const products = prodRes.products || [];
    const categoryNames =
        "categories" in catRes ? ((catRes.categories as unknown as Array<{ name: string }>).map((category) => category.name)) : [];
    const categories = ["All", ...categoryNames];

    // 3. Render client component with pre-fetched, cached data
    return (
        <OrderClient 
            initialProducts={products} 
            initialCategories={categories} 
            user={user} 
            billingSummary={billingRes.success ? billingRes.summary : null}
        />
    );
}
