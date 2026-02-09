// src/lib/rateLimiter.ts
interface RateLimitStore {
    [key: string]: {
        count: number;
        resetTime: number;
    };
}

const store: RateLimitStore = {};

// Clean up old entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    Object.keys(store).forEach((key) => {
        if (store[key].resetTime < now) {
            delete store[key];
        }
    });
}, 5 * 60 * 1000);

export interface RateLimitConfig {
    windowMs: number; // Time window in milliseconds
    maxRequests: number; // Max requests per window
}

export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig
): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const key = identifier;

    // Initialize or get existing record
    if (!store[key] || store[key].resetTime < now) {
        store[key] = {
            count: 1,
            resetTime: now + config.windowMs,
        };
        return { allowed: true };
    }

    // Check if limit exceeded
    if (store[key].count >= config.maxRequests) {
        const retryAfter = Math.ceil((store[key].resetTime - now) / 1000);
        return { allowed: false, retryAfter };
    }

    // Increment count
    store[key].count++;
    return { allowed: true };
}

export function getRateLimitInfo(identifier: string) {
    const record = store[identifier];
    if (!record || record.resetTime < Date.now()) {
        return { count: 0, resetTime: null };
    }
    return { count: record.count, resetTime: record.resetTime };
}
