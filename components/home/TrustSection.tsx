"use client";

export function TrustSection() {
    return (
        <section className="py-24 px-6 bg-white border-y border-gray-100 relative">
            <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-16">
                <div className="max-w-2xl">
                    <span className="text-brand-gold-bright text-xs uppercase tracking-[0.4em] font-extrabold mb-6 block">The VVIP Promise</span>
                    <h2 className="text-4xl md:text-5xl font-serif font-extrabold mb-8 text-brand-olive-dark leading-tight">Built on Transparency <br /> & Trust</h2>
                    <p className="text-gray-600 text-lg leading-relaxed font-medium">
                        Whether it's the "Pay-What-You-Spend" electricity model at Olive Stayz or the gourmet consistency of our Bakery, we operate with a commitment to integrity.
                    </p>
                </div>
                <div className="flex flex-wrap gap-12 w-full md:w-auto justify-center md:justify-start">
                    <div className="bg-brand-soft-gray p-8 rounded-[2rem] min-w-[160px] text-center border border-gray-100 shadow-sm">
                        <div className="text-5xl font-serif font-extrabold text-brand-olive-dark mb-2">24/7</div>
                        <p className="text-brand-gold-bright text-[10px] uppercase font-black tracking-widest">Support & Backup</p>
                    </div>
                    <div className="bg-brand-soft-gray p-8 rounded-[2rem] min-w-[160px] text-center border border-gray-100 shadow-sm">
                        <div className="text-5xl font-serif font-extrabold text-brand-olive-dark mb-2">0%</div>
                        <p className="text-brand-gold-bright text-[10px] uppercase font-black tracking-widest">Hidden Charges</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
