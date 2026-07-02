import { Loader2 } from "lucide-react";

export default function AdminLoading() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-brand-soft-gray">
            <Loader2 className="mb-4 h-12 w-12 animate-spin text-brand-gold-bright" />
            <p className="text-xs font-black uppercase tracking-widest text-brand-olive-dark">Loading admin console...</p>
        </div>
    );
}
