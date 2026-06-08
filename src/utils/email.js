function getSourceLabel(source) {
  return source || "unknown";
}

function logEmailSource(source) {
  if (source) {
    console.log(`Email request from: ${source}`);
    return;
  }

  console.log("Email request (no source provided)");
}

function buildV1Params(params = {}) {
  return {
    firstName: params.firstName,
    lastName: params.lastName,
    message: params.message,
    goodbyeMessage: params.goodbyeMessage,
    link: params.link,
  };
}

function validateV2Body({ to, templateId, source }) {
  const missing = [];

  if (!to) missing.push("to");
  if (!templateId) missing.push("templateId");

  if (!missing.length) {
    return null;
  }

  return {
    error: "Missing required fields",
    missing,
    source: getSourceLabel(source),
  };
}

module.exports = {
  getSourceLabel,
  logEmailSource,
  buildV1Params,
  validateV2Body,
};
