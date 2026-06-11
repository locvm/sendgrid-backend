const {
  buildV1Params,
  getSourceLabel,
  logEmailSource,
  validateV2Body,
} = require("../utils/email");

const BREVO_URL = "https://api.brevo.com/v3/smtp/email";
const BREVO_FROM = {
  email: "communications@locvm.ca",
  name: "LOCVM Communications",
};

function buildEmailPayload({ to, subject, templateId, params }) {
  return {
    from: BREVO_FROM,
    to,
    subject,
    templateId: Number(templateId),
    params,
  };
}

async function handleEmailRequest(payload, source, res) {
  const sourceLabel = getSourceLabel(source);

  try {
    const brevoRes = await fetch(BREVO_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY,
      },
      body: JSON.stringify(payload),
    });
    const data = await brevoRes.json();

    if (!brevoRes.ok) {
      console.error(
        `Brevo error${source ? ` (source: ${source})` : ""}:`,
        data
      );
      return res.status(brevoRes.status).json({
        error: "Brevo error",
        source: sourceLabel,
        details: data,
      });
    }

    return res.status(200).json({
      message: "Email sent successfully!",
      source: sourceLabel,
      data,
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return res.status(500).json({
      error: "Internal Server Error",
      source: sourceLabel,
      details: error.message,
    });
  }
}

module.exports = {
  async sendV1Email(req, res) {
    const { to, subject, templateId, params, source } = req.body;

    logEmailSource(source);

    return handleEmailRequest(
      buildEmailPayload({
        to,
        subject,
        templateId,
        params: buildV1Params(params),
      }),
      source,
      res
    );
  },

  async sendV2Email(req, res) {
    const { to, subject, templateId, params, source } = req.body;
    const validationError = validateV2Body({ to, templateId, source });

    if (validationError) {
      return res.status(400).json(validationError);
    }

    logEmailSource(source);

    return handleEmailRequest(
      buildEmailPayload({ to, subject, templateId, params }),
      source,
      res
    );
  },
};
