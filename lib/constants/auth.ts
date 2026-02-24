/**
 * AUTH_CONFIG — Server-side only.
 * These values MUST NOT use the NEXT_PUBLIC_ prefix.
 * All OTP send/verify calls must go through a Server Action so
 * the API key is never exposed to the browser bundle.
 */
export const AUTH_CONFIG = {
    twoFactorApiKey: process.env.TWO_FACTOR_API_KEY || "",
    otpTemplateName: process.env.OTP_TEMPLATE_NAME || "VVIP_OTP",
};
