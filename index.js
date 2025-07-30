require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 5500;

app.use(express.json());
app.use(
  cors({
    origin: ["https://www.locvm.ca", "http://localhost:3000"], // Frontend origins
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

// Email API Route
app.post("/send-emails", async (req, res) => {
  // console.log("req.body", req.body);

  const token = req.headers["x-api-token"];

  if (token !== process.env.API_SECRET_TOKEN) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const { to, subject, templateId, params, source } = req.body;

  if (source) {
    console.log(`Email request from: ${source}`);
  } else {
    console.log(`Email request (no source provided)`);
  }

  try {
    const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        from: {
          email: "communications@locvm.ca",
          name: "LOCVM Communications",
        },
        to: to,
        subject,
        templateId: Number(templateId),
        params: {
          firstName: params.firstName,
          lastName: params.lastName,
          message: params.message,
          goodbyeMessage: params.goodbyeMessage,
          link: params.link,
        },
      }),
    });

    const data = await brevoRes.json();

    if (!brevoRes.ok) {
      console.error(
        `Brevo error${source ? ` (source: ${source})` : ""}:`,
        data
      );
      return res.status(brevoRes.status).json({
        error: "Brevo error",
        source: source || "unknown",
        details: data,
      });
    }

    res.status(200).json({
      message: "Email sent successfully!",
      source: source || "unknown",
      data,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({
      error: "Internal Server Error",
      source: source || "unknown",
      details: error.message,
    });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
