const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const router = express.Router();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Middleware to authenticate KYC token
const authenticateKycToken = (req, res, next) => {
  const token = req.body.kycToken || req.headers['x-kyc-token'];
  if (!token) return res.status(401).json({ error: 'KYC token required' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.step !== 'kyc') throw new Error('Invalid step');
    req.kycToken = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired KYC token' });
  }
};

router.post('/kyc/verify', authenticateKycToken, async (req, res) => {
  try {
    const { aadhaar, epicNumber } = req.body;

    // Validate Aadhaar format
    if (!/^\d{12}$/.test((aadhaar || '').replace(/\s/g, '')))
      return res.status(400).json({ error: 'Invalid Aadhaar format' });

    // VULN-FIX: Validate EPIC number format before processing
    // Without this, any string (including SQLi payloads before hashing, or null) is accepted.
    // EPIC format: 3 letters followed by 7 digits (e.g., ABC1234567)
    if (!epicNumber || !/^[A-Z]{3}\d{7}$/i.test(epicNumber.trim()))
      return res.status(400).json({ error: 'Invalid EPIC number format (e.g. ABC1234567)' });

    const aadhaarHash = crypto.createHash('sha256')
      .update(aadhaar.replace(/\s/g, '')).digest('hex');
    const epicHash = crypto.createHash('sha256')
      .update(epicNumber.toUpperCase()).digest('hex');

    // Check against voter roll (hash lookup only)
    const voter = await pool.query(
      `SELECT id FROM voter_roll WHERE aadhaar_hash=$1 AND epic_hash=$2`,
      [aadhaarHash, epicHash]
    );

    if (!voter.rows.length)
      return res.status(404).json({ error: 'Voter record not found' });

    // Create/update user with only hashes
    const userResult = await pool.query(
      `INSERT INTO users (aadhaar_hash, epic_hash, last_seen_at) 
       VALUES ($1, $2, NOW()) 
       ON CONFLICT (aadhaar_hash) DO UPDATE SET last_seen_at = NOW() 
       RETURNING id`,
      [aadhaarHash, epicHash]
    );

    const user = userResult.rows[0];
    const accessToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    
    res.json({ accessToken, userId: user.id });
  } catch (error) {
    console.error('KYC Verify Error:', error);
    res.status(500).json({ error: 'Internal server error during KYC' });
  }
});

module.exports = router;
