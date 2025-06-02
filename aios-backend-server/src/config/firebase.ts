import dotenv from "dotenv";

const firebaseAdmin = require("firebase-admin");

// Load environment variables before using them
dotenv.config();

// Verify environment variables are loaded
if (!process.env.FIREBASE_PROJECT_ID) {
  throw new Error(
    "FIREBASE_PROJECT_ID is not defined in environment variables"
  );
}

const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CERT_URL,
};

// Debug log to verify service account configuration
console.log("Firebase Config:", {
  projectId: serviceAccount.project_id,
  clientEmail: serviceAccount.client_email,
  privateKeyId: serviceAccount.private_key_id,
  hasPrivateKey: !!serviceAccount.private_key,
});

const app = firebaseAdmin.initializeApp({
  credential: firebaseAdmin.credential.cert(serviceAccount as any),
});

export const db = firebaseAdmin.firestore(app);
