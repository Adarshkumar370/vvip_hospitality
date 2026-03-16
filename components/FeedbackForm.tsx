"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Star, User, Hash, Calendar, Hotel, CheckCircle2 } from "lucide-react";

type RatingOption = "Excellent" | "Good" | "Average" | "Poor";
type YesNoOption = "Yes" | "Maybe" | "No";

interface FeedbackData {
    hotelName: string;
    roomNumber: string;
    guestName: string;
    checkInDate: string;
    checkOutDate: string;
    bookingMethod: string;
    bookingMethodOther: string;
    purposeOfVisit: string;
    purposeOfVisitOther: string;
    cleanlinessRoom: RatingOption | "";
    cleanlinessBathroom: RatingOption | "";
    comfortBed: RatingOption | "";
    roomFacilities: RatingOption | "";
    bathroomFacilities: RatingOption | "";
    wifi: RatingOption | "";
    noiseLevels: RatingOption | "";
    safety: RatingOption | "";
    staffBehavior: RatingOption | "";
    checkInSpeed: RatingOption | "";
    maintenance: RatingOption | "";
    valueForMoney: RatingOption | "";
    stayAgain: YesNoOption | "";
    recommend: YesNoOption | "";
    likeMost: string;
    improve: string;
    additionalComments: string;
}

import { submitGuestFeedback } from "@/lib/actions/feedback";

const RATING_OPTIONS: RatingOption[] = ["Excellent", "Good", "Average", "Poor"];
const YES_NO_OPTIONS: YesNoOption[] = ["Yes", "Maybe", "No"];

