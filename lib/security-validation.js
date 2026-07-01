const MAX_CART_ITEM_QUANTITY = 100;
const MAX_FEEDBACK_TEXT_LENGTH = 1000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const RATING_OPTIONS = new Set(["Excellent", "Good", "Average", "Poor"]);
const YES_NO_OPTIONS = new Set(["Yes", "Maybe", "No"]);
const BOOKING_METHODS = new Set(["Walk-in", "Phone reservation", "Website", "Online travel agency (OTA)", "Other"]);
const PURPOSES = new Set(["Business", "Leisure", "Family visit", "Other"]);

function asTrimmedString(value, maxLength) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function normalizeCartQuantity(value, maxQuantity = MAX_CART_ITEM_QUANTITY) {
  const quantity = Number(value);
  if (!Number.isSafeInteger(quantity) || quantity <= 0) return null;
  return Math.min(quantity, maxQuantity);
}

function sanitizeLoginEmail(value) {
  return asTrimmedString(value, 254).toLowerCase();
}

function validateCheckoutIdempotencyKey(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return UUID_RE.test(trimmed) ? trimmed : null;
}

function hasAllowedImageSignature(buffer, mimeType) {
  if (!buffer || typeof buffer.length !== "number") return false;
  const bytes = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);

  if (mimeType === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mimeType === "image/png") {
    return bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a;
  }
  if (mimeType === "image/gif") {
    return bytes.length >= 6 && (bytes.subarray(0, 6).toString("ascii") === "GIF87a" || bytes.subarray(0, 6).toString("ascii") === "GIF89a");
  }
  if (mimeType === "image/webp") {
    return bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
  }
  return false;
}

function sanitizeEnum(value, allowed, fieldName) {
  if (allowed.has(value)) return value;
  throw new Error(`Invalid ${fieldName}.`);
}

function sanitizeDate(value, fieldName) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Invalid ${fieldName}.`);
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid ${fieldName}.`);
  return value;
}

function sanitizeFeedbackPayload(data) {
  try {
    const checkInDate = sanitizeDate(data?.checkInDate, "check-in date");
    const checkOutDate = sanitizeDate(data?.checkOutDate, "check-out date");
    if (new Date(checkOutDate) < new Date(checkInDate)) {
      throw new Error("Check-out date cannot be before check-in date.");
    }

    const sanitized = {
      hotelName: asTrimmedString(data?.hotelName, 80),
      roomNumber: asTrimmedString(data?.roomNumber, 20),
      guestName: asTrimmedString(data?.guestName, 100),
      checkInDate,
      checkOutDate,
      bookingMethod: sanitizeEnum(data?.bookingMethod, BOOKING_METHODS, "booking method"),
      bookingMethodOther: asTrimmedString(data?.bookingMethodOther, 100),
      purposeOfVisit: sanitizeEnum(data?.purposeOfVisit, PURPOSES, "purpose of visit"),
      purposeOfVisitOther: asTrimmedString(data?.purposeOfVisitOther, 100),
      cleanlinessRoom: sanitizeEnum(data?.cleanlinessRoom, RATING_OPTIONS, "room cleanliness rating"),
      cleanlinessBathroom: sanitizeEnum(data?.cleanlinessBathroom, RATING_OPTIONS, "bathroom cleanliness rating"),
      comfortBed: sanitizeEnum(data?.comfortBed, RATING_OPTIONS, "bed comfort rating"),
      roomFacilities: sanitizeEnum(data?.roomFacilities, RATING_OPTIONS, "room facilities rating"),
      bathroomFacilities: sanitizeEnum(data?.bathroomFacilities, RATING_OPTIONS, "bathroom facilities rating"),
      wifi: sanitizeEnum(data?.wifi, RATING_OPTIONS, "wifi rating"),
      noiseLevels: sanitizeEnum(data?.noiseLevels, RATING_OPTIONS, "noise rating"),
      safety: sanitizeEnum(data?.safety, RATING_OPTIONS, "safety rating"),
      staffBehavior: sanitizeEnum(data?.staffBehavior, RATING_OPTIONS, "staff behavior rating"),
      checkInSpeed: sanitizeEnum(data?.checkInSpeed, RATING_OPTIONS, "check-in speed rating"),
      maintenance: sanitizeEnum(data?.maintenance, RATING_OPTIONS, "maintenance rating"),
      valueForMoney: sanitizeEnum(data?.valueForMoney, RATING_OPTIONS, "value rating"),
      stayAgain: sanitizeEnum(data?.stayAgain, YES_NO_OPTIONS, "stay-again answer"),
      recommend: sanitizeEnum(data?.recommend, YES_NO_OPTIONS, "recommend answer"),
      likeMost: asTrimmedString(data?.likeMost, MAX_FEEDBACK_TEXT_LENGTH + 1),
      improve: asTrimmedString(data?.improve, MAX_FEEDBACK_TEXT_LENGTH + 1),
      additionalComments: asTrimmedString(data?.additionalComments, MAX_FEEDBACK_TEXT_LENGTH + 1),
    };

    if (!sanitized.hotelName || !sanitized.roomNumber) throw new Error("Missing required fields.");
    for (const field of ["likeMost", "improve", "additionalComments"]) {
      if (sanitized[field].length > MAX_FEEDBACK_TEXT_LENGTH) {
        throw new Error("Feedback text is too long.");
      }
    }
    if (sanitized.bookingMethod === "Other" && !sanitized.bookingMethodOther) {
      throw new Error("Please specify the booking method.");
    }
    if (sanitized.purposeOfVisit === "Other" && !sanitized.purposeOfVisitOther) {
      throw new Error("Please specify the purpose of visit.");
    }

    return { success: true, data: sanitized };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Invalid feedback." };
  }
}

module.exports = {
  MAX_CART_ITEM_QUANTITY,
  hasAllowedImageSignature,
  normalizeCartQuantity,
  sanitizeFeedbackPayload,
  sanitizeLoginEmail,
  validateCheckoutIdempotencyKey,
};
