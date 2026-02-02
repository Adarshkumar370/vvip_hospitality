"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FAQItem {
    question: string;
    answer: string;
}

interface FAQSectionProps {
    items: FAQItem[];
}

export function FAQSection({ items }: FAQSectionProps) {
    return (
        <section className="py-24 px-6 max-w-4xl mx-auto w-full">
            <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-serif font-black text-brand-olive-dark mb-4">
                    Frequently Asked Questions
                </h2>
                <p className="text-gray-500 font-medium">
                    Everything you need to know about your stay at Olive Stayz.
                </p>
            </div>

            <Accordion.Root
                type="single"
                collapsible
                className="space-y-4"
            >
                {items.map((item, idx) => (
                    <Accordion.Item
                        key={idx}
                        value={`item-${idx}`}
                        className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    >
                        <Accordion.Header>
                            <Accordion.Trigger className="flex w-full items-center justify-between px-8 py-6 text-left group">
                                <span className="text-lg font-bold text-brand-olive-dark group-data-[state=open]:text-brand-gold-bright transition-colors">
                                    {item.question}
                                </span>
                                <ChevronDown className="text-gray-400 group-data-[state=open]:rotate-180 transition-transform duration-300" size={20} />
                            </Accordion.Trigger>
                        </Accordion.Header>
                        <Accordion.Content className="overflow-hidden data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp">
                            <div className="px-8 pb-8 text-gray-600 font-medium leading-relaxed">
                                {item.answer}
                            </div>
                        </Accordion.Content>
                    </Accordion.Item>
                ))}
            </Accordion.Root>
        </section>
    );
}
