const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const redis = require('../lib/redis');
const twilio = require('../lib/twilio');
const { sendOTPEmail } = require('../lib/gmail');
const router = express.Router();

// VULN-FIX: Hash OTP before storing in Redis.
// If Redis is ever compromised, raw OTPs would let an attacker log in as any user.
// We store a SHA-256 hash and compare hashes at verify time.
const hashOtp = (otp) => crypto.createHash('sha256').update(otp).digest('hex');

// VULN-FIX: Constant-time comparison prevents timing attacks
// (standard === comparison leaks string length info via response time).
const safeCompare = (a, b) => {
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch { return false; }
};

/**
 * @route POST /auth/otp/send
 * @desc Send OTP to voter mobile/email
 * @access Public
 */
router.post('/otp/send', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!/^[6-9]\d{9}$/.test(phone))
      return res.status(400).json({ error: 'Invalid IN phone number' });

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const ttl = 300; // 5 minutes
    
    // In production, we'd hash the phone to use as a key
    const phoneHash = crypto.createHash('sha256').update(phone).digest('hex');

    // Store HASHED OTP in Redis with TTL
    await redis.set(`otp:${phoneHash}`, hashOtp(otp), 'EX', ttl);

    // Send via Twilio / MSG91
    if (process.env.NODE_ENV === 'production') {
      await twilio.messages.create({
        body: `Your V2I OTP is: ${otp}. Valid 5 mins.`,
        from: process.env.TWILIO_FROM,
        to: `+91${phone}`
      });
    } else {
      console.log(`[DEV] OTP for ${phone}: ${otp}`);
    }

    // Wire: Send via Gmail if email provided
    const { email, name } = req.body;
    if (email) {
      await sendOTPEmail(email, otp, name || 'Voter');
      console.log(`[WIRE] Gmail OTP sent to ${email}`);
    }

    // Return phoneHash as session token (no raw phone stored server-side)
    res.json({ sessionToken: phoneHash, expiresIn: ttl });
  } catch (error) {
    console.error('OTP Send Error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

/**
 * @route POST /auth/otp/verify
 * @desc Verify OTP and issue KYC token
 * @access Public
 */
router.post('/otp/verify', async (req, res) => {
  try {
    const { sessionToken, otp } = req.body;
    const storedOtpHash = await redis.get(`otp:${sessionToken}`);

    if (!storedOtpHash || !safeCompare(hashOtp(otp), storedOtpHash))
      return res.status(401).json({ error: 'Invalid or expired OTP' });

    await redis.del(`otp:${sessionToken}`); // Consume OTP

    // Issue short-lived KYC token for next step
    const kycToken = jwt.sign({ sessionToken, step: 'kyc' },
      process.env.JWT_SECRET, { expiresIn: '10m' });

    res.json({ kycToken });
  } catch (error) {
    console.error('OTP Verify Error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

module.exports = router;
