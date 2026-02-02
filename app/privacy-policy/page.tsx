"use client";

import { motion } from "framer-motion";

export default function PrivacyPolicy() {
    return (
        <div className="bg-white min-h-screen py-24 px-6">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-4xl md:text-5xl font-serif font-black text-brand-olive-dark mb-12">
                        Privacy Policy
                    </h1>

                    <div className="prose prose-lg max-w-none text-gray-600 space-y-8 font-medium leading-relaxed">
                        <section>
                            <h2 className="text-2xl font-serif font-bold text-brand-olive-dark mb-4 italic">1. Introduction</h2>
                            <p>
                                Welcome to VVIP Hospitality. We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about our policy, or our practices with regards to your personal information, please contact us.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-serif font-bold text-brand-olive-dark mb-4 italic">2. Information We Collect</h2>
                            <p>
                                We collect personal information that you voluntarily provide to us when expressing an interest in obtaining information about us or our services, such as your name, contact information, and payment details.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-serif font-bold text-brand-olive-dark mb-4 italic">3. How We Use Your Information</h2>
                            <p>
                                We use personal information collected via our website for a variety of business purposes, including to provide services to you, to send you administrative information, and for legal and compliance reasons.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-serif font-bold text-brand-olive-dark mb-4 italic">4. Disclosure of Your Information</h2>
                            <p>
                                We only share information with your consent, to comply with laws, to provide you with services, to protect your rights, or to fulfill business obligations.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-serif font-bold text-brand-olive-dark mb-4 italic">5. Data Security</h2>
                            <p>
                                We aim to protect your personal information through a system of organizational and technical security measures designed to safeguard your information.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-serif font-bold text-brand-olive-dark mb-4 italic">6. Contact Us</h2>
                            <p>
                                If you have questions or comments about this policy, you may email us or contact us via our WhatsApp support.
                            </p>
                        </section>

                        <p className="text-sm text-gray-400 pt-12">
                            Last Updated: February 3, 2026
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
