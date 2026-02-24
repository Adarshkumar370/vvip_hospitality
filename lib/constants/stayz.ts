export const OLIVE_STAYZ = {
    name: "Olive Stayz",
    description: "Boutique stays optimized for corporate and medical travelers.",
    rooms: [
        {
            name: "Superior Room",
            view: "Urban Interior",
            occupancy: "2–3 Adults",
            amenities: ["175L Fridge", "AC", "E-Card"],
            bestFor: "Business Travelers",
            image: "/images/superior_room.png",
        },
        {
            name: "Executive Room",
            view: "Private Balcony",
            occupancy: "2–3 Adults",
            amenities: ["175L Fridge", "AC", "E-Card"],
            bestFor: "Long-stay Families",
            image: "/images/executive_room.png",
        },
    ],
    usps: [
        {
            title: "Zero Hidden Costs",
            description: "\"Pay-What-You-Spend\" model with individual digital meters for 100% utility transparency.",
            icon: "zap",
        },
        {
            title: "Long-Stay Optimized",
            description: "Full-sized 175L refrigerators and ample desk space designed for corporate & medical extended stays.",
            icon: "refrigerator",
        },
        {
            title: "24/7 Power Privacy",
            description: "Industrial-grade inverter backup supporting high-load appliances including ACs, ensuring zero downtime.",
            icon: "battery-charging",
        },
        {
            title: "Enterprise Connectivity",
            description: "Dedicated 200 Mbps+ Wi-Fi nodes and smart E-Card security for a seamless, tech-enabled living experience.",
            icon: "key",
        },
    ],
    medicalCare: {
        title: "Specialized Care",
        focus: ["Max Hospital", "Yashoda Hospital"],
        features: [
            "Wheelchair support",
            "Accessible bathrooms",
            "Dedicated elder-care assistance",
            "24/7 Surveillance",
            "Doctor-on-Call/Ambulance services",
        ],
    },
    dining: {
        title: "Dining & Kitchen",
        features: [
            "Fully equipped common kitchen",
            "Zomato/Swiggy friendly",
            "Breakfast & Dinner services",
        ],
    },
    amenitiesList: [
        { name: "200 Mbps+ Wi-Fi", icon: "wifi" },
        { name: "175L Full Fridge", icon: "refrigerator" },
        { name: "AC with Backup", icon: "wind" },
        { name: "Smart E-Card", icon: "key" },
        { name: "Common Kitchen", icon: "utensils" },
        { name: "Housekeeping", icon: "check" },
        { name: "Laundry Support", icon: "zap" },
        { name: "Desk Space", icon: "laptop" },
    ],
    faqs: [
        {
            question: "What is the 'Pay-What-You-Spend' electricity model?",
            answer: "Each room is equipped with an individual digital meter. Guests pay exactly for what they consume, ensuring complete transparency and no hidden utility costs.",
        },
        {
            question: "Is there any hidden charge?",
            answer: "No, we believe in 100% transparency. Your booking fee and your metered electricity (if long-stay) are the only costs.",
        },
        {
            question: "Are meals included?",
            answer: "We offer Breakfast and Dinner services. Additionally, guests have access to a fully equipped common kitchen to cook their own meals.",
        },
        {
            question: "Is the property wheelchair accessible?",
            answer: "Yes, we offer specialized care with wheelchair support, accessible bathrooms, and lift access to all floors.",
        },
        {
            question: "What are the check-in and check-out timings?",
            answer: "Our standard check-in time is 12:00 PM and check-out is 11:00 AM. Early check-in or late check-out is subject to availability.",
        },
    ],
    testimonials: [
        {
            name: "Anand Sharma",
            role: "Corporate Traveler",
            content: "The best part about Olive Stayz is the transparency. The individual electricity meter is a game changer for long stays. Highly recommended!",
            stars: 5,
        },
        {
            name: "Dr. Rekha Verma",
            role: "Medical Visitor",
            content: "Staying here while my father was at Max Hospital was a blessing. The staff is incredibly supportive and the room was perfectly accessible.",
            stars: 5,
        },
        {
            name: "James Wilson",
            role: "Digital Nomad",
            content: "Fast Wi-Fi, a proper fridge, and 24/7 power backup. It's rare to find such well-thought-out amenities in this budget range.",
            stars: 5,
        },
    ],
    rules: {
        general: [
            "Standard Check-in: 12 PM | Check-out: 11 AM",
            "Valid ID proof (Aadhar/Passport) is mandatory",
            "Smoking is strictly prohibited inside the rooms",
            "Quiet hours: 10 PM to 8 AM",
        ],
        visitors: [
            "Visitors are allowed in the common areas only",
            "Overnight visitors are not permitted without prior registration",
        ],
    },
};
