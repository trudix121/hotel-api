const rateLimit = {
    // Store attempts for each IP
    requests: new Map(),
    
    // Configuration
    config: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 50, // maximum requests per window
        message: 'Too many requests from this IP, please try again later.'
    },

    // Main middleware
    limitRequests: (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress;
        
        // Get or create record for this IP
        const record = rateLimit.requests.get(ip) || {
            requests: 0,
            firstRequest: Date.now(),
            blockedUntil: null
        };

        // Check if IP is blocked
        if (record.blockedUntil && record.blockedUntil > Date.now()) {
            return res.status(429).json({
                error: rateLimit.config.message,
                retryAfter: Math.ceil((record.blockedUntil - Date.now()) / 1000)
            });
        }

        // Reset counter if time window has passed
        if (Date.now() - record.firstRequest > rateLimit.config.windowMs) {
            record.requests = 0;
            record.firstRequest = Date.now();
            record.blockedUntil = null;
        }

        // Increment request count
        record.requests++;

        // Check if limit exceeded
        if (record.requests > rateLimit.config.maxRequests) {
            record.blockedUntil = Date.now() + rateLimit.config.windowMs;
            rateLimit.requests.set(ip, record);
            
            return res.status(429).json({
                error: rateLimit.config.message,
                retryAfter: Math.ceil(rateLimit.config.windowMs / 1000)
            });
        }

        // Update record
        rateLimit.requests.set(ip, record);

        // Add rate limiting info headers
        res.setHeader('X-RateLimit-Limit', rateLimit.config.maxRequests);
        res.setHeader('X-RateLimit-Remaining', rateLimit.config.maxRequests - record.requests);
        res.setHeader('X-RateLimit-Reset', Math.ceil((record.firstRequest + rateLimit.config.windowMs) / 1000));

        next();
    },

    // Method for custom configuration
    configure: (options) => {
        rateLimit.config = {
            ...rateLimit.config,
            ...options
        };
    },

    // Method for periodic cleanup of old records
    cleanup: () => {
        const now = Date.now();
        for (const [ip, record] of rateLimit.requests.entries()) {
            if (now - record.firstRequest > rateLimit.config.windowMs) {
                rateLimit.requests.delete(ip);
            }
        }
    }
};

// Start periodic cleanup (every 15 minutes)
setInterval(rateLimit.cleanup, 15 * 60 * 1000);

module.exports = rateLimit;