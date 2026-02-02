"use client";

import { ShieldAlert, Users, Clock, Ban } from "lucide-react";

interface PropertyRulesProps {
    rules: {
        general: string[];
        visitors: string[];
    };
}

export function PropertyRules({ rules }: PropertyRulesProps) {
    return (
        <section className="py-24 px-6 max-w-7xl mx-auto w-full">
            <div className="bg-brand-olive-dark text-white rounded-[4rem] p-12 md:p-20 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold-bright/10 rounded-full blur-3xl -mr-48 -mt-48" />

                <div className="relative z-10 text-white">
                    <h2 className="text-4xl md:text-5xl font-serif font-black mb-12 text-center text-white">
                        Property & Stay Rules
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                        <div>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-brand-gold-bright">
                                    <ShieldAlert size={28} />
                                </div>
                                <h3 className="text-2xl font-serif font-bold text-white">General Policy</h3>
                            </div>
                            <ul className="space-y-4">
                                {rules.general.map((rule, idx) => (
                                    <li key={idx} className="flex items-start gap-4 text-white/80 font-medium">
                                        <div className="w-1.5 h-1.5 rounded-full bg-brand-gold-bright mt-2.5 shrink-0" />
                                        {rule}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-brand-gold-bright">
                                    <Users size={28} />
                                </div>
                                <h3 className="text-2xl font-serif font-bold text-white">Visitor Policy</h3>
                            </div>
                            <ul className="space-y-4">
                                {rules.visitors.map((rule, idx) => (
                                    <li key={idx} className="flex items-start gap-4 text-white/80 font-medium">
                                        <div className="w-1.5 h-1.5 rounded-full bg-brand-gold-bright mt-2.5 shrink-0" />
                                        {rule}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
