require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { sendV1Email, sendV2Email } = require("./src/controllers/emailController");
const { authenticateRequest } = require("./src/middleware/authenticateRequest");

const app = express();
const PORT = process.env.PORT || 5500;

app.use(express.json());
app.use(
  cors({
    origin: ["https://www.locvm.ca", "http://localhost:3000"],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "x-api-token"],
  })
);

app.post("/send-emails", authenticateRequest, sendV1Email);
app.post("/v2/send-emails", authenticateRequest, sendV2Email);

app.get("/", (req, res) => {
  res.send("Email backend is running.");
});

module.exports = app;
module.exports.app = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}
