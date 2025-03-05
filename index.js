require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5500;
// Import Routes
const emailRoute = require("./routes/emailRoute");
const tokenRoute = require("./routes/tokenRoute");
const allowedOrigins = [
  "http://localhost:3000",
  "https://your-frontend.vercel.app", // Replace with your production domain
];

// Allow all Vercel preview deployments dynamically
const isVercelPreview = (origin) => {
  return origin?.endsWith(".vercel.app");
};

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin) || isVercelPreview(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  if (req.method === "OPTIONS") {
    return res.status(200).end(); // Respond to preflight request
  }

  next();
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Use Routes
app.use("/send-emails", emailRoute);
app.use(tokenRoute);

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
