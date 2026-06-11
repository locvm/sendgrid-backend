const test = require("node:test");
const assert = require("node:assert/strict");
const { Readable, Writable } = require("node:stream");

const { app } = require("../index");

process.env.SEND_EMAIL_API_KEY = "test-token";
process.env.BREVO_API_KEY = "brevo-test-key";

function createRequest({ method, path, headers = {}, body }) {
  const payload = body ? Buffer.from(body) : null;
  const normalizedHeaders = Object.fromEntries(
    Object.entries(headers).map(([name, value]) => [name.toLowerCase(), value])
  );

  if (payload && !normalizedHeaders["content-length"]) {
    normalizedHeaders["content-length"] = String(payload.length);
  }

  const req = new Readable({
    read() {
      if (payload) {
        this.push(payload);
      }
      this.push(null);
    },
  });

  req.method = method;
  req.url = path;
  req.headers = normalizedHeaders;
  req.connection = {};

  return req;
}

function createResponse(resolve) {
  const chunks = [];
  const res = new Writable({
    write(chunk, encoding, callback) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding));
      callback();
    },
  });

  res.statusCode = 200;
  res.headers = {};
  res.locals = {};
  res.setHeader = (name, value) => {
    res.headers[name.toLowerCase()] = value;
  };
  res.getHeader = (name) => res.headers[name.toLowerCase()];
  res.removeHeader = (name) => {
    delete res.headers[name.toLowerCase()];
  };
  res.writeHead = (statusCode, headers = {}) => {
    res.statusCode = statusCode;
    for (const [name, value] of Object.entries(headers)) {
      res.setHeader(name, value);
    }
  };
  res.end = (chunk) => {
    if (chunk) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    res.finished = true;
    resolve({
      statusCode: res.statusCode,
      headers: res.headers,
      body: Buffer.concat(chunks).toString("utf8"),
    });
  };

  return res;
}

function invokeApp(options) {
  return new Promise((resolve, reject) => {
    const req = createRequest(options);
    const res = createResponse(resolve);

    app.handle(req, res, reject);
  });
}

test("GET / returns server status text", async () => {
  const response = await invokeApp({
    method: "GET",
    path: "/",
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body, "Email backend is running.");
});

test("POST /send-emails returns 403 when API token is invalid", async () => {
  const response = await invokeApp({
    method: "POST",
    path: "/send-emails",
    headers: {
      "Content-Type": "application/json",
      "x-api-token": "wrong-token",
    },
    body: JSON.stringify({}),
  });

  assert.equal(response.statusCode, 403);
  assert.deepEqual(JSON.parse(response.body), { error: "Unauthorized" });
});

test("POST /send-emails returns Brevo errors without crashing the handler", async () => {
  global.fetch = async () => ({
    ok: false,
    status: 401,
    async json() {
      return { message: "invalid api key" };
    },
  });

  const response = await invokeApp({
    method: "POST",
    path: "/send-emails",
    headers: {
      "Content-Type": "application/json",
      "x-api-token": "test-token",
    },
    body: JSON.stringify({
      to: [{ email: "test@example.com" }],
      subject: "Hello",
      templateId: "42",
      source: "test-suite",
      params: {
        firstName: "Ada",
        lastName: "Lovelace",
        message: "Hi",
        goodbyeMessage: "Bye",
        link: "https://example.com",
      },
    }),
  });

  assert.equal(response.statusCode, 401);
  assert.deepEqual(JSON.parse(response.body), {
    error: "Brevo error",
    source: "test-suite",
    details: { message: "invalid api key" },
  });
});

test("POST /send-emails keeps the V1 fixed params contract", async () => {
  let fetchRequest;
  global.fetch = async (url, options) => {
    fetchRequest = { url, options };
    return {
      ok: true,
      status: 200,
      async json() {
        return { messageId: "v1-message-id" };
      },
    };
  };

  const response = await invokeApp({
    method: "POST",
    path: "/send-emails",
    headers: {
      "Content-Type": "application/json",
      "x-api-token": "test-token",
    },
    body: JSON.stringify({
      to: [{ email: "test@example.com" }],
      subject: "Hello",
      templateId: "42",
      source: "legacy-client",
      params: {
        firstName: "Ada",
        lastName: "Lovelace",
        message: "Hi",
        goodbyeMessage: "Bye",
        link: "https://example.com",
        ignoredField: "should-not-pass",
      },
    }),
  });

  assert.equal(response.statusCode, 200);
  assert.equal(fetchRequest.url, "https://api.brevo.com/v3/smtp/email");

  const payload = JSON.parse(fetchRequest.options.body);
  assert.deepEqual(payload.params, {
    firstName: "Ada",
    lastName: "Lovelace",
    message: "Hi",
    goodbyeMessage: "Bye",
    link: "https://example.com",
  });
  assert.equal(payload.templateId, 42);

  assert.deepEqual(JSON.parse(response.body), {
    message: "Email sent successfully!",
    source: "legacy-client",
    data: { messageId: "v1-message-id" },
  });
});

test("POST /v2/send-emails forwards arbitrary params", async () => {
  let fetchRequest;
  global.fetch = async (url, options) => {
    fetchRequest = { url, options };
    return {
      ok: true,
      status: 200,
      async json() {
        return { messageId: "v2-message-id" };
      },
    };
  };

  const response = await invokeApp({
    method: "POST",
    path: "/v2/send-emails",
    headers: {
      "Content-Type": "application/json",
      "x-api-token": "test-token",
    },
    body: JSON.stringify({
      to: [{ email: "test@example.com" }],
      subject: "Hello",
      templateId: "99",
      source: "v2-client",
      params: {
        doctorName: "Dr. Rivera",
        bookingLink: "https://example.com/book",
        customFlag: true,
      },
    }),
  });

  assert.equal(response.statusCode, 200);

  const payload = JSON.parse(fetchRequest.options.body);
  assert.deepEqual(payload.params, {
    doctorName: "Dr. Rivera",
    bookingLink: "https://example.com/book",
    customFlag: true,
  });
  assert.equal(payload.templateId, 99);

  assert.deepEqual(JSON.parse(response.body), {
    message: "Email sent successfully!",
    source: "v2-client",
    data: { messageId: "v2-message-id" },
  });
});

test("POST /v2/send-emails returns 400 when required fields are missing", async () => {
  let fetchCalled = false;
  global.fetch = async () => {
    fetchCalled = true;
    throw new Error("fetch should not be called");
  };

  const response = await invokeApp({
    method: "POST",
    path: "/v2/send-emails",
    headers: {
      "Content-Type": "application/json",
      "x-api-token": "test-token",
    },
    body: JSON.stringify({
      subject: "Hello",
      params: {
        anything: "goes",
      },
    }),
  });

  assert.equal(response.statusCode, 400);
  assert.equal(fetchCalled, false);
  assert.deepEqual(JSON.parse(response.body), {
    error: "Missing required fields",
    missing: ["to", "templateId"],
    source: "unknown",
  });
});
