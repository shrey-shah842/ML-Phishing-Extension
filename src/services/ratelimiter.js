/**
 * Implementation of a rate limiter for a web application.
 * This rate limiter allows a maximum number of requests within a specified time window.
 */

class RateLimiter {
    /**
     * Constructor for the RateLimiter class.
     * Initializes the request times map and sets the maximum requests and time window.
     */
    constructor() {
        this.requestTimes = new Map();
        this.MAX_REQUESTS = 100; // Maximum requests per window
        this.TIME_WINDOW = 60000; // Time window in milliseconds (1 minute)
    }
    
    /**
     * Checks if a request can be made based on the rate limit.
     * @param {string} key - The key to identify the request source.
     * @returns {boolean} - Returns true if the request can be made, false otherwise.
     */

    canMakeRequest(key) {
        const now = Date.now();
        const requestHistory = this.requestTimes.get(key) || [];
        
        // Remove old requests outside time window
        const validRequests = requestHistory.filter(time => 
            time > now - this.TIME_WINDOW
        );

        if (validRequests.length < this.MAX_REQUESTS) { // If within limit then true is returned
            validRequests.push(now);
            this.requestTimes.set(key, validRequests);
            return true;
        }
        
        return false;
    }
}

export default new RateLimiter();