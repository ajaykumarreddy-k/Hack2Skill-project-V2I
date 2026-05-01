const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const otpRoutes = require('./routes/otp');
const kycRoutes = require('./routes/kyc');
const securityMiddleware = require('./middleware/security');

dotenv.config();

const app = express();

// Global Middleware
app.use(helmet()); // Sets secure HTTP headers, disables X-Powered-By
app.disable('x-powered-by');

// Restrict CORS to the configured frontend origin only
// VULN-FIX: allow_origins=["*"] with credentials is a high-severity CORS misconfiguration
const ALLOWED_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
app.use(cors({
  origin: ALLOWED_ORIGIN,
  credentials: true
}));

// Body size limit — prevents ReDoS / large payload DoS attacks (default is 100kb)
// VULN-FIX: unbounded JSON body can exhaust server memory
app.use(express.json({ limit: '10kb' }));

// Security Middleware (Rate Limiting)
app.use('/auth/otp', securityMiddleware.otpLimiter);
app.use('/api', securityMiddleware.apiLimiter);

// Routes
app.use('/auth', otpRoutes);
app.use('/auth', kycRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'up', service: 'auth-service' });
});

const PORT = process.env.PORT || 8080;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Auth Service running on port ${PORT}`);
  });
}

module.exports = app;
