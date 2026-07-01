import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_CART_ITEM_QUANTITY,
  normalizeCartQuantity,
  sanitizeFeedbackPayload,
  hasAllowedImageSignature,
  sanitizeLoginEmail,
  validateCheckoutIdempotencyKey,
} from "./security-validation.js";

test("normalizeCartQuantity rejects unsafe cart quantities", () => {
  assert.equal(normalizeCartQuantity("0"), null);
  assert.equal(normalizeCartQuantity("-1"), null);
  assert.equal(normalizeCartQuantity("1.5"), null);
  assert.equal(normalizeCartQuantity(String(Number.MAX_SAFE_INTEGER + 1)), null);
});

test("normalizeCartQuantity caps large safe quantities", () => {
  assert.equal(normalizeCartQuantity("9999"), MAX_CART_ITEM_QUANTITY);
  assert.equal(normalizeCartQuantity("12"), 12);
});

test("sanitizeFeedbackPayload rejects arbitrary rating strings and oversized comments", () => {
  const result = sanitizeFeedbackPayload({
    hotelName: "OLIVE STAYZ",
    roomNumber: "101",
    guestName: "Guest",
    checkInDate: "2026-06-01",
    checkOutDate: "2026-06-02",
    bookingMethod: "Website",
    bookingMethodOther: "",
    purposeOfVisit: "Business",
    purposeOfVisitOther: "",
    cleanlinessRoom: "Owned",
    cleanlinessBathroom: "Good",
    comfortBed: "Good",
    roomFacilities: "Good",
    bathroomFacilities: "Good",
    wifi: "Good",
    noiseLevels: "Good",
    safety: "Good",
    staffBehavior: "Good",
    checkInSpeed: "Good",
    maintenance: "Good",
    valueForMoney: "Good",
    stayAgain: "Yes",
    recommend: "Yes",
    likeMost: "x".repeat(1001),
    improve: "",
    additionalComments: "",
  });

  assert.equal(result.success, false);
});

test("sanitizeFeedbackPayload trims valid feedback and preserves allowed values", () => {
  const result = sanitizeFeedbackPayload({
    hotelName: "  OLIVE STAYZ  ",
    roomNumber: " 101 ",
    guestName: "",
    checkInDate: "2026-06-01",
    checkOutDate: "2026-06-02",
    bookingMethod: "Website",
    bookingMethodOther: "",
    purposeOfVisit: "Business",
    purposeOfVisitOther: "",
    cleanlinessRoom: "Excellent",
    cleanlinessBathroom: "Good",
    comfortBed: "Average",
    roomFacilities: "Poor",
    bathroomFacilities: "Good",
    wifi: "Good",
    noiseLevels: "Good",
    safety: "Good",
    staffBehavior: "Good",
    checkInSpeed: "Good",
    maintenance: "Good",
    valueForMoney: "Good",
    stayAgain: "Maybe",
    recommend: "No",
    likeMost: "Clean room",
    improve: "",
    additionalComments: "",
  });

  assert.equal(result.success, true);
  assert.equal(result.data.hotelName, "OLIVE STAYZ");
  assert.equal(result.data.roomNumber, "101");
});

test("validateCheckoutIdempotencyKey only accepts UUID values", () => {
  assert.equal(validateCheckoutIdempotencyKey("not-a-uuid"), null);
  assert.equal(
    validateCheckoutIdempotencyKey("11111111-1111-4111-8111-111111111111"),
    "11111111-1111-4111-8111-111111111111"
  );
});

test("sanitizeLoginEmail normalizes and caps login emails", () => {
  assert.equal(sanitizeLoginEmail(" USER@Example.COM "), "user@example.com");
  assert.equal(sanitizeLoginEmail("x".repeat(300) + "@example.com").length, 254);
});

test("hasAllowedImageSignature accepts matching PNG bytes", () => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  assert.equal(hasAllowedImageSignature(png, "image/png"), true);
});

test("hasAllowedImageSignature rejects mismatched MIME and file bytes", () => {
  const html = Buffer.from("<script>alert(1)</script>");
  assert.equal(hasAllowedImageSignature(html, "image/png"), false);
});
