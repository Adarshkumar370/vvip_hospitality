import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Page Not Found",
    robots: { index: false, follow: false },
};

export default function NotFound() {
    return (
        <div className="min-h-[70vh] flex items-center justify-center bg-white px-6 py-24">
            <div className="text-center max-w-lg">
                <p className="text-sm font-black uppercase tracking-[0.3em] text-brand-gold-bright mb-4">
                    404 Error
                </p>
                <h1 className="text-4xl md:text-5xl font-serif font-black text-brand-olive-dark mb-6">
                    Page Not Found
                </h1>
                <p className="text-gray-500 mb-10">
                    The page you&apos;re looking for doesn&apos;t exist or may have moved.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
                    <Link
                        href="/"
                        className="bg-brand-olive-dark text-white px-8 py-4 rounded-full font-black text-sm uppercase tracking-widest hover:bg-brand-gold-bright transition-all"
                    >
                        Back to Home
                    </Link>
                    <Link
                        href="/olive-stayz"
                        className="text-brand-olive-dark border border-gray-200 px-8 py-4 rounded-full font-black text-sm uppercase tracking-widest hover:border-brand-gold-bright hover:text-brand-gold-bright transition-all"
                    >
                        Olive Stayz
                    </Link>
                    <Link
                        href="/bakery"
                        className="text-brand-olive-dark border border-gray-200 px-8 py-4 rounded-full font-black text-sm uppercase tracking-widest hover:border-brand-gold-bright hover:text-brand-gold-bright transition-all"
                    >
                        The Bake Studio
                    </Link>
                </div>
            </div>
        </div>
    );
}
