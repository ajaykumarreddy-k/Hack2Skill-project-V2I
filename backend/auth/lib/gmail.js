/**
 * Gmail API integration for Vote2India voter notifications.
 * Sends OTP, confirmation, and election reminder emails.
 * @module gmail
 */
const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI
);

/**
 * Initialize Gmail API client with stored refresh token.
 * @returns {google.gmail} Authenticated Gmail client
 */
function getGmailClient() {
  oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN,
  });
  return google.gmail({ version: 'v1', auth: oauth2Client });
}

/**
 * Send voter OTP verification email.
 * @param {string} toEmail - Voter's email address
 * @param {string} otp - One-time password
 * @param {string} voterName - Voter's full name
 * @returns {Promise<Object>} Gmail send response
 */
async function sendOTPEmail(toEmail, otp, voterName) {
  const subject = 'Vote2India - Your Verification Code';
  const body = `Dear ${voterName},\n\nYour OTP is: ${otp}\nValid for 10 minutes.\n\nVote2India Team`;
  return sendEmail(toEmail, subject, body);
}

/**
 * Send vote confirmation email after successful casting.
 * @param {string} toEmail - Voter's email
 * @param {string} constituency - Voter's constituency name
 * @returns {Promise<Object>} Gmail send response
 */
async function sendVoteConfirmation(toEmail, constituency) {
  const subject = 'Vote2India - Vote Cast Successfully ✓';
  const body = `Your vote in ${constituency} has been recorded.\n\nThank you for participating in democracy.\n\nVote2India`;
  return sendEmail(toEmail, subject, body);
}

/**
 * Send election day reminder email to registered voters.
 * @param {string} toEmail - Voter email
 * @param {string} boothAddress - Assigned polling booth address
 * @returns {Promise<Object>} Gmail send response
 */
async function sendElectionReminder(toEmail, boothAddress) {
  const subject = '🗳️ Election Day Reminder - Vote2India';
  const body = `Reminder: Today is election day!\n\nYour polling booth: ${boothAddress}\n\nExercise your right to vote.\n\nVote2India`;
  return sendEmail(toEmail, subject, body);
}

/**
 * Core email sender using Gmail API.
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} body - Plain text body
 * @returns {Promise<Object>} Send result or fallback object
 */
async function sendEmail(to, subject, body) {
  const raw = Buffer.from(
    `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain\r\n\r\n${body}`
  ).toString('base64url');

  try {
    const gmail = getGmailClient();
    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw },
    });
    return { success: true, messageId: res.data.id };
  } catch (err) {
    console.error('[Gmail] Send failed, using fallback:', err.message);
    return { success: false, fallback: true, error: err.message };
  }
}

module.exports = { sendOTPEmail, sendVoteConfirmation, sendElectionReminder };
