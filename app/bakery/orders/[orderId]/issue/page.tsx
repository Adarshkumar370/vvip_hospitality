import { getOrderIssueContext, getUserSession } from "@/app/bakery/actions";
import { redirect } from "next/navigation";
import OrderIssueClient from "./OrderIssueClient";

export const dynamic = "force-dynamic";

export default async function OrderIssuePage({ params }: { params: Promise<{ orderId: string }> }) {
    const user = await getUserSession();
    const { orderId } = await params;

    if (!user) {
        redirect(`/bakery?login=1&next=${encodeURIComponent(`/bakery/orders/${orderId}/issue`)}`);
    }

    const orderRes = await getOrderIssueContext(orderId);
    if (!orderRes.success) {
        return (
            <div className="min-h-screen bg-brand-soft-gray px-4 pt-32">
                <div className="mx-auto max-w-2xl rounded-[2rem] bg-white p-8 text-center shadow-premium">
                    <h1 className="mb-3 text-2xl font-serif font-black text-brand-olive-dark">Order not found</h1>
                    <p className="text-sm font-bold text-gray-500">{orderRes.error}</p>
                </div>
            </div>
        );
    }

    return <OrderIssueClient order={orderRes.order} />;
}