export function FeedbackForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    
    const [formData, setFormData] = useState<FeedbackData>({
        hotelName: "OLIVE STAYZ", // Default as per reception page
        roomNumber: "",
        guestName: "",
        checkInDate: "",
        checkOutDate: "",
        bookingMethod: "",
        bookingMethodOther: "",
        purposeOfVisit: "",
        purposeOfVisitOther: "",
        cleanlinessRoom: "",
        cleanlinessBathroom: "",
        comfortBed: "",
        roomFacilities: "",
        bathroomFacilities: "",
        wifi: "",
        noiseLevels: "",
        safety: "",
        staffBehavior: "",
        checkInSpeed: "",
        maintenance: "",
        valueForMoney: "",
        stayAgain: "",
        recommend: "",
        likeMost: "",
        improve: "",
        additionalComments: "",
    });

    const handleInputChange = (field: keyof FeedbackData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            const result = await submitGuestFeedback(formData);
            
            if (result.success) {
                setIsSubmitted(true);
                setTimeout(() => {
                    setIsSubmitted(false);
                    // Reset form optional to allow new submissions
                    setFormData({
                        hotelName: "OLIVE STAYZ",
                        roomNumber: "",
                        guestName: "",
                        checkInDate: "",
                        checkOutDate: "",
                        bookingMethod: "",
                        bookingMethodOther: "",
                        purposeOfVisit: "",
                        purposeOfVisitOther: "",
                        cleanlinessRoom: "",
                        cleanlinessBathroom: "",
                        comfortBed: "",
                        roomFacilities: "",
                        bathroomFacilities: "",
                        wifi: "",
                        noiseLevels: "",
                        safety: "",
                        staffBehavior: "",
                        checkInSpeed: "",
                        maintenance: "",
                        valueForMoney: "",
                        stayAgain: "",
                        recommend: "",
                        likeMost: "",
                        improve: "",
                        additionalComments: "",
                    });
                }, 5000);
            } else {
                alert(result.error || "Failed to submit feedback");
            }
        } catch (error) {
            console.error("Submission error:", error);
            alert("An unexpected error occurred. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const SectionHeader = ({ title, subtitle }: { title: string, subtitle?: string }) => (
        <div className="mb-8 border-b border-gray-100 pb-4">
            <h3 className="text-2xl font-serif font-black text-brand-olive-dark tracking-tight">{title}</h3>
            {subtitle && <p className="text-sm text-gray-500 font-medium mt-1">{subtitle}</p>}
        </div>
    );

    const RatingQuery = ({ question, field }: { question: string, field: keyof FeedbackData }) => (
        <div className="mb-6 bg-brand-soft-gray/30 p-5 sm:p-6 rounded-2xl border border-gray-50 hover:bg-white hover:shadow-md transition-all">
            <p className="font-bold text-brand-olive-dark mb-4">{question}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {RATING_OPTIONS.map(opt => (
                    <button
                        type="button"
                        key={opt}
                        onClick={() => handleInputChange(field, opt)}
                        className={`py-3 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-bold border transition-all ${
                            formData[field] === opt 
                                ? "bg-brand-olive-dark text-white border-brand-olive-dark shadow-md" 
                                : "bg-white text-gray-600 border-gray-200 hover:border-brand-gold-bright hover:text-brand-gold-bright"
                        }`}
                    >
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    );

    const YesNoQuery = ({ question, field }: { question: string, field: keyof FeedbackData }) => (
        <div className="mb-6 bg-brand-soft-gray/30 p-5 sm:p-6 rounded-2xl border border-gray-50 hover:bg-white hover:shadow-md transition-all">
            <p className="font-bold text-brand-olive-dark mb-4">{question}</p>
            <div className="grid grid-cols-3 gap-3">
                {YES_NO_OPTIONS.map(opt => (
                    <button
                        type="button"
                        key={opt}
                        onClick={() => handleInputChange(field, opt)}
                        className={`py-3 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-bold border transition-all ${
                            formData[field] === opt 
                                ? "bg-brand-olive-dark text-white border-brand-olive-dark shadow-md" 
                                : "bg-white text-gray-600 border-gray-200 hover:border-brand-gold-bright hover:text-brand-gold-bright"
                        }`}
                    >
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    );

    if (isSubmitted) {
        return (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[3rem] p-12 shadow-xl border border-gray-50 text-center relative overflow-hidden h-[600px] flex flex-col items-center justify-center"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-green-50 rounded-full blur-3xl -mr-32 -mt-32" />
                <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                    className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-8 mx-auto relative z-10"
                >
                    <CheckCircle2 size={48} className="text-green-600" />
                </motion.div>
                <h3 className="text-4xl font-serif font-black text-brand-olive-dark mb-4 relative z-10">Thank You!</h3>
                <p className="text-gray-500 font-medium max-w-md mx-auto relative z-10 leading-relaxed text-lg">
                    Your feedback helps us improve our accommodation and services. We hope to welcome you back to OLIVE STAYZ soon.
                </p>
            </motion.div>
        );
    }

    return (
        <div className="bg-white rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-12 shadow-xl border border-gray-50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold-bright/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
            
            <div className="relative z-10 mb-10 text-center sm:text-left">
                <span className="text-brand-gold-bright text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] mb-4 block">We value your thoughts</span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-black text-brand-olive-dark tracking-tight">
                    Guest Feedback
                </h2>
                <p className="text-gray-500 mt-4 font-medium text-sm sm:text-base leading-relaxed max-w-2xl">
                    Please take a few moments to share your experience with us. Every detail helps us craft a more perfect stay for our future guests.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-12">
                {/* 1. Guest Information */}
                <section>
                    <SectionHeader title="Guest Details" subtitle="Help us locate your record" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400">
                                <Hotel size={18} />
                            </div>
                            <input 
                                type="text" required placeholder="Hotel Name" 
                                value={formData.hotelName} onChange={(e) => handleInputChange("hotelName", e.target.value)}
                                className="w-full pl-12 pr-5 py-4 bg-brand-soft-gray/50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-gold-bright/30 focus:border-brand-gold-bright/50 transition-all font-bold text-brand-olive-dark placeholder:font-medium placeholder:text-gray-400"
                            />
                        </div>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400">
                                <Hash size={18} />
                            </div>
                            <input 
                                type="text" required placeholder="Room Number" 
                                value={formData.roomNumber} onChange={(e) => handleInputChange("roomNumber", e.target.value)}
                                className="w-full pl-12 pr-5 py-4 bg-brand-soft-gray/50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-gold-bright/30 focus:border-brand-gold-bright/50 transition-all font-bold text-brand-olive-dark placeholder:font-medium placeholder:text-gray-400"
                            />
                        </div>
                        <div className="relative group sm:col-span-2">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400">
                                <User size={18} />
                            </div>
                            <input 
                                type="text" placeholder="Guest Name (Optional)" 
                                value={formData.guestName} onChange={(e) => handleInputChange("guestName", e.target.value)}
                                className="w-full pl-12 pr-5 py-4 bg-brand-soft-gray/50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-gold-bright/30 focus:border-brand-gold-bright/50 transition-all font-bold text-brand-olive-dark placeholder:font-medium placeholder:text-gray-400"
                            />
                        </div>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400">
                                <Calendar size={18} />
                            </div>
                            <input 
                                type="date" required 
                                value={formData.checkInDate} onChange={(e) => handleInputChange("checkInDate", e.target.value)}
                                className="w-full pl-12 pr-5 py-4 bg-brand-soft-gray/50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-gold-bright/30 focus:border-brand-gold-bright/50 transition-all font-bold text-brand-olive-dark text-sm sm:text-base placeholder:text-gray-400"
                            />
                            <span className="absolute -top-2 left-4 bg-white px-2 text-[10px] font-black uppercase text-brand-gold-bright tracking-widest hidden sm:block">Check-in</span>
                        </div>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400">
                                <Calendar size={18} />
                            </div>
                            <input 
                                type="date" required 
                                value={formData.checkOutDate} onChange={(e) => handleInputChange("checkOutDate", e.target.value)}
                                className="w-full pl-12 pr-5 py-4 bg-brand-soft-gray/50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-gold-bright/30 focus:border-brand-gold-bright/50 transition-all font-bold text-brand-olive-dark text-sm sm:text-base placeholder:text-gray-400"
                            />
                            <span className="absolute -top-2 left-4 bg-white px-2 text-[10px] font-black uppercase text-brand-gold-bright tracking-widest hidden sm:block">Check-out</span>
                        </div>
                    </div>
                </section>

                {/* 2. Booking & Purpose */}
                <section>
                    <SectionHeader title="Your Visit" />
                    
                    <div className="mb-6">
                        <p className="font-bold text-brand-olive-dark mb-4">1. How did you book your stay?</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {["Walk-in", "Phone reservation", "Website", "Online travel agency (OTA)", "Other"].map(method => (
                                <label key={method} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                                    formData.bookingMethod === method ? "border-brand-olive-dark bg-brand-olive-dark/5" : "border-gray-200 hover:border-brand-gold-bright/50 bg-white"
                                }`}>
                                    <input 
                                        type="radio" name="bookingMethod" value={method} required
                                        checked={formData.bookingMethod === method}
                                        onChange={() => handleInputChange("bookingMethod", method)}
                                        className="w-4 h-4 text-brand-olive-dark accent-brand-olive-dark"
                                    />
                                    <span className="text-sm font-bold text-gray-700">{method}</span>
                                </label>
                            ))}
                        </div>
                        <AnimatePresence>
                            {formData.bookingMethod === "Other" && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                                    <input 
                                        type="text" placeholder="Please specify..." 
                                        required
                                        value={formData.bookingMethodOther} onChange={(e) => handleInputChange("bookingMethodOther", e.target.value)}
                                        className="w-full mt-3 p-4 bg-brand-soft-gray/50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-gold-bright/30"
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="mb-6">
                        <p className="font-bold text-brand-olive-dark mb-4">2. Purpose of visit</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {["Business", "Leisure", "Family visit", "Other"].map(purpose => (
                                <label key={purpose} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                                    formData.purposeOfVisit === purpose ? "border-brand-olive-dark bg-brand-olive-dark/5" : "border-gray-200 hover:border-brand-gold-bright/50 bg-white"
                                }`}>
                                    <input 
                                        type="radio" name="purposeOfVisit" value={purpose} required
                                        checked={formData.purposeOfVisit === purpose}
                                        onChange={() => handleInputChange("purposeOfVisit", purpose)}
                                        className="w-4 h-4 text-brand-olive-dark accent-brand-olive-dark"
                                    />
                                    <span className="text-sm font-bold text-gray-700">{purpose}</span>
                                </label>
                            ))}
                        </div>
                        <AnimatePresence>
                            {formData.purposeOfVisit === "Other" && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                                    <input 
                                        type="text" placeholder="Please specify..." 
                                        required
                                        value={formData.purposeOfVisitOther} onChange={(e) => handleInputChange("purposeOfVisitOther", e.target.value)}
                                        className="w-full mt-3 p-4 bg-brand-soft-gray/50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-gold-bright/30"
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </section>

                {/* 3. Cleanliness */}
                <section>
                    <SectionHeader title="Cleanliness" />
                    <RatingQuery question="3. Cleanliness of the room" field="cleanlinessRoom" />
                    <RatingQuery question="4. Cleanliness of bathroom" field="cleanlinessBathroom" />
                </section>

                {/* 4. Comfort & Facilities */}
                <section>
                    <SectionHeader title="Comfort & Facilities" />
                    <RatingQuery question="5. Comfort of bed and linen" field="comfortBed" />
                    <RatingQuery question="6. Room facilities (lighting, charging points, furniture)" field="roomFacilities" />
                    <RatingQuery question="7. Bathroom facilities (water pressure, hot water availability, fittings)" field="bathroomFacilities" />
                    <RatingQuery question="8. Wi-Fi connectivity in the room" field="wifi" />
                    <RatingQuery question="9. Noise levels / quietness of room" field="noiseLevels" />
                </section>

                {/* 5. Service & Value */}
                <section>
                    <SectionHeader title="Service & Value" />
                    <RatingQuery question="10. Safety and security in the hotel" field="safety" />
                    <RatingQuery question="11. Helpfulness and behaviour of hotel staff" field="staffBehavior" />
                    <RatingQuery question="12. Speed of check-in and check-out process" field="checkInSpeed" />
                    <RatingQuery question="13. Maintenance condition of the room (AC, lights, fittings)" field="maintenance" />
                    <RatingQuery question="14. Value for money" field="valueForMoney" />
                </section>

                {/* 6. Overall Experience */}
                <section>
                    <SectionHeader title="Overall Experience" />
                    <YesNoQuery question="15. Would you stay with us again?" field="stayAgain" />
                    <YesNoQuery question="16. Would you recommend our hotel to others?" field="recommend" />
                </section>

                {/* 7. Final Thoughts */}
                <section>
                    <SectionHeader title="Final Thoughts" />
                    <div className="space-y-6">
                        <div>
                            <p className="font-bold text-brand-olive-dark mb-3">17. What did you like most about your stay?</p>
                            <textarea 
                                rows={3}
                                value={formData.likeMost} onChange={(e) => handleInputChange("likeMost", e.target.value)}
                                className="w-full p-4 bg-brand-soft-gray/50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-gold-bright/30 focus:border-brand-gold-bright/50 transition-all font-medium text-brand-olive-dark resize-none"
                            ></textarea>
                        </div>
                        <div>
                            <p className="font-bold text-brand-olive-dark mb-3">18. What can we improve?</p>
                            <textarea 
                                rows={3}
                                value={formData.improve} onChange={(e) => handleInputChange("improve", e.target.value)}
                                className="w-full p-4 bg-brand-soft-gray/50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-gold-bright/30 focus:border-brand-gold-bright/50 transition-all font-medium text-brand-olive-dark resize-none"
                            ></textarea>
                        </div>
                        <div>
                            <p className="font-bold text-brand-olive-dark mb-3">19. Any additional comments or suggestions</p>
                            <textarea 
                                rows={3}
                                value={formData.additionalComments} onChange={(e) => handleInputChange("additionalComments", e.target.value)}
                                className="w-full p-4 bg-brand-soft-gray/50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-gold-bright/30 focus:border-brand-gold-bright/50 transition-all font-medium text-brand-olive-dark resize-none"
                            ></textarea>
                        </div>
                    </div>
                </section>

                <div className="pt-8 border-t border-gray-100">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full sm:w-auto min-w-[240px] float-right py-5 px-8 rounded-full font-black text-lg flex items-center justify-center gap-3 transition-all shadow-xl bg-brand-olive-dark text-white hover:bg-brand-gold-bright hover:shadow-2xl active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Send size={20} />
                                Submit Feedback
                            </>
                        )}
                    </button>
                    <div className="clear-both"></div>
                </div>
            </form>
        </div>
    );
}
