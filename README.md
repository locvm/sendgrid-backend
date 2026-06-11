# SendGrid Backend

Simple Express backend for sending transactional emails through Brevo.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file with:

```env
PORT=5500
SEND_EMAIL_API_KEY=your_internal_api_token
BREVO_API_KEY=your_brevo_api_key
```

3. Start the server:

```bash
npm start
```

The server runs on `http://localhost:5500` by default.

## Routes

### `GET /`

Health check endpoint.

Response:

```text
Email backend is running.
```

### `POST /send-emails`

Legacy email route. Sends an email through the Brevo SMTP API and forwards only the fixed V1 template params:
`firstName`, `lastName`, `message`, `goodbyeMessage`, and `link`.

Required header:

```text
x-api-token: your SEND_EMAIL_API_KEY value
```

Request body:

```json
{
  "to": [{ "email": "user@example.com", "name": "User Name" }],
  "subject": "Welcome",
  "templateId": 1,
  "params": {
    "firstName": "Jane",
    "lastName": "Doe",
    "message": "Hello",
    "goodbyeMessage": "Thanks",
    "link": "https://example.com"
  },
  "source": "website"
}
```

### `POST /v2/send-emails`

V2 email route. Sends an email through the Brevo SMTP API and forwards `params` as provided, which allows newer templates to define arbitrary fields.

Required header:

```text
x-api-token: your SEND_EMAIL_API_KEY value
```

Request body:

```json
{
  "to": [{ "email": "user@example.com", "name": "User Name" }],
  "subject": "Booking Reminder",
  "templateId": 99,
  "params": {
    "doctorName": "Dr. Rivera",
    "bookingLink": "https://example.com/book",
    "customFlag": true
  },
  "source": "scheduler"
}
```

Validation notes:

- `POST /send-emails` requires a valid `x-api-token`.
- `POST /v2/send-emails` requires a valid `x-api-token`.
- `POST /v2/send-emails` returns `400` when `to` or `templateId` is missing.

## Testing

Run:

```bash
npm test
```

The test suite covers the health check, auth failures, Brevo error passthrough, the V1 fixed params contract, and V2 validation/param forwarding.
