function authenticateRequest(req, res, next) {
  const token = req.headers["x-api-token"];

  if (token !== process.env.SEND_EMAIL_API_KEY) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  return next();
}

module.exports = {
  authenticateRequest,
};
