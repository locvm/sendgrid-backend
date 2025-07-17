require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 5500;

// Middleware
app.use(cors()); // Allows frontend requests
app.use(express.json()); // Parses JSON request body

// Email API Route
app.post("/send-emails", async (req, res) => {
  const { to, subject, html, text } = req.body;

  try {
    const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: {
          name: "LOCVM",
          email: "communications@locvm.ca",
        },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text,
      }),
    });

    const data = await brevoRes.json();

    if (!brevoRes.ok) {
      console.error("Brevo error response:", data);
      return res.status(brevoRes.status).json({
        error: "Brevo error",
        details: data,
      });
    }

    res.status(200).json({ message: "Email sent successfully!", data });
  } catch (error) {
    console.error("Error sending email:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
