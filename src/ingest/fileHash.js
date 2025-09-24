// SHA-256 hashing utility (browser + Node fallback)
// Returns hex string; shortFileHash trims for display.
export async function sha256Hex(text) {
    const enc = new TextEncoder().encode(text);
    // Browser Web Crypto
    if (typeof crypto !== 'undefined' && crypto.subtle) {
        const digest = await crypto.subtle.digest('SHA-256', enc);
        return [...new Uint8Array(digest)]
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
    }
    // Node fallback (tests)
    const { createHash } = await import('crypto');
    return createHash('sha256').update(enc).digest('hex');
}

export async function shortFileHash(text, length = 16) {
    const full = await sha256Hex(text);
    return full.slice(0, length);
}
