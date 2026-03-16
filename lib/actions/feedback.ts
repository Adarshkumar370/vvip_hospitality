"use server";

import sql from "@/lib/db";
import { revalidatePath } from "next/cache";

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

export async function submitGuestFeedback(data: FeedbackData) {
    try {
        // Validate required basic fields
        if (!data.hotelName || !data.roomNumber || !data.checkInDate || !data.checkOutDate) {
            return { success: false, error: "Missing required fields." };
        }

        await sql`
            INSERT INTO guest_feedback (
                hotel_name, room_number, guest_name, check_in_date, check_out_date,
                booking_method, booking_method_other, purpose_of_visit, purpose_of_visit_other,
                cleanliness_room, cleanliness_bathroom, comfort_bed, room_facilities, bathroom_facilities,
                wifi, noise_levels, safety, staff_behavior, check_in_speed, maintenance, value_for_money,
                stay_again, recommend, like_most, improve, additional_comments
            ) VALUES (
                ${data.hotelName}, ${data.roomNumber}, ${data.guestName}, ${data.checkInDate}, ${data.checkOutDate},
                ${data.bookingMethod}, ${data.bookingMethodOther}, ${data.purposeOfVisit}, ${data.purposeOfVisitOther},
                ${data.cleanlinessRoom}, ${data.cleanlinessBathroom}, ${data.comfortBed}, ${data.roomFacilities}, ${data.bathroomFacilities},
                ${data.wifi}, ${data.noiseLevels}, ${data.safety}, ${data.staffBehavior}, ${data.checkInSpeed}, ${data.maintenance}, ${data.valueForMoney},
                ${data.stayAgain}, ${data.recommend}, ${data.likeMost}, ${data.improve}, ${data.additionalComments}
            )
        `;

        revalidatePath("/reception"); // Not strictly necessary since it's a client form, but good practice
        
        return { success: true };
    } catch (error) {
        console.error("Failed to submit guest feedback:", error);
        return { success: false, error: "An error occurred while submitting your feedback. Please try again later." };
    }
}
