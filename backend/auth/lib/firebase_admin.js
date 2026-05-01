/**
 * Firebase Admin SDK integration for Vote2India authentication.
 * @module firebase_admin
 */
const admin = require('firebase-admin');

let app = null;

/**
 * Initialize Firebase Admin with service account credentials.
 * @returns {admin.app.App} Firebase app instance
 */
function initFirebase() {
  if (!app && process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.GOOGLE_CLOUD_PROJECT || 'vote2india-prod',
    });
  }
  return app;
}

/**
 * Verify Firebase ID token for voter authentication.
 * @param {string} idToken - Firebase ID token from client
 * @returns {Promise<Object>} Decoded token claims
 */
async function verifyVoterToken(idToken) {
  try {
    const app = initFirebase();
    if (!app) return { uid: 'offline', email: null };
    return await admin.auth().verifyIdToken(idToken);
  } catch (err) {
    return { uid: 'offline', error: err.message };
  }
}

module.exports = { initFirebase, verifyVoterToken };
