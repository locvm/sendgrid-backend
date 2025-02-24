const express = require("express");
const admin = require("firebase-admin");

const router = express.Router();

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASENEXTJS_SERVICE_ACCOUNT_CREDENTIALS)
    ),
  });
}

// Function to generate a session token
async function getSessionToken(idToken) {
  const expiresIn = 60 * 60 * 24 * 14 * 1000; // 14 days
  return await admin.auth().createSessionCookie(idToken, { expiresIn });
}

// POST: Create a session token
router.post("/verify-token", async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: "ID Token is required" });
    }

    const sessionCookie = await getSessionToken(idToken);

    // Set session cookie
    res.cookie("firebase_session", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 14 * 1000, // 14 days
    });

    res.json({ message: "Session created successfully" });
  } catch (error) {
    console.error("Error creating session:", error);
    res.status(400).json({ error: "Failed to create session" });
  }
});

// POST: Verify session token
router.post("/verify", async (req, res) => {
  try {
    const sessionCookie = req.cookies.firebase_session;
    if (!sessionCookie) {
      return res.status(401).json({ error: "No session cookie found" });
    }

    const decodedClaims = await admin
      .auth()
      .verifySessionCookie(sessionCookie, true);
    res.json({ valid: true, user: decodedClaims });
  } catch (error) {
    console.error("Session verification failed:", error);
    res.status(401).json({ valid: false, error: "Invalid session" });
  }
});

module.exports = router;
