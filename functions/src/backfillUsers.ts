import admin from "firebase-admin";
import path from "path";

// Initialize Firebase Admin with service account key (adjust path as needed)
if (!admin.apps.length) {
  const serviceAccountPath = path.resolve(__dirname, "../../sdk_key.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
  });
}

const db = admin.firestore();

async function backfillUsers() {
  const listUsersResult = await admin.auth().listUsers(1000);
  let created = 0;
  for (const userRecord of listUsersResult.users) {
    const userDocRef = db.collection("users").doc(userRecord.uid);
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
      await userDocRef.set({
        email: userRecord.email,
        displayName: userRecord.displayName,
        role: "user",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      created++;
      console.log(`Created user doc for ${userRecord.email}`);
    }
  }
  console.log(`Backfill complete. Created ${created} user docs.`);
}

backfillUsers().then(() => process.exit(0)).catch(err => {
  console.error("Error during backfill:", err);
  process.exit(1);
}); 