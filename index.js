require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5500;
// Import Routes
const emailRoute = require("./routes/emailRoute");
const tokenRoute = require("./routes/tokenRoute");

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000", // Allow frontend origin
    credentials: true, // Allow cookies & authentication headers
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Use Routes
app.use("/send-emails", emailRoute);
app.use(tokenRoute);

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
