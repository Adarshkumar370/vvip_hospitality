import Link from "next/link";
import { User as UserIcon } from "lucide-react";

export default function BakeryFooter() {
    return (
        <footer className="border-t border-brand-olive-dark/10 py-8 px-4 md:px-6">
            <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
                <p className="text-[11px] text-brand-olive-dark/50 font-black uppercase tracking-widest">
                    &copy; {new Date().getFullYear()} Swiss Affaire - The Bake Studio
                </p>
                <Link
                    href="/bakery/staff"
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-olive-dark/50 hover:text-brand-olive-dark transition-colors"
                    aria-label="Staff Login"
                >
                    <UserIcon size={14} aria-hidden="true" />
                    Staff Login
                </Link>
            </div>
        </footer>
    );
}
