"use server";

import sql from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// VULN-11: Zod schema with strict field length limits to prevent DB flooding.
// All free-text fields are limited; required fields are validated for format.
const feedbackSchema = z.object({
    hotelName:              z.string().min(1, "Hotel name required").max(100),
    roomNumber:             z.string().min(1, "Room number required").max(20),
    guestName:              z.string().max(100).optional().default(""),
    checkInDate:            z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
    checkOutDate:           z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
    bookingMethod:          z.string().max(50).optional().default(""),
    bookingMethodOther:     z.string().max(200).optional().default(""),
    purposeOfVisit:         z.string().max(50).optional().default(""),
    purposeOfVisitOther:    z.string().max(200).optional().default(""),
    cleanlinessRoom:        z.string().max(20).optional().default(""),
    cleanlinessBathroom:    z.string().max(20).optional().default(""),
    comfortBed:             z.string().max(20).optional().default(""),
    roomFacilities:         z.string().max(20).optional().default(""),
    bathroomFacilities:     z.string().max(20).optional().default(""),
    wifi:                   z.string().max(20).optional().default(""),
    noiseLevels:            z.string().max(20).optional().default(""),
    safety:                 z.string().max(20).optional().default(""),
    staffBehavior:          z.string().max(20).optional().default(""),
    checkInSpeed:           z.string().max(20).optional().default(""),
    maintenance:            z.string().max(20).optional().default(""),
    valueForMoney:          z.string().max(20).optional().default(""),
    stayAgain:              z.string().max(20).optional().default(""),
    recommend:              z.string().max(20).optional().default(""),
    // Open-text fields: generously sized but bounded
    likeMost:               z.string().max(2000).optional().default(""),
    improve:                z.string().max(2000).optional().default(""),
    additionalComments:     z.string().max(5000).optional().default(""),
});

export type FeedbackData = z.input<typeof feedbackSchema>;

export async function submitGuestFeedback(data: FeedbackData) {
    // VULN-11: Validate and sanitize all fields before touching the DB.
    const parsed = feedbackSchema.safeParse(data);
    if (!parsed.success) {
        const firstError = parsed.error.issues[0]?.message ?? "Invalid form data.";
        return { success: false, error: firstError };
    }

    const d = parsed.data;

    try {
        await sql`
            INSERT INTO guest_feedback (
                hotel_name, room_number, guest_name, check_in_date, check_out_date,
                booking_method, booking_method_other, purpose_of_visit, purpose_of_visit_other,
                cleanliness_room, cleanliness_bathroom, comfort_bed, room_facilities, bathroom_facilities,
                wifi, noise_levels, safety, staff_behavior, check_in_speed, maintenance, value_for_money,
                stay_again, recommend, like_most, improve, additional_comments
            ) VALUES (
                ${d.hotelName}, ${d.roomNumber}, ${d.guestName}, ${d.checkInDate}, ${d.checkOutDate},
                ${d.bookingMethod}, ${d.bookingMethodOther}, ${d.purposeOfVisit}, ${d.purposeOfVisitOther},
                ${d.cleanlinessRoom}, ${d.cleanlinessBathroom}, ${d.comfortBed}, ${d.roomFacilities}, ${d.bathroomFacilities},
                ${d.wifi}, ${d.noiseLevels}, ${d.safety}, ${d.staffBehavior}, ${d.checkInSpeed}, ${d.maintenance}, ${d.valueForMoney},
                ${d.stayAgain}, ${d.recommend}, ${d.likeMost}, ${d.improve}, ${d.additionalComments}
            )
        `;

        return { success: true };
    } catch (error) {
        console.error("Failed to submit guest feedback:", error);
        // VULN-13 (applied here too): never return internal error detail to client
        return { success: false, error: "An error occurred while submitting your feedback. Please try again later." };
    }
}
