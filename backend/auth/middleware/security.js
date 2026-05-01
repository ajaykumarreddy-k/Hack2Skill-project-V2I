const rateLimit = require('express-rate-limit');

// OTP endpoint: max 3 requests per 15min per IP
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { error: 'Too many OTP requests, try later' },
  standardHeaders: true
});

// Global API limiter: 100 req/min
const apiLimiter = rateLimit({ 
  windowMs: 60 * 1000, 
  max: 100,
  message: { error: 'Too many requests, try later' }
});

module.exports = {
  otpLimiter,
  apiLimiter
};
