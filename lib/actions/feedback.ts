"use server";

import sql from "@/lib/db";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { sanitizeFeedbackPayload } from "@/lib/security-validation";

export interface FeedbackData {
    hotelName: string;
    roomNumber: string;
    guestName: string;
    checkInDate: string;
    checkOutDate: string;
    bookingMethod: string;
    bookingMethodOther: string;
    purposeOfVisit: string;
    purposeOfVisitOther: string;
    cleanlinessRoom: string;
    cleanlinessBathroom: string;
    comfortBed: string;
    roomFacilities: string;
    bathroomFacilities: string;
    wifi: string;
    noiseLevels: string;
    safety: string;
    staffBehavior: string;
    checkInSpeed: string;
    maintenance: string;
    valueForMoney: string;
    stayAgain: string;
    recommend: string;
    likeMost: string;
    improve: string;
    additionalComments: string;
}

const FEEDBACK_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const FEEDBACK_RATE_LIMIT_MAX = 5;
const feedbackRateLimit = new Map<string, { count: number; resetAt: number }>();

async function getFeedbackClientKey() {
    const headerList = await headers();
    const forwardedFor = headerList.get("x-forwarded-for")?.split(",")[0]?.trim();
    const realIp = headerList.get("x-real-ip")?.trim();
    return forwardedFor || realIp || "unknown";
}

function consumeFeedbackRateLimit(key: string) {
    const now = Date.now();
    const current = feedbackRateLimit.get(key);
    if (!current || current.resetAt <= now) {
        feedbackRateLimit.set(key, { count: 1, resetAt: now + FEEDBACK_RATE_LIMIT_WINDOW_MS });
        return true;
    }

    if (current.count >= FEEDBACK_RATE_LIMIT_MAX) return false;
    current.count += 1;
    return true;
}

export async function submitGuestFeedback(data: FeedbackData) {
    try {
        const clientKey = await getFeedbackClientKey();
        if (!consumeFeedbackRateLimit(clientKey)) {
            return { success: false, error: "Too many feedback submissions. Please try again later." };
        }

        const parsed = sanitizeFeedbackPayload(data);
        if (!parsed.success) return { success: false, error: parsed.error || "Invalid feedback." };

        const safe = parsed.data as FeedbackData;

        await sql`
            INSERT INTO guest_feedback (
                hotel_name, room_number, guest_name, check_in_date, check_out_date,
                booking_method, booking_method_other, purpose_of_visit, purpose_of_visit_other,
                cleanliness_room, cleanliness_bathroom, comfort_bed, room_facilities, bathroom_facilities,
                wifi, noise_levels, safety, staff_behavior, check_in_speed, maintenance, value_for_money,
                stay_again, recommend, like_most, improve, additional_comments
            ) VALUES (
                ${safe.hotelName}, ${safe.roomNumber}, ${safe.guestName}, ${safe.checkInDate}, ${safe.checkOutDate},
                ${safe.bookingMethod}, ${safe.bookingMethodOther}, ${safe.purposeOfVisit}, ${safe.purposeOfVisitOther},
                ${safe.cleanlinessRoom}, ${safe.cleanlinessBathroom}, ${safe.comfortBed}, ${safe.roomFacilities}, ${safe.bathroomFacilities},
                ${safe.wifi}, ${safe.noiseLevels}, ${safe.safety}, ${safe.staffBehavior}, ${safe.checkInSpeed}, ${safe.maintenance}, ${safe.valueForMoney},
                ${safe.stayAgain}, ${safe.recommend}, ${safe.likeMost}, ${safe.improve}, ${safe.additionalComments}
            )
        `;

        revalidatePath("/receptionolivestayzk");
        
        return { success: true };
    } catch (error) {
        console.error("Failed to submit guest feedback:", error);
        return { success: false, error: "An error occurred while submitting your feedback. Please try again later." };
    }
}
