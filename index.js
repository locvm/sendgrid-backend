import Cors from "cors";

// Helper to wait for middleware (see https://vercel.com/guides/how-to-enable-cors)
function initMiddleware(middleware) {
  return (req, res) =>
    new Promise((resolve, reject) => {
      middleware(req, res, (result) =>
        result instanceof Error ? reject(result) : resolve(result)
      );
    });
}

const cors = initMiddleware(
  Cors({
    origin: "https://www.locvm.ca",
    methods: ["POST", "OPTIONS"],
  })
);

export default async function handler(req, res) {
  await cors(req, res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { to, subject, templateId, params } = req.body;

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
      return res
        .status(brevoRes.status)
        .json({ error: "Brevo error", details: data });
    }

    return res.status(200).json({ message: "Email sent successfully!", data });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
}
