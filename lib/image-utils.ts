// Keep in sync with images.remotePatterns in next.config.ts.
const ALLOWED_IMAGE_HOSTS = ["t3.storageapi.dev", "images.unsplash.com", "i.pravatar.cc"];
const FALLBACK_IMAGE_SRC = "/images/bakery/sourdough.png";

// Cart items snapshot their image URL into localStorage, so a cart saved before a
// storage migration (or an expired presigned URL) can hold a src Next/Image will
// reject at runtime. Guard any locally-persisted image src through this before render.
export function getSafeImageSrc(src: string | null | undefined): string {
    if (!src) return FALLBACK_IMAGE_SRC;
    if (src.startsWith("/")) return src;

    try {
        const url = new URL(src);
        return ALLOWED_IMAGE_HOSTS.includes(url.hostname) ? src : FALLBACK_IMAGE_SRC;
    } catch {
        return FALLBACK_IMAGE_SRC;
    }
}
