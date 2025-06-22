/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import functions from "firebase-functions";
import admin from "firebase-admin";
import express, { Request, Response } from "express";
import cors from "cors";

if (process.env.FUNCTIONS_EMULATOR) {
  process.env.FIREBASE_AUTH_EMULATOR_HOST = "localhost:9099";
}

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Route: User Signup
app.post("/auth/signup", async (req: Request, res: Response) => {
  const { email, password, displayName, dob, gender, profilePictureUrl } = req.body;
  console.log("--> POST /auth/signup", { email, displayName, dob, gender });
  try {
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
      console.log("User already exists in Auth:", email);
    } catch (err: any) {
      if (password !== "google-oauth") {
        userRecord = await admin.auth().createUser({ email, password, displayName });
        console.log("Created new Auth user:", email);
      } else {
        console.error("Google user does not exist in Auth:", email);
        return res.status(400).send("Google user does not exist in Auth");
      }
    }

    // Always create/update Firestore user doc in both collections
    const now = admin.firestore.FieldValue.serverTimestamp();
    const userData = {
      email,
      displayName,
      role: "user",
      dob: dob || null,
      gender: gender || null,
      profilePictureUrl: profilePictureUrl || null,
      createdAt: now,
      lastLoginAt: now,
    };

    await db.collection("users").doc(userRecord.uid).set(userData, { merge: true });
    await db.collection("users_management").doc(userRecord.uid).set(userData, { merge: true });
    console.log(`User doc written for ${userRecord.uid}`);

    return res.status(201).send({ uid: userRecord.uid });
  } catch (error: any) {
    console.error("!!! ERROR in /auth/signup:", { error: error.message, body: req.body });
    return res.status(400).send({ error: "Failed to sign up.", message: error.message });
  }
});

