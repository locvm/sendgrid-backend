const test = require("node:test");
const assert = require("node:assert/strict");
const { Readable, Writable } = require("node:stream");

const { app } = require("../index");

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
