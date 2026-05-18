import * as jose from "jose";

const FIREBASE_JWKS = jose.createRemoteJWKSet(
    new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);

export async function verifyFirebaseIdToken(idToken: string) {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!projectId) throw new Error("Firebase project ID is not configured on the server");
    const { payload } = await jose.jwtVerify(idToken, FIREBASE_JWKS, {
        issuer: `https://securetoken.google.com/${projectId}`,
        audience: projectId,
    });
    return payload as { phone_number?: string; uid: string; [key: string]: unknown };
}
