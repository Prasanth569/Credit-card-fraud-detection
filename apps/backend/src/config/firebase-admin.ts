import * as admin from "firebase-admin";
import dotenv from "dotenv";
dotenv.config();

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!serviceAccountJson) {
  console.warn("⚠️ FIREBASE_SERVICE_ACCOUNT is not set. Auth features will be disabled.");
} else {
  let serviceAccount: admin.ServiceAccount;
  try {
    const parsed = JSON.parse(serviceAccountJson);
    serviceAccount = {
      projectId: parsed.project_id,
      clientEmail: parsed.client_email,
      privateKey: parsed.private_key,
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase Admin SDK initialized");
  } catch (error) {
    console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:", error);
  }
}

export const adminAuth = serviceAccountJson ? admin.auth() : null;
