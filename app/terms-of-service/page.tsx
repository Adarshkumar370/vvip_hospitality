"use client";

import { motion } from "framer-motion";

export default function TermsOfService() {
    return (
        <div className="bg-white min-h-screen py-24 px-6">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <h1 className="text-4xl md:text-5xl font-serif font-black text-brand-olive-dark mb-12">
                        Terms of Service
                    </h1>

                    <div className="prose prose-lg max-w-none text-gray-600 space-y-8 font-medium leading-relaxed">
                        <section>
                            <h2 className="text-2xl font-serif font-bold text-brand-olive-dark mb-4 italic">1. Agreement to Terms</h2>
                            <p>
                                By accessing or using our services, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-serif font-bold text-brand-olive-dark mb-4 italic">2. Use of Services</h2>
                            <p>
                                Our services, including Olive Stayz and VVIP Bakery, are provided for your personal or business use as specified in our agreements. Any unauthorized use of our services is strictly prohibited.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-serif font-bold text-brand-olive-dark mb-4 italic">3. Booking & Payments</h2>
                            <p>
                                Bookings made through VVIP Hospitality are subject to availability. Payments must be made according to the agreed schedule. For Olive Stayz, electricity is charged based on actual consumption via individual meters.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-serif font-bold text-brand-olive-dark mb-4 italic">4. Cancellations & Refunds</h2>
                            <p>
                                Please refer to your specific booking agreement for details on cancellation policies and refund eligibility.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-serif font-bold text-brand-olive-dark mb-4 italic">5. Limitation of Liability</h2>
                            <p>
                                VVIP Hospitality shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the services.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-serif font-bold text-brand-olive-dark mb-4 italic">6. Governing Law</h2>
                            <p>
                                These Terms shall be governed and construed in accordance with the laws of India, without regard to its conflict of law provisions.
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
