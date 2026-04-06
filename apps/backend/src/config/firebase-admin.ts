import * as admin from "firebase-admin";
import dotenv from "dotenv";
dotenv.config();

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!serviceAccountJson) {
  console.error("❌ FIREBASE_SERVICE_ACCOUNT is not set in .env");
  process.exit(1);
}

let serviceAccount: admin.ServiceAccount;

try {
  const parsed = JSON.parse(serviceAccountJson);
  serviceAccount = {
    projectId: parsed.project_id,
    clientEmail: parsed.client_email,
    privateKey: parsed.private_key,
  };
} catch (error) {
  console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:", error);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const adminAuth = admin.auth();
console.log("✅ Firebase Admin SDK initialized");
