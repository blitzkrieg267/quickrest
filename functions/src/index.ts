/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';
import * as cors from 'cors';

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Middleware to check if user is admin
async function checkIfAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).send('Unauthorized');
  }
  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
      return res.status(403).send('Forbidden');
    }
    (req as any).user = decodedToken;
    next();
  } catch (error) {
    return res.status(401).send('Unauthorized');
  }
}

// Route: User Signup
app.post('/auth/signup', async (req, res) => {
  const { email, password, displayName } = req.body;
  try {
    const userRecord = await admin.auth().createUser({ email, password, displayName });
    await db.collection('users').doc(userRecord.uid).set({
      email,
      displayName,
      role: 'user',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.status(201).send({ uid: userRecord.uid });
  } catch (error: any) {
    res.status(400).send(error.message);
  }
});

// Route: Add Amenity (Admin only)
app.post('/admin/amenities', checkIfAdmin, async (req, res) => {
  const { name, description, iconUrl } = req.body;
  try {
    const amenityRef = await db.collection('amenities').add({
      name,
      description,
      iconUrl,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.status(201).send({ id: amenityRef.id });
  } catch (error: any) {
    res.status(400).send(error.message);
  }
});

// Export the API
exports.api = functions.https.onRequest(app);