// Route: Add Amenity (Admin only)
app.post("/admin/amenities", async (req: Request, res: Response) => {
  console.log("--> POST /admin/amenities", { body: req.body });
  try {
    const { name, description, iconUrl } = req.body;
    if (!name) {
      return res.status(400).send({ error: "Amenity name is required." });
    }
    const amenityRef = await db.collection("amenities").add({
      name,
      description,
      iconUrl,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return res.status(201).send({ id: amenityRef.id });
  } catch (error: any) {
    console.error("!!! ERROR in /admin/amenities:", { error: error.message, body: req.body });
    return res.status(500).send({ error: "Could not add amenity.", message: error.message });
  }
});

// GET all amenities
app.get("/admin/amenities", async (req: Request, res: Response) => {
  console.log("--> GET /admin/amenities");
  try {
    const snapshot = await db.collection("amenities").get();
    if (snapshot.empty) {
      console.log("No amenities found.");
      return res.status(200).json([]);
    }
    const amenities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.status(200).json(amenities);
  } catch (error: any) {
    console.error("!!! ERROR in /admin/amenities:", { error: error.message });
    return res.status(500).send({ error: "Could not fetch amenities.", message: error.message });
  }
});

// Admin-only: List users
app.get("/admin/users", async (req: Request, res: Response) => {
  console.log("--> GET /admin/users");
  try {
    const listUsersResult = await admin.auth().listUsers(1000);
    const users = listUsersResult.users.map(userRecord => ({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      disabled: userRecord.disabled,
      metadata: userRecord.metadata,
    }));
    return res.status(200).json({ users });
  } catch (error: any) {
    console.error("!!! ERROR in /admin/users:", { error: error.message });
    return res.status(500).send({ error: "Could not list users.", message: error.message });
  }
});

// GET all users from Firestore
app.get("/users", async (req: Request, res: Response) => {
  console.log("--> GET /users");
  try {
    const snapshot = await db.collection("users").get();
    if (snapshot.empty) {
      console.log("No users found in Firestore.");
      return res.status(200).json([]);
    }
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.status(200).json(users);
  } catch (error: any) {
    console.error("!!! ERROR in /users:", { error: error.message });
    return res.status(500).send({ error: "Could not fetch users.", message: error.message });
  }
});

// Ensure user doc exists
app.post("/auth/ensureUserDoc", async (req: Request, res: Response) => {
  const { uid, email, displayName, profilePictureUrl } = req.body;
  console.log("--> POST /auth/ensureUserDoc", { uid, email, displayName });

  if (!uid || !email) {
    console.warn("ensureUserDoc call missing uid or email.");
    return res.status(400).send({ error: "Missing uid or email in request body." });
  }

  try {
    const userDocRef = db.collection("users").doc(uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      const now = admin.firestore.FieldValue.serverTimestamp();
      const userData = {
        email,
        displayName: displayName || null,
        role: "user",
        createdAt: now,
        lastLoginAt: now,
        profilePictureUrl: profilePictureUrl || null,
      };
      await userDocRef.set(userData);
      await db.collection("users_management").doc(uid).set(userData);
      console.log("Created Firestore user doc for:", uid);
      return res.status(201).send({ success: true, created: true });
    } else {
      console.log("Firestore user doc already exists for:", uid);
      const userManagementRef = db.collection("users_management").doc(uid);
      const lastLogin = { lastLoginAt: admin.firestore.FieldValue.serverTimestamp() };
      await userDocRef.update(lastLogin);
      await userManagementRef.update(lastLogin);
      return res.status(200).send({ success: true, created: false });
    }
  } catch (error: any) {
    console.error("!!! ERROR in /auth/ensureUserDoc:", { error: error.message, body: req.body });
    return res.status(500).send({ error: "Failed to ensure user document.", message: error.message });
  }
});

// Admin: Add Location
app.post("/admin/locations", async (req: Request, res: Response) => {
  console.log("--> POST /admin/locations", { body: req.body });
  try {
    const { name, description, coordinates, imageUrl } = req.body;
    if (!name || !coordinates) {
      return res.status(400).send({ error: "Missing required fields: name and coordinates." });
    }
    const data = {
      name,
      description,
      coordinates,
      imageUrl,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const docRef = await db.collection("locations").add(data);
    return res.status(201).send({ id: docRef.id });
  } catch (error: any) {
    console.error("!!! ERROR in /admin/locations:", { error: error.message, body: req.body });
    return res.status(500).send({ error: "Could not add location.", message: error.message });
  }
});

// GET all locations
app.get("/admin/locations", async (req: Request, res: Response) => {
  console.log("--> GET /admin/locations");
  try {
    const snapshot = await db.collection("locations").get();
    if (snapshot.empty) {
      console.log("No locations found.");
      return res.status(200).json([]);
    }
    const locations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.status(200).json(locations);
  } catch (error: any) {
    console.error("!!! ERROR in /admin/locations:", { error: error.message });
    return res.status(500).send({ error: "Could not fetch locations.", message: error.message });
  }
});

// Admin: Add House
app.post("/admin/houses", async (req: Request, res: Response) => {
  console.log("--> POST /admin/houses", { body: req.body });
  try {
    const { name, address, description, locationRef, latitude, longitude, imageUrls } = req.body;
    if (!name || !address || !locationRef) {
      return res.status(400).send({ error: "Missing required fields: name, address, and locationRef." });
    }
    const houseRef = await db.collection("houses").add({
      name,
      address,
      description,
      locationRef,
      latitude,
      longitude,
      imageUrls: imageUrls || [],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return res.status(201).send({ id: houseRef.id });
  } catch (error: any) {
    console.error("!!! ERROR in /admin/houses:", { error: error.message, body: req.body });
    return res.status(500).send({ error: "Could not add house.", message: error.message });
  }
});

// GET all houses
app.get("/admin/houses", async (req: Request, res: Response) => {
  console.log("--> GET /admin/houses");
  try {
    const snapshot = await db.collection("houses").get();
    if (snapshot.empty) {
      console.log("No houses found.");
      return res.status(200).json([]);
    }
    const houses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.status(200).json(houses);
  } catch (error: any) {
    console.error("!!! ERROR in /admin/houses:", { error: error.message });
    return res.status(500).send({ error: "Could not fetch houses.", message: error.message });
  }
});

// Admin: Add Room
app.post("/admin/rooms", async (req: Request, res: Response) => {
  console.log("--> POST /admin/rooms", { body: req.body });
  try {
    const { houseRef, roomNumberOrName, description, pricePerNight, capacity, genderPreference, imageUrls, amenityRefs, serviceRefs, extraRefs, isAvailable } = req.body;
    if (!houseRef || !roomNumberOrName || !pricePerNight || !capacity) {
      return res.status(400).send({ error: "Missing required fields: houseRef, roomNumberOrName, pricePerNight, capacity." });
    }
    const roomRef = await db.collection("rooms").add({
      houseRef,
      roomNumberOrName,
      description,
      pricePerNight,
      capacity,
      genderPreference,
      imageUrls: imageUrls || [],
      amenityRefs: amenityRefs || [],
      serviceRefs: serviceRefs || [],
      extraRefs: extraRefs || [],
      isAvailable: isAvailable ?? true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return res.status(201).send({ id: roomRef.id });
  } catch (error: any) {
    console.error("!!! ERROR in /admin/rooms:", { error: error.message, body: req.body });
    return res.status(500).send({ error: "Could not add room.", message: error.message });
  }
});

// GET all rooms
app.get("/admin/rooms", async (req: Request, res: Response) => {
  console.log("--> GET /admin/rooms");
  try {
    const snapshot = await db.collection("rooms").get();
    if (snapshot.empty) {
      console.log("No rooms found.");
      return res.status(200).json([]);
    }
    const rooms = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.status(200).json(rooms);
  } catch (error: any) {
    console.error("!!! ERROR in /admin/rooms:", { error: error.message });
    return res.status(500).send({ error: "Could not fetch rooms.", message: error.message });
  }
});

// Admin: Add Service
app.post("/admin/services", async (req: Request, res: Response) => {
  console.log("--> POST /admin/services", { body: req.body });
  try {
    const { name, description, price, iconUrl } = req.body;
    if (!name || price === undefined) {
      return res.status(400).send({ error: "Missing required fields: name and price." });
    }
    const data = {
      name,
      description,
      price,
      iconUrl,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const docRef = await db.collection("services").add(data);
    return res.status(201).send({ id: docRef.id });
  } catch (error: any) {
    console.error("!!! ERROR in /admin/services:", { error: error.message, body: req.body });
    return res.status(500).send({ error: "Could not add service.", message: error.message });
  }
});

// GET all services
app.get("/admin/services", async (req: Request, res: Response) => {
  console.log("--> GET /admin/services");
  try {
    const snapshot = await db.collection("services").get();
    if (snapshot.empty) {
      console.log("No services found.");
      return res.status(200).json([]);
    }
    const services = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.status(200).json(services);
  } catch (error: any) {
    console.error("!!! ERROR in /admin/services:", { error: error.message });
    return res.status(500).send({ error: "Could not fetch services.", message: error.message });
  }
});

// Admin: Add Extra
app.post("/admin/extras", async (req: Request, res: Response) => {
  console.log("--> POST /admin/extras", { body: req.body });
  try {
    const { name, description, price, iconUrl } = req.body;
    if (!name || price === undefined) {
      return res.status(400).send({ error: "Missing required fields: name and price." });
    }
    const data = {
      name,
      description,
      price,
      iconUrl,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    const docRef = await db.collection("extras").add(data);
    return res.status(201).send({ id: docRef.id });
  } catch (error: any) {
    console.error("!!! ERROR in /admin/extras:", { error: error.message, body: req.body });
    return res.status(500).send({ error: "Could not add extra.", message: error.message });
  }
});

// GET all extras
app.get("/admin/extras", async (req: Request, res: Response) => {
  console.log("--> GET /admin/extras");
  try {
    const snapshot = await db.collection("extras").get();
    if (snapshot.empty) {
      console.log("No extras found.");
      return res.status(200).json([]);
    }
    const extras = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.status(200).json(extras);
  } catch (error: any) {
    console.error("!!! ERROR in /admin/extras:", { error: error.message });
    return res.status(500).send({ error: "Could not fetch extras.", message: error.message });
  }
});

// Admin: Add Bed
app.post("/admin/beds", async (req: Request, res: Response) => {
  console.log("--> POST /admin/beds", { body: req.body });
  try {
    const { roomRef, color, pricePerNight } = req.body;
    if (!roomRef || !color || pricePerNight === undefined) {
      return res.status(400).send({ error: "Missing required fields: roomRef, color, pricePerNight." });
    }
    const bedRef = await db.collection("beds").add({
      roomRef,
      color,
      pricePerNight,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return res.status(201).send({ id: bedRef.id });
  } catch (error: any) {
    console.error("!!! ERROR in /admin/beds:", { error: error.message, body: req.body });
    return res.status(500).send({ error: "Could not add bed.", message: error.message });
  }
});

// GET all beds
app.get("/admin/beds", async (req: Request, res: Response) => {
  console.log("--> GET /admin/beds");
  try {
    const snapshot = await db.collection("beds").get();
    if (snapshot.empty) {
      console.log("No beds found.");
      return res.status(200).json([]);
    }
    const beds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.status(200).json(beds);
  } catch (error: any) {
    console.error("!!! ERROR in /admin/beds:", { error: error.message });
    return res.status(500).send({ error: "Could not fetch beds.", message: error.message });
  }
});

// User: Create Booking
app.post("/bookings", async (req: Request, res: Response) => {
  console.log("--> POST /bookings", { body: req.body });
  try {
    const {
      userRef,
      roomRef,
      houseRef,
      locationRef,
      checkInDate,
      checkOutDate,
      numberOfGuests,
      totalPrice,
      selectedAmenities,
      selectedServices,
      selectedExtras,
      paymentIntentId,
    } = req.body;

    if (!userRef || !roomRef || !checkInDate || !checkOutDate || totalPrice === undefined) {
      return res.status(400).send({ error: "Missing required booking fields." });
    }

    const bookingData = {
      userRef,
      roomRef,
      houseRef,
      locationRef,
      checkInDate,
      checkOutDate,
      numberOfGuests,
      totalPrice,
      selectedAmenities: selectedAmenities || [],
      selectedServices: selectedServices || [],
      selectedExtras: selectedExtras || [],
      status: "pending",
      paymentStatus: "pending",
      paymentIntentId: paymentIntentId || null,
      bookedAt: admin.firestore.FieldValue.serverTimestamp(),
      confirmedAt: null,
      adminConfirmedByRef: null,
    };

    const docRef = await db.collection("bookings").add(bookingData);
    return res.status(201).send({ id: docRef.id });
  } catch (error: any) {
    console.error("!!! ERROR in /bookings:", { error: error.message, body: req.body });
    return res.status(500).send({ error: "Could not create booking.", message: error.message });
  }
});

// GET all bookings
app.get("/bookings", async (req: Request, res: Response) => {
  console.log("--> GET /bookings");
  try {
    const snapshot = await db.collection("bookings").get();
    if (snapshot.empty) {
      console.log("No bookings found.");
      return res.status(200).json([]);
    }
    const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.status(200).json(bookings);
  } catch (error: any) {
    console.error("!!! ERROR in /bookings:", { error: error.message });
    return res.status(500).send({ error: "Could not fetch bookings.", message: error.message });
  }
});

// PATCH endpoints for updating docs

// Helper for patching a doc in a collection
async function patchDoc(collection: string, id: string, data: any, res: Response) {
  try {
    const ref = db.collection(collection).doc(id);
    const doc = await ref.get();
    if (!doc.exists) {
      return res.status(404).send({ error: `Document not found in ${collection}: ${id}` });
    }
    await ref.update({ ...data, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
    const updated = await ref.get();
    return res.status(200).json({ id: updated.id, ...updated.data() });
  } catch (error: any) {
    console.error(`!!! ERROR in PATCH /admin/${collection}/${id}:`, error.message);
    return res.status(500).send({ error: `Could not update ${collection} doc.`, message: error.message });
  }
}

// PATCH endpoints for each collection
app.patch('/admin/houses/:id', async (req, res) => patchDoc('houses', req.params.id, req.body, res));
app.patch('/admin/rooms/:id', async (req, res) => patchDoc('rooms', req.params.id, req.body, res));
app.patch('/admin/beds/:id', async (req, res) => patchDoc('beds', req.params.id, req.body, res));
app.patch('/admin/locations/:id', async (req, res) => patchDoc('locations', req.params.id, req.body, res));
app.patch('/admin/amenities/:id', async (req, res) => patchDoc('amenities', req.params.id, req.body, res));
app.patch('/admin/services/:id', async (req, res) => patchDoc('services', req.params.id, req.body, res));
app.patch('/admin/extras/:id', async (req, res) => patchDoc('extras', req.params.id, req.body, res));

// Export the API
export const api = functions.https.onRequest(app);
