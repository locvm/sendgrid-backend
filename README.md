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
node index.js
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

Sends an email through the Brevo SMTP API.

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

## Testing

Run:

```bash
npm test
```

The test suite currently covers the basic health check route.
