// src/lib/retryHelper.ts
export interface RetryConfig {
    maxRetries: number;
    initialDelay: number; // milliseconds
    maxDelay: number; // milliseconds
    backoffMultiplier: number;
}

const defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    initialDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
    backoffMultiplier: 2,
};

export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    config: Partial<RetryConfig> = {}
): Promise<T> {
    const { maxRetries, initialDelay, maxDelay, backoffMultiplier } = {
        ...defaultRetryConfig,
        ...config,
    };

    let lastError: Error | null = null;
    let delay = initialDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;

            // Don't retry on authentication or validation errors
            if (
                error.message?.includes('Unauthorized') ||
                error.message?.includes('Invalid') ||
                error.message?.includes('credentials not configured') ||
                error.responseCode === 535 // SMTP auth error
            ) {
                throw error;
            }

            // Last attempt failed
            if (attempt === maxRetries) {
                break;
            }

            // Log retry attempt
            console.log(
                `Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms. Error: ${error.message}`
            );

            // Wait before retrying
            await new Promise((resolve) => setTimeout(resolve, delay));

            // Exponential backoff with max delay cap
            delay = Math.min(delay * backoffMultiplier, maxDelay);
        }
    }

    throw lastError || new Error('Max retries exceeded');
}
