const twilio = require('twilio');
const dotenv = require('dotenv');

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

let client = null;

if (accountSid && authToken) {
  client = twilio(accountSid, authToken);
} else {
  console.warn('Twilio credentials missing. SMS functionality will be disabled.');
  // Mock client for dev
  client = {
    messages: {
      create: async (opts) => {
        console.log('[MOCK SMS]', opts);
        return { sid: 'mock_sid' };
      }
    }
  };
}

module.exports = client;
