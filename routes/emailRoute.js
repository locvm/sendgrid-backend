const express = require("express");
const sgMail = require("@sendgrid/mail");

const router = express.Router();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

router.post("/send-emails", async (req, res) => {
  try {
    const msg = req.body;
    await sgMail.send(msg);
    res.status(200).json({ message: "Email sent successfully!" });
  } catch (error) {
    console.error("Error sending email:", error.response?.body || error);
    res.status(500).json({
      error: "Error sending email",
      details: error.response?.body || error.message,
    });
  }
});

module.exports = router;
